import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

// AI signature for reposts
export const AI_SIGNATURE = ' ⸢ᴬᴵ ᵖᵒˢᵗᵉᵈ ᵛⁱᵃ ᶜˡᵃᵘᵈᵉ ᶜᵒᵈᵉ⸥';

export function getScriptDir(): string {
  return path.dirname(new URL(import.meta.url).pathname);
}

export function getDataDir(): string {
  return path.join(getScriptDir(), '..', 'data');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getFreePort(): Promise<number> {
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

export function findChromeExecutable(): string | undefined {
  const override = process.env.WEIBO_BROWSER_CHROME_PATH?.trim();
  if (override && fs.existsSync(override)) return override;

  const candidates: string[] = [];
  switch (process.platform) {
    case 'darwin':
      candidates.push(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      );
      break;
    case 'win32':
      candidates.push(
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      );
      break;
    default:
      candidates.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
      );
      break;
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export function getDefaultProfileDir(): string {
  const base = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  return path.join(base, 'weibo-autopilot-profile');
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

export class CdpConnection {
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

export interface WeiboBrowser {
  cdp: CdpConnection;
  sessionId: string;
  chrome: ReturnType<typeof spawn>;
  close: () => Promise<void>;
}

export async function launchWeiboBrowser(url: string = 'https://weibo.com'): Promise<WeiboBrowser> {
  const profileDir = getDefaultProfileDir();
  const chromePath = findChromeExecutable();
  if (!chromePath) throw new Error('Chrome not found. Set WEIBO_BROWSER_CHROME_PATH env var.');

  await mkdir(profileDir, { recursive: true });

  const port = await getFreePort();
  console.log(`[weibo-cdp] Launching Chrome (profile: ${profileDir})`);

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--start-maximized',
    url,
  ], { stdio: 'ignore' });

  const wsUrl = await waitForChromeDebugPort(port, 30_000);
  const cdp = await CdpConnection.connect(wsUrl, 30_000);

  const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
  let pageTarget = targets.targetInfos.find((t) => t.type === 'page' && t.url.includes('weibo.com'));

  if (!pageTarget) {
    const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url });
    pageTarget = { targetId, url, type: 'page' };
  }

  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });

  await cdp.send('Page.enable', {}, { sessionId });
  await cdp.send('Runtime.enable', {}, { sessionId });
  await cdp.send('Input.setIgnoreInputEvents', { ignore: false }, { sessionId });

  const close = async () => {
    try { await cdp.send('Browser.close', {}, { timeoutMs: 5_000 }); } catch {}
    cdp.close();
    setTimeout(() => {
      if (!chrome.killed) try { chrome.kill('SIGKILL'); } catch {}
    }, 2_000).unref?.();
    try { chrome.kill('SIGTERM'); } catch {}
  };

  return { cdp, sessionId, chrome, close };
}

export async function navigateTo(browser: WeiboBrowser, url: string): Promise<void> {
  await browser.cdp.send('Page.navigate', { url }, { sessionId: browser.sessionId });
  await sleep(3000); // Wait for page load
}

export async function evaluateScript<T>(browser: WeiboBrowser, expression: string): Promise<T> {
  const result = await browser.cdp.send<{ result: { value: T } }>('Runtime.evaluate', {
    expression,
    returnByValue: true,
  }, { sessionId: browser.sessionId });
  return result.result.value;
}

export async function waitForElement(browser: WeiboBrowser, selector: string, timeoutMs: number = 30_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await evaluateScript<boolean>(browser, `!!document.querySelector('${selector}')`);
    if (found) return true;
    await sleep(1000);
  }
  return false;
}

// Data persistence helpers
export async function loadJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  const filepath = path.join(getDataDir(), filename);
  try {
    const content = await readFile(filepath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

export async function saveJsonFile<T>(filename: string, data: T): Promise<void> {
  const dataDir = getDataDir();
  await mkdir(dataDir, { recursive: true });
  const filepath = path.join(dataDir, filename);
  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// Screenshot helper for image analysis
export async function takeScreenshot(browser: WeiboBrowser): Promise<string> {
  const result = await browser.cdp.send<{ data: string }>('Page.captureScreenshot', {
    format: 'png',
  }, { sessionId: browser.sessionId });
  return result.data; // base64 encoded
}

// Scroll helper
export async function scrollDown(browser: WeiboBrowser, pixels: number = 500): Promise<void> {
  await evaluateScript(browser, `window.scrollBy(0, ${pixels})`);
  await sleep(1000);
}

// Real mouse click using CDP Input events (bypasses JavaScript click() limitations)
export async function clickElement(browser: WeiboBrowser, selector: string): Promise<boolean> {
  // Get element position
  const pos = await evaluateScript<{ x: number; y: number; found: boolean }>(browser, `
    (function() {
      const el = document.querySelector('${selector.replace(/'/g, "\\'")}');
      if (!el) return { found: false, x: 0, y: 0 };

      const rect = el.getBoundingClientRect();
      return {
        found: true,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    })()
  `);

  if (!pos.found) {
    return false;
  }

  // Dispatch real mouse events via CDP
  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: pos.x,
    y: pos.y,
    button: 'left',
    clickCount: 1,
  }, { sessionId: browser.sessionId });

  await sleep(50);

  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: pos.x,
    y: pos.y,
    button: 'left',
    clickCount: 1,
  }, { sessionId: browser.sessionId });

  return true;
}

// Click at specific coordinates
export async function clickAt(browser: WeiboBrowser, x: number, y: number): Promise<void> {
  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  }, { sessionId: browser.sessionId });

  await sleep(50);

  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  }, { sessionId: browser.sessionId });
}
