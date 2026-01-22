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

## Skills 内容 (167 个)

### 产品经理日常

| Skill | 用途 | 来源 |
|-------|------|------|
| product-manager-prompts | 25 个产品管理框架提示词 | [Dean Peters](https://github.com/deanpeters/product-manager-prompts) |
| competitive-ads-extractor | 竞品广告分析 | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| meeting-insights-analyzer | 会议纪要和洞察 | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| content-research-writer | 内容研究写作 | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |

### 办公文档处理

| Skill | 用途 | 来源 |
|-------|------|------|
| docx | Word 文档读写 | [Anthropic 官方](https://github.com/anthropics/skills) |
| pptx | PowerPoint 制作 | [Anthropic 官方](https://github.com/anthropics/skills) |
| pdf | PDF 处理 | [Anthropic 官方](https://github.com/anthropics/skills) |
| xlsx | Excel 表格处理 | [Anthropic 官方](https://github.com/anthropics/skills) |

### 微博自动化 (原创)

基于宝玉的 X 自动发博 Skill 改造，适配微博平台：

| Skill | 用途 | 说明 |
|-------|------|------|
| post-to-weibo | 发布微博 | 通过 CDP 控制浏览器发微博，支持文字和图片，自动添加 AI 签名 |
| weibo-autopilot | 微博自动驾驶 | 学习用户风格，定时浏览 Feed，智能筛选并自动转发感兴趣的内容 |

**weibo-autopilot 功能特点：**
- 学习你的发帖和评论风格，生成个人画像
- 支持浏览首页 Feed 或指定分组（如"足球"、"科技"）
- 根据兴趣话题智能打分筛选内容
- 自动生成符合你风格的转发评论
- 断点续传：中断后自动恢复未完成任务
- 所有自动发布内容带 AI 标识

📦 **在线生成器**：https://questnova502.github.io/weibo-autopilot-generator/

### 内容创作 (Baoyu 系列)

来自微博网友 [@宝玉xp](https://github.com/jimliu/baoyu-skills) 的分享，非常适合自媒体和内容创作者：

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
| baoyu-danger-gemini-web | Gemini 网页搜索 |
| baoyu-danger-x-to-markdown | X 帖子转 Markdown |

### 项目管理

| Skill | 用途 | 来源 |
|-------|------|------|
| jira-integration | Jira 集成操作 | [Netresearch](https://github.com/netresearch/claude-code-marketplace) |
| git-workflow | Git 工作流 | [Netresearch](https://github.com/netresearch/claude-code-marketplace) |
| github-project | GitHub 项目管理 | [Netresearch](https://github.com/netresearch/claude-code-marketplace) |

### 工程开发 (约 50 个)

来自 [Alireza Rezvani](https://github.com/alirezarezvani/claude-skills) 的开源贡献：

- senior-architect / senior-frontend / senior-backend - 架构和开发
- code-reviewer - 代码审查
- senior-devops / senior-security - 运维和安全
- 更多工程、产品、营销相关 skills...

---

## 致谢

本仓库的 skills 来自以下作者和项目，感谢他们的开源分享：

| 来源 | 作者/项目 | 内容 |
|------|----------|------|
| [Anthropic Skills](https://github.com/anthropics/skills) | Anthropic 官方 | 文档处理核心 (11 个) |
| [claude-skills](https://github.com/alirezarezvani/claude-skills) | Alireza Rezvani | 工程/产品/营销 (约 50 个) |
| [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | ComposioHQ | 竞品分析、会议洞察 (12 个) |
| [claude-code-marketplace](https://github.com/netresearch/claude-code-marketplace) | Netresearch | Jira、Git 集成 (7 个) |
| [product-manager-prompts](https://github.com/deanpeters/product-manager-prompts) | Dean Peters | 产品经理提示词 (25 个) |
| [baoyu-skills](https://github.com/jimliu/baoyu-skills) | 宝玉 (@jimliu) | 内容创作、社交发布 (12 个) |

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

### v1.2.0 (2026-01-22)
- 新增微博自动化 Skills (2 个)
  - post-to-weibo：发布微博
  - weibo-autopilot：微博自动驾驶（学习风格、智能筛选、自动转发）
- 新增在线生成器：https://questnova502.github.io/weibo-autopilot-generator/
- Skills 总数：167 个

### v1.1.0 (2026-01-21)
- 新增 Baoyu Skills 系列 (12 个) - 内容创作和社交发布
- Skills 总数：165 个

### v1.0.0 (2026-01-19)
- 初始版本，整合多个来源共 153 个 skills
