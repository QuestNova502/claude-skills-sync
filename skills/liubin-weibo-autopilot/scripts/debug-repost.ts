import process from 'node:process';
import {
  launchWeiboBrowser,
  navigateTo,
  evaluateScript,
  clickAt,
  sleep,
  type WeiboBrowser,
} from './weibo-cdp.ts';

async function debugRepostFlow(postUrl: string): Promise<void> {
  console.log(`[debug] Testing repost for: ${postUrl}`);

  let browser: WeiboBrowser | null = null;

  try {
    browser = await launchWeiboBrowser();
    await sleep(5000);

    // Navigate to the post
    console.log('[debug] Navigating to post...');
    await navigateTo(browser, postUrl);
    await sleep(5000);

    // First check if this post is a repost
    console.log('[debug] Checking if post is a repost...');
    const postType = await evaluateScript<string>(browser, `
      (function() {
        let info = '';

        // Check for repost indicators
        const feedBody = document.querySelector('[class*="Feed_body"]');
        if (!feedBody) return 'Feed body not found';

        // Look for "转发" or "repost" indicators
        const repostCard = feedBody.querySelector('[class*="repost"], [class*="Repost"]');
        if (repostCard) {
          info += 'This is a REPOST (has repost card)\\n';
        }

        // Look for original author info
        const originalAuthor = feedBody.querySelector('[class*="origin"], [class*="Original"]');
        if (originalAuthor) {
          info += 'Has original author section\\n';
        }

        // Check the toolbar - if it's in the main feed body (not nested)
        const mainToolbar = feedBody.querySelector(':scope > [class*="toolbar"], :scope > div > [class*="toolbar"]');
        if (mainToolbar) {
          const rect = mainToolbar.getBoundingClientRect();
          info += 'Main toolbar found at Y=' + Math.round(rect.top + window.scrollY) + '\\n';
        }

        // Find ALL toolbar_left elements and their positions
        const allToolbars = document.querySelectorAll('[class*="toolbar_left"]');
        info += 'Total toolbar_left elements: ' + allToolbars.length + '\\n';
        for (let i = 0; i < allToolbars.length; i++) {
          const tb = allToolbars[i];
          const rect = tb.getBoundingClientRect();
          const firstItem = tb.querySelector('[class*="toolbar_item"]');
          const firstItemText = firstItem?.textContent?.trim().slice(0, 20);
          info += '  Toolbar ' + i + ': Y=' + Math.round(rect.top + window.scrollY) + ', text=' + firstItemText + '\\n';
        }

        return info || 'Unable to determine post type';
      })()
    `);
    console.log(postType);

    // First, scroll to top of page
    console.log('[debug] Scrolling to top of page...');
    await evaluateScript(browser, 'window.scrollTo(0, 0)');
    await sleep(1000);

    // Check what's visible at the top
    console.log('[debug] Checking what elements are visible...');
    const topElements = await evaluateScript<string>(browser, `
      (function() {
        let info = 'Scroll position: ' + window.scrollY + '\\n';

        // Get elements at specific Y positions
        const positions = [100, 200, 300, 400, 500];
        const x = 800;

        for (const y of positions) {
          const el = document.elementFromPoint(x, y);
          if (el) {
            info += 'At (' + x + ', ' + y + '): ' + el.tagName + ' class=' + el.className?.slice(0, 50) + '\\n';
          }
        }

        return info;
      })()
    `);
    console.log(topElements);

    // Now find the repost section link - maybe it's a link that changes the view
    console.log('[debug] Looking for repost/comment tabs...');
    const tabs = await evaluateScript<string>(browser, `
      (function() {
        let info = '';

        // Find any tabs or links that might switch between views
        const tabLike = document.querySelectorAll('[class*="tab"], [class*="Tab"], [class*="switch"], [class*="Switch"]');
        info += 'Tab-like elements: ' + tabLike.length + '\\n';

        // Look for "转发" and "评论" text links/tabs
        const allElements = document.querySelectorAll('a, button, span, div');
        for (const el of allElements) {
          const text = el.textContent?.trim();
          if ((text === '转发' || text === '评论') && el.offsetHeight > 0) {
            const rect = el.getBoundingClientRect();
            info += 'Found "' + text + '": ' + el.tagName + ', y=' + Math.round(rect.top) + ', class=' + el.className?.slice(0, 40) + '\\n';
          }
        }

        return info;
      })()
    `);
    console.log(tabs);

    // Try scrolling just below the post content to see the toolbar
    console.log('[debug] Scrolling to show toolbar...');

    // Find the LAST toolbar (the one for the main post, not embedded content)
    // On a repost page, the first toolbar might be for the embedded original post
    const toolbarPosition = await evaluateScript<number>(browser, `
      (function() {
        // Get all toolbars
        const allToolbars = document.querySelectorAll('[class*="toolbar_left"]');
        if (allToolbars.length === 0) return 0;

        // Use the LAST toolbar (most likely the main post's toolbar)
        // Or check which one is for the actual post view
        const feedBody = document.querySelector('[class*="Feed_body"]');
        if (!feedBody) return 0;

        // Find toolbar that's a direct descendant of feed body or its immediate container
        let mainToolbar = null;
        for (const tb of allToolbars) {
          // Check if this toolbar is at the main feed level
          const parent = tb.parentElement?.parentElement;
          if (parent && parent.closest('[class*="Feed_body"]') === feedBody) {
            // Not inside a nested repost card
            const repostCard = tb.closest('[class*="repost_card"], [class*="RepostCard"]');
            if (!repostCard) {
              mainToolbar = tb;
            }
          }
        }

        // Fallback to last toolbar if couldn't identify main one
        if (!mainToolbar) {
          mainToolbar = allToolbars[allToolbars.length - 1];
        }

        const rect = mainToolbar.getBoundingClientRect();
        return rect.top + window.scrollY;
      })()
    `);

    console.log(`Toolbar Y position (absolute): ${toolbarPosition}`);

    // Scroll so toolbar is near top of viewport
    await evaluateScript(browser, `window.scrollTo(0, ${toolbarPosition - 100})`);
    await sleep(500);

    // Now check what's at the toolbar position
    const atToolbar = await evaluateScript<string>(browser, `
      (function() {
        let info = '';

        // Find the toolbar
        const feedBody = document.querySelector('[class*="Feed_body"]');
        const toolbar = feedBody?.querySelector('[class*="toolbar_left"]');

        if (toolbar) {
          const rect = toolbar.getBoundingClientRect();
          info += 'Toolbar viewport Y: ' + Math.round(rect.top) + '\\n';

          // What's at that position?
          const x = rect.left + 50;
          const y = rect.top + rect.height / 2;
          const elementAtPoint = document.elementFromPoint(x, y);
          info += 'Element at toolbar position: ' + elementAtPoint?.tagName + ' class=' + elementAtPoint?.className?.slice(0, 60) + '\\n';
          info += 'Element text: ' + elementAtPoint?.textContent?.slice(0, 50) + '\\n';

          // Is there something covering the toolbar?
          const parent = elementAtPoint?.closest('[class*="toolbar"]');
          info += 'Is in toolbar? ' + !!parent + '\\n';

          // Check for any overlay/fixed elements
          const fixedEls = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
          info += 'Fixed positioned elements: ' + fixedEls.length + '\\n';
        }

        return info;
      })()
    `);
    console.log(atToolbar);

    // Analyze the toolbar item structure in detail - use LAST toolbar
    console.log('[debug] Analyzing toolbar item structure (using last/main toolbar)...');
    const toolbarAnalysis = await evaluateScript<string>(browser, `
      (function() {
        let info = '';
        const allToolbars = document.querySelectorAll('[class*="toolbar_left"]');

        if (allToolbars.length === 0) {
          return 'No toolbars found';
        }

        info += 'Total toolbars found: ' + allToolbars.length + '\\n';

        // Use the last toolbar (should be for the main post)
        const toolbar = allToolbars[allToolbars.length - 1];
        info += 'Using toolbar #' + (allToolbars.length - 1) + ' (last one)\\n\\n';

        const items = toolbar.querySelectorAll('[class*="toolbar_item"]');

        if (!items || items.length === 0) {
          return info + 'No toolbar items found in selected toolbar';
        }

        info += 'Found ' + items.length + ' toolbar items\\n\\n';

        // Analyze first item (repost)
        const repostItem = items[0];
        info += 'REPOST ITEM (first toolbar_item):\\n';
        info += '  tagName: ' + repostItem.tagName + '\\n';
        info += '  className: ' + repostItem.className + '\\n';
        info += '  innerHTML length: ' + repostItem.innerHTML.length + '\\n';

        // Get all child elements
        const children = repostItem.querySelectorAll('*');
        info += '  Child elements: ' + children.length + '\\n';

        for (const child of children) {
          const rect = child.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            info += '    - ' + child.tagName + ' class="' + (child.className?.slice(0, 40) || '') + '"';
            info += ' text="' + (child.textContent?.trim().slice(0, 20) || '') + '"';
            info += ' rect=(' + Math.round(rect.left) + ',' + Math.round(rect.top) + ',' + Math.round(rect.width) + 'x' + Math.round(rect.height) + ')\\n';
          }
        }

        // Look for the icon specifically
        const icon = repostItem.querySelector('[class*="Icon"], svg, i');
        if (icon) {
          const iconRect = icon.getBoundingClientRect();
          info += '\\n  ICON found: ' + icon.tagName + ' class="' + icon.className + '"\\n';
          info += '  Icon center: (' + (iconRect.left + iconRect.width/2) + ', ' + (iconRect.top + iconRect.height/2) + ')\\n';
        }

        // Look for a link/anchor in the toolbar item
        const link = repostItem.querySelector('a');
        if (link) {
          const linkRect = link.getBoundingClientRect();
          info += '\\n  LINK found: href="' + link.href + '"\\n';
          info += '  Link center: (' + (linkRect.left + linkRect.width/2) + ', ' + (linkRect.top + linkRect.height/2) + ')\\n';
        }

        return info;
      })()
    `);
    console.log(toolbarAnalysis);

    // Get the exact position - use LAST toolbar and click the ICON
    const clickPos = await evaluateScript<{ x: number; y: number; elementInfo: string; iconX?: number; iconY?: number; toolbarIndex: number }>(browser, `
      (function() {
        const allToolbars = document.querySelectorAll('[class*="toolbar_left"]');
        if (allToolbars.length === 0) return { x: 0, y: 0, elementInfo: 'no toolbar', toolbarIndex: -1 };

        // Use the LAST toolbar
        const toolbar = allToolbars[allToolbars.length - 1];
        const item = toolbar.querySelector('[class*="toolbar_item"]');

        if (!item) return { x: 0, y: 0, elementInfo: 'not found', toolbarIndex: allToolbars.length - 1 };

        // Try to find the icon or the left part of the item (not the number)
        const icon = item.querySelector('[class*="Icon"], svg, i, [class*="retweet"]');

        let x, y;
        if (icon) {
          const iconRect = icon.getBoundingClientRect();
          x = iconRect.left + iconRect.width / 2;
          y = iconRect.top + iconRect.height / 2;
        } else {
          // Click on the left side of the item (where icon should be)
          const rect = item.getBoundingClientRect();
          x = rect.left + 15; // Left side, not center
          y = rect.top + rect.height / 2;
        }

        // What element is at this exact position?
        const atPoint = document.elementFromPoint(x, y);

        return {
          x: x,
          y: y,
          elementInfo: atPoint?.tagName + ' ' + atPoint?.className?.slice(0, 50) + ' text:' + atPoint?.textContent?.slice(0, 30),
          iconX: icon ? x : undefined,
          iconY: icon ? y : undefined,
          toolbarIndex: allToolbars.length - 1
        };
      })()
    `);

    console.log(`Using toolbar index: ${clickPos.toolbarIndex}`);
    console.log(`Click position: (${clickPos.x}, ${clickPos.y})`);
    console.log(`Element at click point: ${clickPos.elementInfo}`);
    if (clickPos.iconX) {
      console.log(`Icon position confirmed: (${clickPos.iconX}, ${clickPos.iconY})`);
    }

    // If the element at that point is NOT part of the toolbar, there's something covering it
    // In that case, try clicking directly on the icon

    console.log('[debug] Clicking the repost button...');
    await clickAt(browser, clickPos.x, clickPos.y);
    await sleep(3000);

    // Check result
    const result = await evaluateScript<string>(browser, `
      (function() {
        return 'URL: ' + window.location.href;
      })()
    `);
    console.log('[debug] After click: ' + result);

    // Check checkboxes and textarea placeholder
    const uiState = await evaluateScript<string>(browser, `
      (function() {
        let info = '';

        // Check checkboxes
        const cbs = document.querySelectorAll('[class*="checkbox"]');
        for (const cb of cbs) {
          const t = cb.textContent?.trim();
          if (t && t.includes('同时')) info += 'Checkbox: "' + t + '"\\n';
        }

        // Check textarea placeholder
        const textareas = document.querySelectorAll('textarea');
        for (const ta of textareas) {
          if (ta.offsetHeight > 0) {
            info += 'Textarea placeholder: "' + ta.placeholder + '"\\n';
          }
        }

        // Check for submit button text
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent?.trim();
          if (text === '转发' || text === '评论' || text === '发送') {
            info += 'Button: "' + text + '"\\n';
          }
        }

        return info || '(no UI elements found)';
      })()
    `);
    console.log('[debug] UI State after click:');
    console.log(uiState);

    // If still showing comment mode, try clicking again but on different position
    if (uiState.includes('发布你的评论') || uiState.includes('同时转发')) {
      console.log('[debug] Still in comment mode, trying to find and click repost link...');

      // Look for the actual repost trigger
      const repostLink = await evaluateScript<{ found: boolean; x: number; y: number; info: string }>(browser, `
        (function() {
          // Look for any element that might trigger repost mode
          // Sometimes it's a specific link/button labeled "转发"
          const feedBody = document.querySelector('[class*="Feed_body"]');
          const toolbar = feedBody?.querySelector('[class*="toolbar_left"]');

          if (!toolbar) return { found: false, x: 0, y: 0, info: 'no toolbar' };

          // Try finding a link element specifically
          const links = toolbar.querySelectorAll('a');
          for (const link of links) {
            if (link.textContent?.includes('转发') || link.href?.includes('repost')) {
              const rect = link.getBoundingClientRect();
              return {
                found: true,
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                info: 'Found link: ' + link.textContent?.slice(0, 20) + ' href=' + link.href
              };
            }
          }

          // Try the toolbar item itself but click the left edge (icon area)
          const firstItem = toolbar.querySelector('[class*="toolbar_item"]');
          if (firstItem) {
            const rect = firstItem.getBoundingClientRect();
            // Click on the very left where the icon is
            return {
              found: true,
              x: rect.left + 10,
              y: rect.top + rect.height / 2,
              info: 'Clicking left edge of toolbar_item'
            };
          }

          return { found: false, x: 0, y: 0, info: 'no repost link found' };
        })()
      `);

      console.log('[debug] Repost link search: ' + repostLink.info);
      if (repostLink.found) {
        console.log('[debug] Trying second click at (' + repostLink.x + ', ' + repostLink.y + ')...');
        await clickAt(browser, repostLink.x, repostLink.y);
        await sleep(3000);

        // Check state again
        const uiState2 = await evaluateScript<string>(browser, `
          (function() {
            let info = '';
            const cbs = document.querySelectorAll('[class*="checkbox"]');
            for (const cb of cbs) {
              const t = cb.textContent?.trim();
              if (t && t.includes('同时')) info += 'Checkbox: "' + t + '"\\n';
            }
            const textareas = document.querySelectorAll('textarea');
            for (const ta of textareas) {
              if (ta.offsetHeight > 0) {
                info += 'Textarea placeholder: "' + ta.placeholder + '"\\n';
              }
            }
            return info || '(no UI elements)';
          })()
        `);
        console.log('[debug] UI State after second click:');
        console.log(uiState2);
      }
    }

    // Keep browser open
    console.log('\n[debug] Browser staying open for 90 seconds...');
    await sleep(90000);

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// CLI
const args = process.argv.slice(2);
const url = args.find(arg => arg.startsWith('http')) || 'https://weibo.com/1266097782/Qob0328tI';

await debugRepostFlow(url).catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
