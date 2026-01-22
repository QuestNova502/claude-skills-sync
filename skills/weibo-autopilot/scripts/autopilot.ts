import process from 'node:process';
import {
  launchWeiboBrowser,
  loadJsonFile,
  sleep,
  AI_SIGNATURE,
  type WeiboBrowser,
} from './weibo-cdp.ts';
import { browseAndCollect, type WeiboPost } from './browse-feed.ts';
import { repostWithComment, recordRepost, hasBeenReposted, loadPendingTask, clearPendingTask } from './repost.ts';

interface UserProfile {
  lastUpdated: string;
  interests: string[];
  topics: string[];
  postingStyle: {
    averageLength: number;
    usesEmoji: boolean;
    tone: string;
    commonPhrases: string[];
  };
  commentStyle: {
    averageLength: number;
    tone: string;
    commonPhrases: string[];
  };
  recentPosts: Array<{ content: string; timestamp: string }>;
  recentComments: Array<{ content: string; originalPost: string; timestamp: string }>;
}

interface AutopilotOptions {
  groupName?: string;
  intervalMinutes: number;
  dryRun: boolean;
}

// Content analysis and filtering
function analyzePostRelevance(post: WeiboPost, userProfile: UserProfile): number {
  let score = 0;

  const content = (post.content + ' ' + (post.originalContent || '')).toLowerCase();

  // Check against user interests
  for (const interest of userProfile.interests) {
    if (content.includes(interest.toLowerCase())) {
      score += 10;
    }
  }

  // Check against topics
  for (const topic of userProfile.topics) {
    if (content.includes(topic.toLowerCase())) {
      score += 15;
    }
  }

  // Engagement factor (popular posts are more interesting)
  if (post.likes > 1000) score += 5;
  if (post.reposts > 500) score += 5;
  if (post.comments > 200) score += 3;

  // Penalize very short content
  if (content.length < 20) score -= 10;

  // Penalize if already a repost (prefer original content)
  if (post.isRepost) score -= 5;

  return score;
}

function isContentSafe(post: WeiboPost): boolean {
  const content = (post.content + ' ' + (post.originalContent || '')).toLowerCase();

  // Sensitive topics to avoid
  const sensitivePatterns = [
    // Political sensitivities
    '政治', '敏感', '争议',
    // Potentially offensive
    '骂', '傻逼', '垃圾', '滚',
    // Controversial topics
    '抵制', '举报',
  ];

  for (const pattern of sensitivePatterns) {
    if (content.includes(pattern)) {
      return false;
    }
  }

  return true;
}

function generateComment(post: WeiboPost, userProfile: UserProfile): string {
  // Generate a thoughtful, non-controversial comment based on the content

  const content = post.content;
  const topics = userProfile.topics;

  // Determine the type of content
  let commentBase = '';

  // Check content type and generate appropriate comment
  if (content.includes('新闻') || content.includes('报道') || topics.includes('国际新闻')) {
    const templates = [
      '值得关注的动态。',
      '这个信息值得了解。',
      '持续关注中。',
      '记录一下。',
    ];
    commentBase = templates[Math.floor(Math.random() * templates.length)];
  } else if (content.includes('足球') || content.includes('比赛') || content.includes('球') || topics.includes('足球')) {
    const templates = [
      '精彩！',
      '好球！',
      '值得回味的瞬间。',
      '记录一下。',
    ];
    commentBase = templates[Math.floor(Math.random() * templates.length)];
  } else if (content.includes('AI') || content.includes('技术') || content.includes('科技') || topics.includes('科技')) {
    const templates = [
      '技术发展值得关注。',
      '有意思的进展。',
      '学习了。',
      '记录一下技术动态。',
    ];
    commentBase = templates[Math.floor(Math.random() * templates.length)];
  } else {
    // Generic comments
    const templates = [
      '分享一下。',
      '记录。',
      '值得关注。',
      '留个记录。',
      '有意思。',
    ];
    commentBase = templates[Math.floor(Math.random() * templates.length)];
  }

  // Add some variation based on engagement
  if (post.likes > 10000) {
    commentBase = '热门内容，' + commentBase;
  }

  return commentBase;
}

async function selectBestPost(posts: WeiboPost[], userProfile: UserProfile): Promise<WeiboPost | null> {
  // Filter and score posts
  const candidates: Array<{ post: WeiboPost; score: number }> = [];

  for (const post of posts) {
    // Skip if already reposted
    if (await hasBeenReposted(post.id)) {
      continue;
    }

    // Skip if not safe
    if (!isContentSafe(post)) {
      continue;
    }

    // Skip if no URL
    if (!post.url) {
      continue;
    }

    const score = analyzePostRelevance(post, userProfile);

    if (score > 0) {
      candidates.push({ post, score });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by score (descending)
  candidates.sort((a, b) => b.score - a.score);

  // Return the best candidate
  console.log(`[autopilot] Top candidate score: ${candidates[0].score}`);
  return candidates[0].post;
}

async function runAutopilotCycle(browser: WeiboBrowser, options: AutopilotOptions, userProfile: UserProfile): Promise<boolean> {
  console.log('\n[autopilot] Starting new cycle...');
  console.log(`[autopilot] Time: ${new Date().toLocaleString()}`);

  // Browse feed
  const posts = await browseAndCollect(browser, options.groupName);

  if (posts.length === 0) {
    console.log('[autopilot] No posts found in feed');
    return false;
  }

  // Select best post
  const selectedPost = await selectBestPost(posts, userProfile);

  if (!selectedPost) {
    console.log('[autopilot] No suitable post found for reposting');
    return false;
  }

  console.log('\n[autopilot] Selected post:');
  console.log(`  Author: ${selectedPost.authorName}`);
  console.log(`  Content: ${selectedPost.content.slice(0, 100)}...`);
  console.log(`  URL: ${selectedPost.url}`);
  console.log(`  Stats: ${selectedPost.likes} likes, ${selectedPost.reposts} reposts`);

  // Generate comment
  const comment = generateComment(selectedPost, userProfile);
  console.log(`  Generated comment: ${comment}`);

  if (options.dryRun) {
    console.log('[autopilot] DRY RUN - not actually reposting');
    return true;
  }

  // Repost
  const success = await repostWithComment(browser, selectedPost.url, comment);

  if (success) {
    await recordRepost(selectedPost.id, selectedPost.url, comment);
    console.log('[autopilot] Repost successful!');
    return true;
  } else {
    console.log('[autopilot] Repost failed');
    return false;
  }
}

async function runAutopilot(options: AutopilotOptions): Promise<void> {
  console.log('[autopilot] Starting Weibo Autopilot...');
  console.log(`[autopilot] Options: interval=${options.intervalMinutes}min, group=${options.groupName || 'home'}, dryRun=${options.dryRun}`);

  // Load user profile
  const userProfile = await loadJsonFile<UserProfile | null>('user-profile.json', null);

  if (!userProfile) {
    console.error('[autopilot] User profile not found. Please run learn-preferences.ts first.');
    console.error('[autopilot] Command: npx -y bun learn-preferences.ts');
    process.exit(1);
  }

  console.log(`[autopilot] Loaded user profile (last updated: ${userProfile.lastUpdated})`);
  console.log(`[autopilot] Interests: ${userProfile.interests.slice(0, 5).join(', ')}...`);
  console.log(`[autopilot] Topics: ${userProfile.topics.join(', ')}`);

  let browser: WeiboBrowser | null = null;

  try {
    browser = await launchWeiboBrowser();
    await sleep(5000);

    console.log('[autopilot] Browser launched, checking for pending tasks...');

    // Check for pending task from previous interrupted session
    const pendingTask = await loadPendingTask();
    if (pendingTask) {
      console.log(`[autopilot] Found pending task from ${pendingTask.startedAt}`);
      console.log(`[autopilot] Resuming repost: ${pendingTask.postUrl}`);
      console.log(`[autopilot] Comment: ${pendingTask.comment}`);

      try {
        const success = await repostWithComment(browser, pendingTask.postUrl, pendingTask.comment);
        if (success) {
          const idMatch = pendingTask.postUrl.match(/\/(\w+)$/);
          const postId = idMatch ? idMatch[1] : pendingTask.postUrl;
          await recordRepost(postId, pendingTask.postUrl, pendingTask.comment);
          console.log('[autopilot] Pending repost completed successfully!');
        } else {
          console.log('[autopilot] Pending repost failed, clearing task');
          await clearPendingTask();
        }
      } catch (error) {
        console.error(`[autopilot] Error resuming pending task: ${error instanceof Error ? error.message : String(error)}`);
        await clearPendingTask();
      }
    }

    console.log('[autopilot] Starting main loop...');

    let cycleCount = 0;

    // Main loop
    while (true) {
      cycleCount++;
      console.log(`\n========== Cycle #${cycleCount} ==========`);

      try {
        await runAutopilotCycle(browser, options, userProfile);
      } catch (error) {
        console.error(`[autopilot] Cycle error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Calculate wait time with variance (±30%)
      const baseWait = options.intervalMinutes * 60 * 1000;
      const variance = baseWait * 0.3;
      const waitTime = baseWait + (Math.random() * variance * 2 - variance);

      console.log(`[autopilot] Waiting ${Math.round(waitTime / 1000 / 60)} minutes until next cycle...`);
      await sleep(waitTime);
    }

  } catch (error) {
    console.error(`[autopilot] Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Weibo Autopilot - Autonomous browsing and reposting

Usage:
  npx -y bun autopilot.ts [options]

Options:
  --group <name>      Browse specific group (e.g., "国际新闻/军事", "足球")
  --interval <min>    Average minutes between reposts (default: 10)
  --dry-run           Browse and analyze but don't actually repost
  --help, -h          Show this help

Examples:
  # Start autopilot with default settings
  npx -y bun autopilot.ts

  # Browse only 足球 group, repost every 15 minutes
  npx -y bun autopilot.ts --group "足球" --interval 15

  # Test mode (don't actually repost)
  npx -y bun autopilot.ts --dry-run

Notes:
  - Run learn-preferences.ts first to build user profile
  - Press Ctrl+C to stop the autopilot
  - Logs are written to stdout
`);
    process.exit(0);
  }

  const groupIndex = args.indexOf('--group');
  const groupName = groupIndex >= 0 ? args[groupIndex + 1] : undefined;

  const intervalIndex = args.indexOf('--interval');
  const intervalMinutes = intervalIndex >= 0 ? parseInt(args[intervalIndex + 1]) : 10;

  const dryRun = args.includes('--dry-run');

  const options: AutopilotOptions = {
    groupName,
    intervalMinutes,
    dryRun,
  };

  await runAutopilot(options);
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
