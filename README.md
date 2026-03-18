# Claude Skills Sync

一个产品经理的 Claude Code Skills 个人收藏库。

这里的 skills 来自 AI 推荐和微博网友分享，我只是做了整理和备份。感谢各位原作者的无私分享。

---

## 快速安装

```bash
# 使用 Vercel 的 add-skill 工具一键安装
npx add-skill QuestNova502/claude-skills-sync

# 或者手动安装
git clone https://github.com/QuestNova502/claude-skills-sync.git
cp -r claude-skills-sync/skills/* ~/.claude/skills/
```

---

## 近期重点更新

### skill-creator — Skill 创建与性能评测

来自 [Anthropic 官方](https://github.com/anthropics/skills/tree/main/skills/skill-creator)，用于创建、优化和评测 Claude Code Skills。包含 eval 基准测试、自动描述优化、性能报告生成等能力。

> 来源：微博 [@宝玉xp 分享](https://weibo.com/5078115336/QvbFkc23L)

### Apify Agent Skills — 数据采集全家桶 (12 个)

来自 [Apify 官方](https://github.com/apify/agent-skills)，覆盖网页抓取、线索获取、电商数据、竞品情报、品牌监控、KOL 发现、趋势分析等场景。

> 来源：微博 [@Simon_阿文 分享](https://weibo.com/1706699904/QuvL3me8u)

---

## Skills 内容 (111 个)

### 办公文档处理

| Skill | 用途 | 来源 |
|-------|------|------|
| docx | Word 文档读写 | [Anthropic 官方](https://github.com/anthropics/skills) |
| pptx | PowerPoint 制作 | [Anthropic 官方](https://github.com/anthropics/skills) |
| pdf | PDF 处理 | [Anthropic 官方](https://github.com/anthropics/skills) |
| xlsx | Excel 表格处理 | [Anthropic 官方](https://github.com/anthropics/skills) |
| weekly-industry-report | 周度产业研究报告生成 | 自定义 |

### 微博自动化 (原创)

基于宝玉的 X 自动发博 Skill 改造，适配微博平台：

| Skill | 用途 | 说明 |
|-------|------|------|
| liubin-post-to-weibo | 发布微博 | 通过 CDP 控制浏览器发微博，支持文字和图片，自动添加 AI 签名 |
| liubin-weibo-autopilot | 微博自动驾驶 | 学习用户风格，定时浏览 Feed，智能筛选并自动转发感兴趣的内容 |

### 内容创作 (Baoyu 系列)

来自微博网友 [@宝玉xp](https://github.com/jimliu/baoyu-skills) 的分享：

| Skill | 用途 |
|-------|------|
| baoyu-article-illustrator | 文章配图生成 |
| baoyu-cover-image | 封面图制作 |
| baoyu-xhs-images | 小红书图片制作 |
| baoyu-slide-deck | 幻灯片制作 |
| baoyu-comic | 漫画生成 |
| baoyu-infographic | 信息图设计 |
| baoyu-post-to-wechat | 发布到微信公众号 |
| baoyu-post-to-x | 发布到 X (Twitter) |
| baoyu-compress-image | 图片压缩 |
| baoyu-danger-gemini-web | Gemini 图片生成 |
| baoyu-danger-x-to-markdown | X 帖子转 Markdown |

### Apify 数据采集 (12 个)

来自 [Apify](https://github.com/apify/agent-skills) 的官方 skills：

| Skill | 用途 |
|-------|------|
| apify-actor-development | Actor 开发调试部署 |
| apify-actorization | 项目转换为 Actor |
| apify-ultimate-scraper | 通用网页抓取 |
| apify-lead-generation | B2B/B2C 线索获取 |
| apify-ecommerce | 电商数据采集 |
| apify-competitor-intelligence | 竞品情报分析 |
| apify-brand-reputation-monitoring | 品牌口碑监控 |
| apify-content-analytics | 内容分析 |
| apify-audience-analysis | 受众分析 |
| apify-influencer-discovery | KOL 发现 |
| apify-market-research | 市场调研 |
| apify-trend-analysis | 趋势分析 |

### 产品与项目管理

| Skill | 用途 |
|-------|------|
| product-manager-toolkit | 产品经理工具箱 (RICE、PRD、用户访谈) |
| product-manager-prompts | 25 个产品管理框架提示词 |
| product-strategist | 产品战略 (OKR、市场分析) |
| agile-product-owner | 敏捷产品负责人 |
| jira-integration | Jira 集成 |
| git-workflow | Git 工作流 |
| github-project | GitHub 项目管理 |
| competitive-ads-extractor | 竞品广告分析 |
| meeting-insights-analyzer | 会议洞察分析 |

### 营销与增长

| Skill | 用途 |
|-------|------|
| marketing-strategy-pmm | 产品营销与 GTM 策略 |
| marketing-demand-acquisition | 多渠道获客与 SEO |
| content-creator | SEO 内容创作 |
| content-research-writer | 内容研究写作 |
| social-media-analyzer | 社交媒体分析 |
| lead-research-assistant | 线索研究 |
| app-store-optimization | ASO 优化 |
| domain-name-brainstormer | 域名创意生成 |

### 工程开发

| Skill | 用途 |
|-------|------|
| senior-architect | 软件架构设计 |
| senior-frontend | 前端开发 (React/Next.js) |
| senior-backend | 后端开发 (Node/Go/Python) |
| senior-fullstack | 全栈开发 |
| senior-devops | DevOps 与 CI/CD |
| senior-qa | 质量保证与测试 |
| senior-data-engineer | 数据工程 |
| senior-data-scientist | 数据科学 |
| senior-ml-engineer | 机器学习工程 |
| senior-computer-vision | 计算机视觉 |
| senior-prompt-engineer | 提示词工程 |
| code-reviewer | 代码审查 |
| tdd-guide | 测试驱动开发 |
| mcp-builder | MCP Server 开发 |
| skill-creator | Skill 创建与优化 |
| aws-solution-architect | AWS 架构方案 |
| tech-stack-evaluator | 技术栈评估 |

### 安全与合规

| Skill | 用途 |
|-------|------|
| senior-security | 安全工程 |
| senior-secops | 安全运营 |
| information-security-manager-iso27001 | ISO 27001 信息安全 |
| isms-audit-expert | ISMS 审计 |
| gdpr-dsgvo-expert | GDPR 合规 |

### 设计与创意

| Skill | 用途 |
|-------|------|
| frontend-design | 前端界面设计 |
| canvas-design | 海报/视觉设计 |
| ui-design-system | UI 设计系统 |
| ux-researcher-designer | UX 研究设计 |
| brand-guidelines | Anthropic 品牌风格 |
| theme-factory | 主题样式工厂 |
| algorithmic-art | 生成艺术 |
| image-enhancer | 图片增强 |
| slack-gif-creator | Slack GIF 制作 |

### 领导力与战略

| Skill | 用途 |
|-------|------|
| ceo-advisor | CEO 战略顾问 |
| cto-advisor | CTO 技术顾问 |
| cto-advisor-cntest | CTO 技术顾问 (中文版) |

### 效率工具

| Skill | 用途 |
|-------|------|
| ffmpeg | 音视频处理 |
| file-organizer | 文件整理 |
| invoice-organizer | 发票整理 |
| changelog-generator | 变更日志生成 |
| tailored-resume-generator | 简历定制 |
| developer-growth-analysis | 开发者成长分析 |
| find-skills | Skill 发现安装 |
| webapp-testing | Web 应用测试 |
| doc-coauthoring | 文档协作 |
| internal-comms | 内部沟通模板 |
| ms365-tenant-manager | M365 管理 |
| context7 | 上下文管理 |
| release-skills | Skill 发布工作流 |

---

## 致谢

本仓库的 skills 来自以下作者和项目，感谢他们的开源分享：

| 来源 | 作者/项目 | 内容 |
|------|----------|------|
| [Anthropic Skills](https://github.com/anthropics/skills) | Anthropic 官方 | 文档处理、skill-creator 等 |
| [Apify Agent Skills](https://github.com/apify/agent-skills) | Apify 官方 | 数据采集 (12 个) |
| [claude-skills](https://github.com/alirezarezvani/claude-skills) | Alireza Rezvani | 工程/产品/营销 (约 50 个) |
| [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | ComposioHQ | 竞品分析、会议洞察等 |
| [claude-code-marketplace](https://github.com/netresearch/claude-code-marketplace) | Netresearch | Jira、Git 集成 |
| [product-manager-prompts](https://github.com/deanpeters/product-manager-prompts) | Dean Peters | 产品经理提示词 |
| [baoyu-skills](https://github.com/jimliu/baoyu-skills) | 宝玉 (@jimliu) | 内容创作、社交发布 (11 个) |

---

## 推荐工具

- [add-skill](https://github.com/vercel-labs/add-skill) - Vercel 出品，统一安装各种 Agent 的 skills
- [skills.sh](https://skills.sh) - Skills 市场，搜索和一键安装

---

## 备注

- 仓库不含任何敏感信息，可放心使用
- 各 skills 遵循原作者的开源协议
- 有问题欢迎提 Issue

---

## 更新日志

### v2.0.0 (2026-03-18)
- 全量同步本地 111 个 skills
- 移除医疗器械质量相关 skills (9 个：ISO 13485、MDR、FDA 等)
- 新增 Apify 数据采集系列 (12 个) - 来自 [apify/agent-skills](https://github.com/apify/agent-skills)
- 更新 skill-creator 到最新版 - 来自 [anthropics/skills](https://github.com/anthropics/skills)
- 新增 cto-advisor-cntest、ffmpeg、find-skills、weekly-industry-report 等
- 微博 skills 更名：post-to-weibo → liubin-post-to-weibo, weibo-autopilot → liubin-weibo-autopilot
- 清理重复的 skills/skills/ 子目录

### v1.2.0 (2026-01-22)
- 新增微博自动化 Skills (2 个)
- Skills 总数：167 个

### v1.1.0 (2026-01-21)
- 新增 Baoyu Skills 系列 (12 个) - 内容创作和社交发布
- Skills 总数：165 个

### v1.0.0 (2026-01-19)
- 初始版本，整合多个来源共 153 个 skills
