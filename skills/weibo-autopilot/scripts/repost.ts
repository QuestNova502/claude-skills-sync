import process from 'node:process';
import {
  launchWeiboBrowser,
  navigateTo,
  evaluateScript,
  waitForElement,
  loadJsonFile,
  saveJsonFile,
  sleep,
  clickAt,
  AI_SIGNATURE,
  type WeiboBrowser,
} from './weibo-cdp.ts';

interface RepostHistory {
  reposts: Array<{
    postId: string;
    postUrl: string;
    comment: string;
    timestamp: string;
  }>;
}

interface PendingTask {
  postUrl: string;
  comment: string;
  startedAt: string;
}

/**
 * Repost a Weibo post with a comment.
 *
 * Flow:
 * 1. Navigate to the post page
 * 2. Scroll to show the LAST toolbar (important: posts may have multiple toolbars,
 *    the first one for embedded/original content, last one for current post)
 * 3. Click the repost button using real CDP mouse events (JS .click() doesn't work)
 * 4. The URL will change to include #repost, textarea placeholder becomes "说说分享心得",
 *    and checkbox changes from "同时转发" to "同时评论"
 * 5. Enter the comment in the textarea
 * 6. Close AI polish module if it appears
 * 7. Click the submit button (转发)
 */
export async function repostWithComment(
  browser: WeiboBrowser,
  postUrl: string,
  comment: string
): Promise<boolean> {
  console.log(`[repost] Reposting: ${postUrl}`);
  console.log(`[repost] Comment: ${comment}`);

  // Save pending task in case of interruption
  await savePendingTask({ postUrl, comment, startedAt: new Date().toISOString() });

  // Navigate to the post
  await navigateTo(browser, postUrl);
  await sleep(4000);

  // Wait for post to load
  console.log('[repost] Waiting for post page to load...');
  await waitForElement(browser, '[class*="Feed_body"], [class*="toolbar_item"]', 30_000);
  await sleep(2000);

  // Step 1: Scroll to show the LAST toolbar (the one for the current post, not embedded reposts)
  // A post page may have multiple toolbars - the first one for embedded/original content,
  // and the last one for the current post view
  console.log('[repost] Finding and scrolling to the main toolbar...');

  const toolbarInfo = await evaluateScript<{ count: number; scrollTo: number }>(browser, `
    (function() {
      const allToolbars = document.querySelectorAll('[class*="toolbar_left"]');
      if (allToolbars.length === 0) return { count: 0, scrollTo: 0 };

      // Use the LAST toolbar (for the current post)
      const mainToolbar = allToolbars[allToolbars.length - 1];
      const rect = mainToolbar.getBoundingClientRect();

      return {
        count: allToolbars.length,
        scrollTo: rect.top + window.scrollY - 100
      };
    })()
  `);

  console.log(`[repost] Found ${toolbarInfo.count} toolbars, scrolling to last one...`);
  await evaluateScript(browser, `window.scrollTo(0, ${toolbarInfo.scrollTo})`);
  await sleep(500);

  // Step 2: Click the repost button using real mouse events (not JS .click())
  // Use the LAST toolbar's first item (repost icon)
  console.log('[repost] Clicking repost button with real mouse event...');
  const clickPos = await evaluateScript<{ x: number; y: number; found: boolean }>(browser, `
    (function() {
      const allToolbars = document.querySelectorAll('[class*="toolbar_left"]');
      if (allToolbars.length === 0) return { x: 0, y: 0, found: false };

      // Use the LAST toolbar
      const toolbar = allToolbars[allToolbars.length - 1];
      const item = toolbar.querySelector('[class*="toolbar_item"]');
      if (!item) return { x: 0, y: 0, found: false };

      // Find the icon to click (more reliable than clicking the count number)
      const icon = item.querySelector('[class*="Icon"], svg, i, [class*="retweet"]');
      if (icon) {
        const rect = icon.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          found: true
        };
      }

      // Fallback: click left side of the item
      const rect = item.getBoundingClientRect();
      return {
        x: rect.left + 15,
        y: rect.top + rect.height / 2,
        found: true
      };
    })()
  `);

  if (!clickPos.found) {
    console.error('[repost] Could not find repost button');
    return false;
  }

  // Use real CDP mouse events instead of JavaScript .click()
  await clickAt(browser, clickPos.x, clickPos.y);
  const repostClicked = true;

  console.log('[repost] Clicked repost button, waiting for repost form...');
  await sleep(3000);

  // Verify we're in repost mode (URL should have #repost, and checkbox should say "同时评论")
  const inRepostMode = await evaluateScript<boolean>(browser, `
    (function() {
      // Check if URL has #repost
      if (window.location.hash === '#repost') return true;

      // Check if textarea placeholder changed to repost mode
      const textareas = document.querySelectorAll('textarea');
      for (const ta of textareas) {
        if (ta.placeholder === '说说分享心得' || ta.placeholder.includes('分享心得')) {
          return true;
        }
      }

      // Check if checkbox says "同时评论" instead of "同时转发"
      const checkboxes = document.querySelectorAll('[class*="checkbox"]');
      for (const cb of checkboxes) {
        if (cb.textContent?.includes('同时评论')) {
          return true;
        }
      }

      return false;
    })()
  `);

  if (!inRepostMode) {
    console.error('[repost] Failed to enter repost mode');
    return false;
  }

  console.log('[repost] Successfully entered repost mode');

  // Step 3: Wait for the repost textarea to appear
  // After clicking, URL becomes xxx#repost and a textarea with placeholder "说说分享心得" appears
  console.log('[repost] Looking for repost textarea...');

  const textareaFound = await evaluateScript<boolean>(browser, `
    (function() {
      // Look for textarea with the repost placeholder
      const textareas = document.querySelectorAll('textarea');
      for (const ta of textareas) {
        if (ta.placeholder === '说说分享心得' || ta.placeholder.includes('分享')) {
          return true;
        }
      }
      return false;
    })()
  `);

  if (!textareaFound) {
    console.log('[repost] Repost textarea not found immediately, waiting more...');
    await sleep(2000);

    // Try clicking again if the textarea still didn't appear
    const retryFound = await evaluateScript<boolean>(browser, `
      (function() {
        const textareas = document.querySelectorAll('textarea');
        for (const ta of textareas) {
          if (ta.placeholder === '说说分享心得' || ta.placeholder.includes('分享')) {
            return true;
          }
        }
        return false;
      })()
    `);

    if (!retryFound) {
      console.error('[repost] Repost textarea did not appear');
      return false;
    }
  }

  // Step 4: Input the comment
  const fullComment = comment + AI_SIGNATURE;
  console.log('[repost] Entering comment in repost textarea...');

  await evaluateScript(browser, `
    (function() {
      // Find the repost textarea
      const textareas = document.querySelectorAll('textarea');
      for (const textarea of textareas) {
        if (textarea.placeholder === '说说分享心得' || textarea.placeholder.includes('分享')) {
          // Scroll the textarea into view
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Focus and enter text
          textarea.focus();
          textarea.value = ${JSON.stringify(fullComment)};

          // Dispatch events to trigger React/Vue state updates
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));

          // Also try setting via native input simulation
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(textarea, ${JSON.stringify(fullComment)});
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }

          return true;
        }
      }
      return false;
    })()
  `);

  await sleep(1500);

  // Step 5: Close AI polish module if it appears
  console.log('[repost] Checking for AI polish module...');
  await evaluateScript(browser, `
    (function() {
      // Look for "关闭" text to close AI polish
      const spans = document.querySelectorAll('span');
      for (const span of spans) {
        if (span.textContent?.trim() === '关闭') {
          span.click();
          return true;
        }
      }
      return false;
    })()
  `);

  await sleep(500);

  // Step 6: Click the submit button
  console.log('[repost] Looking for submit button...');
  const submitted = await evaluateScript<boolean>(browser, `
    (function() {
      // The submit button should be near the repost textarea
      // Look for a button with text "转发" in the repost area

      // First, find the repost textarea
      const textareas = document.querySelectorAll('textarea');
      let repostArea = null;

      for (const ta of textareas) {
        if (ta.placeholder === '说说分享心得' || ta.placeholder.includes('分享')) {
          // Find the parent container of this textarea
          repostArea = ta.closest('[class*="repost"], [class*="Repost"], [class*="compose"], [class*="Compose"]')
            || ta.parentElement?.parentElement?.parentElement;
          break;
        }
      }

      if (repostArea) {
        // Look for submit button within this area
        const buttons = repostArea.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent?.trim();
          if (text === '转发' || text === '发送' || text === '确定') {
            console.log('Found submit button:', text);
            btn.click();
            return true;
          }
        }
      }

      // Fallback: look for any button with "转发" text that's not disabled
      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        const text = btn.textContent?.trim();
        // Skip if it's the toolbar repost button (usually has a number)
        if ((text === '转发' || text === '发送') && !btn.disabled) {
          // Make sure it's not the toolbar button
          const isInToolbar = btn.closest('[class*="toolbar"]');
          if (!isInToolbar) {
            console.log('Found submit button (fallback):', text);
            btn.click();
            return true;
          }
        }
      }

      return false;
    })()
  `);

  if (!submitted) {
    console.error('[repost] Could not find submit button');
    return false;
  }

  await sleep(3000);
  console.log('[repost] Repost submitted!');

  // Clear pending task on success
  await clearPendingTask();

  return true;
}

export async function recordRepost(postId: string, postUrl: string, comment: string): Promise<void> {
  const history = await loadJsonFile<RepostHistory>('repost-history.json', { reposts: [] });

  history.reposts.push({
    postId,
    postUrl,
    comment,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 1000 reposts
  if (history.reposts.length > 1000) {
    history.reposts = history.reposts.slice(-1000);
  }

  await saveJsonFile('repost-history.json', history);
}

export async function hasBeenReposted(postId: string): Promise<boolean> {
  const history = await loadJsonFile<RepostHistory>('repost-history.json', { reposts: [] });
  return history.reposts.some(r => r.postId === postId);
}

// Pending task management for interruption recovery
export async function savePendingTask(task: PendingTask): Promise<void> {
  await saveJsonFile('pending-task.json', task);
}

export async function loadPendingTask(): Promise<PendingTask | null> {
  return await loadJsonFile<PendingTask | null>('pending-task.json', null);
}

export async function clearPendingTask(): Promise<void> {
  await saveJsonFile('pending-task.json', null);
}

// CLI for manual repost
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Repost a Weibo post with comment

Usage:
  npx -y bun repost.ts <weibo-url> [options]

Options:
  --comment <text>   Custom comment (default: auto-generated)
  --help, -h         Show this help

Examples:
  npx -y bun repost.ts https://weibo.com/1234567890/AbCdEfG
  npx -y bun repost.ts https://weibo.com/1234567890/AbCdEfG --comment "Great post!"
`);
    process.exit(0);
  }

  const url = args.find(arg => arg.startsWith('http'));
  if (!url) {
    console.error('Error: Please provide a Weibo URL');
    process.exit(1);
  }

  const commentIndex = args.indexOf('--comment');
  const comment = commentIndex >= 0 ? args[commentIndex + 1] : '转发微博';

  let browser: WeiboBrowser | null = null;

  try {
    browser = await launchWeiboBrowser();
    await sleep(5000);

    const success = await repostWithComment(browser, url, comment);

    if (success) {
      // Extract post ID from URL
      const idMatch = url.match(/\/(\w+)$/);
      const postId = idMatch ? idMatch[1] : url;
      await recordRepost(postId, url, comment);
      console.log('[repost] Success!');
    } else {
      console.error('[repost] Failed to repost');
      process.exit(1);
    }

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Only run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  await main().catch((err) => {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
