import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const WEIBO_HOME_URL = 'https://weibo.com';

// AI signature using Unicode superscript/small characters
// ⌜ᴬᴵ ᵖᵒˢᵗᵉᵈ ᵛⁱᵃ ᶜˡᵃᵘᵈᵉ ᶜᵒᵈᵉ⌟
const AI_SIGNATURE = ' ⸢ᴬᴵ ᵖᵒˢᵗᵉᵈ ᵛⁱᵃ ᶜˡᵃᵘᵈᵉ ᶜᵒᵈᵉ⸥';

function getScriptDir(): string {
  return path.dirname(new URL(import.meta.url).pathname);
}

function copyImageToClipboard(imagePath: string): boolean {
  const copyScript = path.join(getScriptDir(), 'copy-to-clipboard.ts');
  const result = spawnSync('npx', ['-y', 'bun', copyScript, 'image', imagePath], { stdio: 'inherit' });
  return result.status === 0;
}

function pasteFromClipboard(targetApp?: string, retries = 3, delayMs = 500): boolean {
  const pasteScript = path.join(getScriptDir(), 'paste-from-clipboard.ts');
  const args = ['npx', '-y', 'bun', pasteScript, '--retries', String(retries), '--delay', String(delayMs)];
  if (targetApp) {
    args.push('--app', targetApp);
  }
  const result = spawnSync(args[0]!, args.slice(1), { stdio: 'inherit' });
  return result.status === 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unable to allocate a free TCP port.')));
        return;
      }
      const port = address.port;
      server.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });
}

function findChromeExecutable(): string | undefined {
  const override = process.env.WEIBO_BROWSER_CHROME_PATH?.trim();
  if (override && fs.existsSync(override)) return override;

  const candidates: string[] = [];
  switch (process.platform) {
    case 'darwin':
      candidates.push(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      );
      break;
    case 'win32':
      candidates.push(
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      );
      break;
    default:
      candidates.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        '/usr/bin/microsoft-edge',
      );
      break;
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function getDefaultProfileDir(): string {
  const base = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  return path.join(base, 'weibo-browser-profile');
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function waitForChromeDebugPort(port: number, timeoutMs: number): Promise<string> {
  const start = Date.now();
  let lastError: unknown = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const version = await fetchJson<{ webSocketDebuggerUrl?: string }>(`http://127.0.0.1:${port}/json/version`);
      if (version.webSocketDebuggerUrl) return version.webSocketDebuggerUrl;
      lastError = new Error('Missing webSocketDebuggerUrl');
    } catch (error) {
      lastError = error;
    }
    await sleep(200);
  }

  throw new Error(`Chrome debug port not ready: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

class CdpConnection {
  private ws: WebSocket;
  private nextId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> | null }>();
  private eventHandlers = new Map<string, Set<(params: unknown) => void>>();

  private constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer);
        const msg = JSON.parse(data) as { id?: number; method?: string; params?: unknown; result?: unknown; error?: { message?: string } };

        if (msg.method) {
          const handlers = this.eventHandlers.get(msg.method);
          if (handlers) handlers.forEach((h) => h(msg.params));
        }

        if (msg.id) {
          const pending = this.pending.get(msg.id);
          if (pending) {
            this.pending.delete(msg.id);
            if (pending.timer) clearTimeout(pending.timer);
            if (msg.error?.message) pending.reject(new Error(msg.error.message));
            else pending.resolve(msg.result);
          }
        }
      } catch {}
    });

    this.ws.addEventListener('close', () => {
      for (const [id, pending] of this.pending.entries()) {
        this.pending.delete(id);
        if (pending.timer) clearTimeout(pending.timer);
        pending.reject(new Error('CDP connection closed.'));
      }
    });
  }

  static async connect(url: string, timeoutMs: number): Promise<CdpConnection> {
    const ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connection timeout.')), timeoutMs);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed.')); });
    });
    return new CdpConnection(ws);
  }

  on(method: string, handler: (params: unknown) => void): void {
    if (!this.eventHandlers.has(method)) this.eventHandlers.set(method, new Set());
    this.eventHandlers.get(method)!.add(handler);
  }

  async send<T = unknown>(method: string, params?: Record<string, unknown>, options?: { sessionId?: string; timeoutMs?: number }): Promise<T> {
    const id = ++this.nextId;
    const message: Record<string, unknown> = { id, method };
    if (params) message.params = params;
    if (options?.sessionId) message.sessionId = options.sessionId;

    const timeoutMs = options?.timeoutMs ?? 15_000;

    const result = await new Promise<unknown>((resolve, reject) => {
      const timer = timeoutMs > 0 ? setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs) : null;
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify(message));
    });

    return result as T;
  }

  close(): void {
    try { this.ws.close(); } catch {}
  }
}

interface WeiboBrowserOptions {
  text?: string;
  images?: string[];
  submit?: boolean;
  timeoutMs?: number;
  profileDir?: string;
  chromePath?: string;
}

export async function postToWeibo(options: WeiboBrowserOptions): Promise<void> {
  const { text: rawText, images = [], submit = false, timeoutMs = 120_000, profileDir = getDefaultProfileDir() } = options;

  // Append AI signature to the text
  const text = rawText ? rawText + AI_SIGNATURE : undefined;

  const chromePath = options.chromePath ?? findChromeExecutable();
  if (!chromePath) throw new Error('Chrome not found. Set WEIBO_BROWSER_CHROME_PATH env var.');

  await mkdir(profileDir, { recursive: true });

  const port = await getFreePort();
  console.log(`[weibo-browser] Launching Chrome (profile: ${profileDir})`);

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--start-maximized',
    WEIBO_HOME_URL,
  ], { stdio: 'ignore' });

  let cdp: CdpConnection | null = null;

  try {
    const wsUrl = await waitForChromeDebugPort(port, 30_000);
    cdp = await CdpConnection.connect(wsUrl, 30_000);

    const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
    let pageTarget = targets.targetInfos.find((t) => t.type === 'page' && t.url.includes('weibo.com'));

    if (!pageTarget) {
      const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: WEIBO_HOME_URL });
      pageTarget = { targetId, url: WEIBO_HOME_URL, type: 'page' };
    }

    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });

    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Runtime.enable', {}, { sessionId });
    await cdp.send('Input.setIgnoreInputEvents', { ignore: false }, { sessionId });

    console.log('[weibo-browser] Waiting for Weibo editor...');
    await sleep(3000);

    // Wait for the Weibo editor to be ready
    // Weibo uses a textarea or contenteditable div for the composer
    const waitForEditor = async (): Promise<boolean> => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const result = await cdp!.send<{ result: { value: boolean } }>('Runtime.evaluate', {
          expression: `
            // Check for various Weibo editor selectors
            !!(
              document.querySelector('textarea.Form_input_2gtXx') ||
              document.querySelector('textarea[placeholder*="有什么新鲜事"]') ||
              document.querySelector('textarea[placeholder*="分享新鲜事"]') ||
              document.querySelector('.Form_input_2gtXx') ||
              document.querySelector('[node-type="textEl"]') ||
              document.querySelector('.woo-box-flex textarea') ||
              document.querySelector('div[contenteditable="true"]')
            )
          `,
          returnByValue: true,
        }, { sessionId });
        if (result.result.value) return true;
        await sleep(1000);
      }
      return false;
    };

    const editorFound = await waitForEditor();
    if (!editorFound) {
      console.log('[weibo-browser] Editor not found. Please log in to Weibo in the browser window.');
      console.log('[weibo-browser] Waiting for login...');
      const loggedIn = await waitForEditor();
      if (!loggedIn) throw new Error('Timed out waiting for Weibo editor. Please log in first.');
    }

    if (text) {
      console.log('[weibo-browser] Typing text...');
      await cdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            // Try different selectors for the Weibo editor
            const selectors = [
              'textarea.Form_input_2gtXx',
              'textarea[placeholder*="有什么新鲜事"]',
              'textarea[placeholder*="分享新鲜事"]',
              '.Form_input_2gtXx',
              '[node-type="textEl"]',
              '.woo-box-flex textarea',
              'div[contenteditable="true"]'
            ];

            let editor = null;
            for (const selector of selectors) {
              editor = document.querySelector(selector);
              if (editor) break;
            }

            if (editor) {
              editor.focus();
              if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
                editor.value = ${JSON.stringify(text)};
                editor.dispatchEvent(new Event('input', { bubbles: true }));
                editor.dispatchEvent(new Event('change', { bubbles: true }));
              } else {
                // For contenteditable divs
                editor.textContent = ${JSON.stringify(text)};
                editor.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          })();
        `,
      }, { sessionId });
      await sleep(500);
    }

    // Handle image uploads
    for (const imagePath of images) {
      if (!fs.existsSync(imagePath)) {
        console.warn(`[weibo-browser] Image not found: ${imagePath}`);
        continue;
      }

      console.log(`[weibo-browser] Uploading image: ${imagePath}`);

      // First, try to click the image upload button to open the file dialog area
      await cdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            // Try to find and focus the editor first
            const selectors = [
              'textarea.Form_input_2gtXx',
              'textarea[placeholder*="有什么新鲜事"]',
              '.woo-box-flex textarea',
              'div[contenteditable="true"]'
            ];
            for (const selector of selectors) {
              const editor = document.querySelector(selector);
              if (editor) {
                editor.focus();
                break;
              }
            }
          })();
        `,
      }, { sessionId });
      await sleep(300);

      // Copy image to clipboard
      if (!copyImageToClipboard(imagePath)) {
        console.warn(`[weibo-browser] Failed to copy image to clipboard: ${imagePath}`);
        continue;
      }

      // Wait for clipboard to be ready
      await sleep(500);

      // Use paste script (handles platform differences, activates Chrome)
      console.log('[weibo-browser] Pasting from clipboard...');
      const pasteSuccess = pasteFromClipboard('Google Chrome', 5, 500);

      if (!pasteSuccess) {
        // Fallback to CDP (may not work for images)
        console.log('[weibo-browser] Paste script failed, trying CDP fallback...');
        const modifiers = process.platform === 'darwin' ? 4 : 2;
        await cdp.send('Input.dispatchKeyEvent', {
          type: 'keyDown',
          key: 'v',
          code: 'KeyV',
          modifiers,
          windowsVirtualKeyCode: 86,
        }, { sessionId });
        await cdp.send('Input.dispatchKeyEvent', {
          type: 'keyUp',
          key: 'v',
          code: 'KeyV',
          modifiers,
          windowsVirtualKeyCode: 86,
        }, { sessionId });
      }

      console.log('[weibo-browser] Waiting for image upload...');
      await sleep(4000);
    }

    if (submit) {
      console.log('[weibo-browser] Submitting post...');

      // Close AI polish module if it exists, then click submit
      await cdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            // First, close AI polish module if visible (look for "关闭" text)
            const allSpans = document.querySelectorAll('span');
            for (const span of allSpans) {
              if (span.textContent?.trim() === '关闭') {
                span.click();
                break;
              }
            }
          })();
        `,
      }, { sessionId });

      await sleep(500);

      // Click submit button
      await cdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            // Find submit button - look for "发送" button specifically
            const allButtons = document.querySelectorAll('button');
            for (const btn of allButtons) {
              const text = btn.textContent?.trim();
              if (text === '发送') {
                btn.click();
                return;
              }
            }
          })();
        `,
      }, { sessionId });

      // Wait for submission to complete
      console.log('[weibo-browser] Waiting for submission to complete...');
      await sleep(3000);
      console.log('[weibo-browser] Post submitted! Browser will stay open.');
    } else {
      console.log('[weibo-browser] Post composed (preview mode). Add --submit to post.');
    }

  } finally {
    // Close browser after task
    if (cdp) {
      try { await cdp.send('Browser.close', {}, { timeoutMs: 5_000 }); } catch {}
      cdp.close();
    }
    setTimeout(() => {
      if (!chrome.killed) try { chrome.kill('SIGKILL'); } catch {}
    }, 2_000).unref?.();
    try { chrome.kill('SIGTERM'); } catch {}
  }
}

function printUsage(): never {
  console.log(`Post to Weibo (微博) using real Chrome browser

Usage:
  npx -y bun weibo-browser.ts [options] [text]

Options:
  --image <path>   Add image (can be repeated, max 9)
  --submit         Actually post (default: preview only)
  --profile <dir>  Chrome profile directory
  --help           Show this help

Examples:
  npx -y bun weibo-browser.ts "Hello from CLI!"
  npx -y bun weibo-browser.ts "Check this out" --image ./screenshot.png
  npx -y bun weibo-browser.ts "发布微博!" --image a.png --image b.png --submit
`);
  process.exit(0);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) printUsage();

  const images: string[] = [];
  let submit = false;
  let profileDir: string | undefined;
  const textParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--image' && args[i + 1]) {
      images.push(args[++i]!);
    } else if (arg === '--submit') {
      submit = true;
    } else if (arg === '--profile' && args[i + 1]) {
      profileDir = args[++i];
    } else if (!arg.startsWith('-')) {
      textParts.push(arg);
    }
  }

  const text = textParts.join(' ').trim() || undefined;

  if (!text && images.length === 0) {
    console.error('Error: Provide text or at least one image.');
    process.exit(1);
  }

  await postToWeibo({ text, images, submit, profileDir });
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
