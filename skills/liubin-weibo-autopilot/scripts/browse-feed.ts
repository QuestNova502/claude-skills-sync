import process from 'node:process';
import {
  launchWeiboBrowser,
  navigateTo,
  evaluateScript,
  waitForElement,
  scrollDown,
  takeScreenshot,
  loadJsonFile,
  sleep,
  type WeiboBrowser,
} from './weibo-cdp.ts';

// Feed URLs
const FEED_URLS: Record<string, string> = {
  'home': 'https://weibo.com',
  '关系': 'https://weibo.com',
  '国际新闻/军事': 'https://weibo.com/mygroups?gid=4420498415498239', // This needs to be actual group ID
  '足球': 'https://weibo.com/mygroups?gid=4420498415498240', // This needs to be actual group ID
};

export interface WeiboPost {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  images: string[];
  hasVideo: boolean;
  videoDescription?: string;
  timestamp: string;
  reposts: number;
  comments: number;
  likes: number;
  topComments: string[];
  url: string;
  isRepost: boolean;
  originalContent?: string;
}

export async function extractFeedPosts(browser: WeiboBrowser): Promise<WeiboPost[]> {
  console.log('[browse] Extracting posts from feed...');

  const posts = await evaluateScript<WeiboPost[]>(browser, `
    (function() {
      const posts = [];
      const feedItems = document.querySelectorAll('[class*="Feed_wrap"], [class*="card-wrap"], .WB_cardwrap');

      feedItems.forEach((item, index) => {
        try {
          // Get post ID from data attribute or generate one
          const id = item.getAttribute('mid') || item.getAttribute('data-id') || 'post_' + index + '_' + Date.now();

          // Author info
          const authorEl = item.querySelector('[class*="head_name"], .WB_info a, [class*="name"]');
          const authorName = authorEl?.textContent?.trim() || 'Unknown';
          const authorLink = authorEl?.getAttribute('href') || '';
          const authorIdMatch = authorLink.match(/\\/u\\/(\\d+)/) || authorLink.match(/\\/(\\d+)/);
          const authorId = authorIdMatch ? authorIdMatch[1] : '';

          // Content
          const contentEl = item.querySelector('[class*="detail_wbtext"], .WB_text, [class*="text"]');
          const content = contentEl?.textContent?.trim() || '';

          // Images
          const images = [];
          const imgEls = item.querySelectorAll('[class*="picture"] img, .WB_pic img, [class*="media"] img');
          imgEls.forEach(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src');
            if (src) images.push(src);
          });

          // Video
          const videoEl = item.querySelector('[class*="video"], .WB_video, video');
          const hasVideo = !!videoEl;
          const videoDesc = videoEl?.getAttribute('title') || videoEl?.getAttribute('alt') || '';

          // Timestamp
          const timeEl = item.querySelector('[class*="head_time"], .WB_from, time, [class*="time"] a');
          const timestamp = timeEl?.textContent?.trim() || timeEl?.getAttribute('title') || '';

          // Stats
          const statsText = item.textContent || '';
          const repostMatch = statsText.match(/(\\d+)\\s*转发/);
          const commentMatch = statsText.match(/(\\d+)\\s*评论/);
          const likeMatch = statsText.match(/(\\d+)\\s*赞/);

          const reposts = repostMatch ? parseInt(repostMatch[1]) : 0;
          const comments = commentMatch ? parseInt(commentMatch[1]) : 0;
          const likes = likeMatch ? parseInt(likeMatch[1]) : 0;

          // Top comments (if visible)
          const topComments = [];
          const commentEls = item.querySelectorAll('[class*="comment"] [class*="text"], .list_con .WB_text');
          commentEls.forEach(el => {
            const text = el.textContent?.trim();
            if (text) topComments.push(text);
          });

          // URL
          const linkEl = item.querySelector('a[href*="/status/"], a[href*="weibo.com"]');
          const url = linkEl?.getAttribute('href') || '';

          // Is repost
          const isRepost = !!item.querySelector('[class*="repost"], .WB_expand');
          const originalEl = item.querySelector('[class*="repost"] [class*="text"], .WB_expand .WB_text');
          const originalContent = originalEl?.textContent?.trim() || '';

          if (content || images.length > 0 || hasVideo) {
            posts.push({
              id,
              authorName,
              authorId,
              content,
              images,
              hasVideo,
              videoDescription: videoDesc,
              timestamp,
              reposts,
              comments,
              likes,
              topComments: topComments.slice(0, 3),
              url: url.startsWith('http') ? url : (url ? 'https://weibo.com' + url : ''),
              isRepost,
              originalContent: isRepost ? originalContent : undefined
            });
          }
        } catch (e) {
          console.error('Error extracting post:', e);
        }
      });

      return posts;
    })()
  `);

  console.log(`[browse] Found ${posts.length} posts`);
  return posts;
}

export async function getGroupList(browser: WeiboBrowser): Promise<Array<{ name: string; gid: string }>> {
  console.log('[browse] Getting group list...');

  // Navigate to groups page
  await navigateTo(browser, 'https://weibo.com/mygroups');
  await sleep(3000);

  const groups = await evaluateScript<Array<{ name: string; gid: string }>>(browser, `
    (function() {
      const groups = [];
      const groupItems = document.querySelectorAll('[class*="group"], .group_item, [class*="list"] a');

      groupItems.forEach(item => {
        const name = item.textContent?.trim();
        const href = item.getAttribute('href') || '';
        const gidMatch = href.match(/gid=(\\d+)/);

        if (name && gidMatch) {
          groups.push({
            name,
            gid: gidMatch[1]
          });
        }
      });

      return groups;
    })()
  `);

  console.log(`[browse] Found ${groups.length} groups`);
  return groups;
}

export async function browseAndCollect(browser: WeiboBrowser, groupName?: string): Promise<WeiboPost[]> {
  let targetUrl = FEED_URLS['home'];

  if (groupName) {
    // Try to find the group URL
    const groups = await getGroupList(browser);
    const group = groups.find(g => g.name.includes(groupName) || groupName.includes(g.name));

    if (group) {
      targetUrl = `https://weibo.com/mygroups?gid=${group.gid}`;
      console.log(`[browse] Found group "${group.name}" with gid ${group.gid}`);
    } else {
      console.log(`[browse] Group "${groupName}" not found, using home feed`);
    }
  }

  console.log(`[browse] Navigating to: ${targetUrl}`);
  await navigateTo(browser, targetUrl);
  await sleep(3000);

  // Wait for feed to load
  await waitForElement(browser, '[class*="Feed"], [class*="card"], .WB_cardwrap', 30_000);

  const allPosts: WeiboPost[] = [];
  const seenIds = new Set<string>();

  // Scroll and collect posts
  for (let i = 0; i < 10; i++) {
    const posts = await extractFeedPosts(browser);

    for (const post of posts) {
      if (!seenIds.has(post.id) && post.content) {
        seenIds.add(post.id);
        allPosts.push(post);
      }
    }

    console.log(`[browse] Scroll ${i + 1}/10, collected ${allPosts.length} unique posts`);

    await scrollDown(browser, 600);
    await sleep(2000 + Math.random() * 1000); // Random delay
  }

  return allPosts;
}

// CLI for standalone testing
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Browse Weibo feed and extract posts

Usage:
  npx -y bun browse-feed.ts [options]

Options:
  --group <name>   Browse specific group (e.g., "国际新闻/军事", "足球")
  --output <file>  Output posts to JSON file
  --help, -h       Show this help
`);
    process.exit(0);
  }

  const groupIndex = args.indexOf('--group');
  const groupName = groupIndex >= 0 ? args[groupIndex + 1] : undefined;

  let browser: WeiboBrowser | null = null;

  try {
    browser = await launchWeiboBrowser();
    await sleep(5000);

    const posts = await browseAndCollect(browser, groupName);

    console.log('\n=== Collected Posts ===');
    for (const post of posts.slice(0, 5)) {
      console.log(`\n--- ${post.authorName} (${post.timestamp}) ---`);
      console.log(post.content.slice(0, 200) + (post.content.length > 200 ? '...' : ''));
      console.log(`Reposts: ${post.reposts}, Comments: ${post.comments}, Likes: ${post.likes}`);
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
