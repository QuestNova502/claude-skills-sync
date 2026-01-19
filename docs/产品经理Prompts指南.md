# 产品经理Prompts库使用指南

你的Prompts库位置：`/Users/liubin1/.claude/skills/product-manager-prompts/`

这不是自动加载的Skills，而是**结构化的AI提示词模板集合**，需要手动复制使用。

---

## 📚 库的内容结构

```
product-manager-prompts/
├── prompts/              ⭐ 主要提示词（25个）
├── prompt-generators/    🤖 提示词生成器
├── flows/                🔄 完整工作流
├── storytelling/         📖 叙事技巧
├── skeletons/            🦴 框架骨架
└── vibes/                ✨ 风格指南
```

---

## 🎯 最实用的提示词（Top 10）

### 战略级（适合你现在的工作）

#### 1. **Jobs-to-be-Done 分析** 🔥🔥🔥
**文件**: `prompts/jobs-to-be-done.md`
**用途**: 理解用户真正想要完成什么任务
**适合场景**:
- 微博AI名片项目（理解博主需求）
- 新功能规划（用户价值分析）
- 用户研究

**如何使用**:
```bash
# 在终端查看
cat ~/.claude/skills/product-manager-prompts/prompts/jobs-to-be-done.md
```

**复制这段到Claude对话**:
```markdown
## Jobs-to-be-Done Template

我正在分析 [微博AI名片功能]，请帮我使用Jobs-to-be-Done框架分析：

### 1. Customer Jobs（用户任务）
- Functional Jobs（功能性任务）: 博主需要完成什么具体任务？
- Social Jobs（社交任务）: 博主希望如何被粉丝感知？
- Emotional Jobs（情感任务）: 博主想达到什么情感状态？

### 2. Pains（痛点）
- Challenges（挑战）: 博主面临什么障碍？
- Costliness（成本）: 什么对博主来说太昂贵（时间/金钱/精力）？
- Common Mistakes（常见错误）: 博主常犯什么可以避免的错误？

### 3. Gains（期望收益）
- Expectations（期望）: 什么能超出博主对当前工具的期望？
- Savings（节省）: 如何节省博主的时间/金钱/精力？
- Life Improvement（体验改善）: 如何让博主的生活更简单愉快？
```

---

#### 2. **定位声明（Positioning Statement）** 🔥🔥
**文件**: `prompts/positioning-statement.md`
**用途**: 明确产品如何竞争和获胜
**适合场景**: 竞品分析、产品战略

**使用方法**:
```markdown
请帮我为[产品名称]创建定位声明，使用Geoffrey Moore框架：

For [目标用户]
Who [用户需求/痛点]
The [产品类型] is a [产品类别]
That [核心价值主张]
Unlike [主要竞品]
Our product [关键差异化优势]
```

---

#### 3. **竞品分析** 🔥
**文件**: `prompts/company-profile-executive-insights-research.md`
**用途**: 系统化的竞品研究
**适合场景**: 微博超话竞品分析、市场调研

---

### 执行级（日常使用）

#### 4. **用户故事模板** 🔥🔥
**文件**: `prompts/user-story-prompt-template.md`
**用途**: 编写清晰可测试的用户故事
**框架**: Mike Cohn + Gherkin格式

**快速使用**:
```markdown
请基于以下上下文创建用户故事：

### User Story: [微博AI名片 - 博主查看粉丝画像]

#### Use Case:
- As a [头部金V博主]
- I want to [查看我的粉丝画像数据]
- so that [更好地了解我的受众，制定内容策略]

#### Acceptance Criteria:
- Scenario: [博主在主页点击"查看详情"查看粉丝分析]
- Given: [用户已登录且是认证博主]
- and Given: [有足够的粉丝数据（>1000粉丝）]
- When: [用户点击AI名片的"查看详情"按钮]
- Then: [显示粉丝年龄、性别、地域、兴趣分布数据]
```

---

#### 5. **问题陈述框架** 🔥
**文件**: `prompts/framing-the-problem-statement.md`
**用途**: 定义正确的问题
**适合场景**: 项目启动、需求分析

---

#### 6. **用户旅程地图**
**文件**: `prompts/customer-journey-mapping-prompt-template.md`
**用途**: 映射完整的用户体验
**适合场景**: 体验优化、流程设计

---

### 沟通级（对外展示）

#### 7. **愿景新闻稿（Working Backwards）** 🔥
**文件**: `prompts/visionary-press-release.md`
**用途**: 从客户价值倒推产品设计
**框架**: Amazon Working Backwards方法

**使用场景**: CEO汇报、产品愿景

---

#### 8. **故事板叙事**
**文件**: `prompts/storyboard-storytelling-prompt.md`
**用途**: 创建引人入胜的产品叙事
**适合场景**: 产品演示、用户教育

---

#### 9. **FAQ生成器**
**文件**: `prompts/futuristic-product-faq.md`
**用途**: 预测并回答利益相关方的问题
**适合场景**: 产品发布、内部沟通

---

#### 10. **推荐建议画布**
**文件**: `prompts/recommendation-canvas-template.md`
**用途**: 构建决策的商业案例
**适合场景**: 方案评审、资源申请

---

## 🚀 快速开始（3步法）

### 步骤1: 浏览可用的提示词
```bash
# 查看所有提示词列表
ls ~/.claude/skills/product-manager-prompts/prompts/

# 查看某个提示词的完整内容
cat ~/.claude/skills/product-manager-prompts/prompts/jobs-to-be-done.md
```

### 步骤2: 在VSCode或任何文本编辑器中打开
```bash
# 用VSCode打开整个文件夹（推荐）
code ~/.claude/skills/product-manager-prompts/

# 或者用默认编辑器打开单个文件
open ~/.claude/skills/product-manager-prompts/prompts/jobs-to-be-done.md
```

### 步骤3: 复制内容到Claude对话
1. 打开你想用的提示词文件
2. 复制从 `~~~` 或 `---` 后面开始的模板部分（跳过注释）
3. 粘贴到Claude对话中
4. 根据你的具体项目修改方括号 `[xxx]` 中的内容
5. 开始结构化的对话

---

## 📋 完整提示词清单（25个）

### 战略与发现（6个）
- ✅ `jobs-to-be-done.md` - JTBD分析
- ✅ `positioning-statement.md` - 定位声明
- ✅ `framing-the-problem-statement.md` - 问题框架
- ✅ `proto-persona-profile.md` - 原型人物
- ✅ `customer-journey-mapping-prompt-template.md` - 用户旅程
- ✅ `company-profile-executive-insights-research.md` - 竞品研究

### 需求与执行（6个）
- ✅ `user-story-prompt-template.md` - 用户故事
- ✅ `user-story-splitting-prompt-template.md` - 故事拆分
- ✅ `user-story_ai-enhanced_prompt-template.md` - AI增强用户故事
- ✅ `user-story-mapping.md` - 故事地图
- ✅ `backlog-epic-hypothesis.md` - Epic假设
- ✅ `strategic-scrum-team-session-kickoff.md` - Sprint启动

### 分析与规划（4个）
- ✅ `pestel-analysis-prompt-template.md` - PESTEL分析
- ✅ `recommendation-canvas-template.md` - 推荐画布
- ✅ `reverse-engineer-IEEE830srs-to-PRD-prompt-template.md` - 需求转PRD
- ✅ `reverse-engineer-ISO29148-to-PRD-prompt-template.md` - ISO需求转PRD

### 沟通与愿景（4个）
- ✅ `visionary-press-release.md` - 愿景新闻稿
- ✅ `storyboard-storytelling-prompt.md` - 故事板
- ✅ `futuristic-product-faq.md` - FAQ生成
- ✅ `eol-for-a-product-message.md` - 产品终止消息

### 实用工具（3个）
- ✅ `a-generative-AI-prompt-builder-for-product-professionals.md` - 提示词构建器
- ✅ `howto.md` - 使用指南

### 趣味生成器（2个）
- ✅ `Dangerous Animals of Product Management Beast Generator.md` - 产品管理野兽生成器
- ✅ `Nightmares of Product Management Movie Title Generator Prompt.md` - 产品噩梦电影生成器

---

## 💡 实际使用案例

### 案例1: 微博AI名片JTBD分析

```markdown
我正在设计微博AI名片功能，目标用户是不同类型的博主。请使用Jobs-to-be-Done框架帮我分析：

**用户类型**: 头部金V博主（如韩路、何同学）

### Customer Jobs:
#### Functional Jobs（功能任务）:
- 快速展示个人专业度和影响力
- 高效管理粉丝互动
- 分析粉丝画像优化内容策略
- 展示商业合作价值

#### Social Jobs（社交任务）:
- 在同行中保持行业领先者形象
- 向粉丝展现专业和可信赖
- 向品牌方展示影响力价值

#### Emotional Jobs（情感任务）:
- 获得粉丝的认可和尊重
- 减少管理账号的焦虑感
- 增强对粉丝的理解和连接感

### Pains（痛点）:
... (继续完成)
```

**Claude会引导你**:
- 补充缺失的维度
- 深挖每个痛点
- 提出你可能没想到的角度
- 建议解决方案

---

### 案例2: 竞品分析后的定位声明

```markdown
基于我对微博超话的竞品分析（小红书、B站、抖音的社区功能），请帮我创建定位声明：

**For** 垂直兴趣圈层的深度用户
**Who** 需要持续跟踪特定话题并与同好深度交流
**The** 微博超话 is a 社区讨论平台
**That** 提供实时、结构化的话题讨论和圈层社交
**Unlike** 小红笔记（偏种草）和B站（偏视频）
**Our product** 提供最及时的热点追踪和最活跃的粉丝互动生态
```

---

### 案例3: CEO汇报用的愿景新闻稿

```markdown
请帮我用Amazon Working Backwards方法，为"微博全局翻译产品"撰写一份愿景新闻稿：

**产品名称**: 微博全局翻译
**发布日期**: 2026年Q2
**目标**: 打破语言障碍，连接全球华人和国际用户

（按照提示词模板填入关键信息，Claude会帮你生成完整的新闻稿）
```

---

## 🎓 进阶使用技巧

### 技巧1: 组合使用多个提示词

创建完整的产品规划流程：

```
1. jobs-to-be-done.md
   → 理解用户需求

2. positioning-statement.md
   → 明确产品定位

3. user-story-prompt-template.md
   → 编写具体需求

4. visionary-press-release.md
   → 制作对外宣讲材料

5. futuristic-product-faq.md
   → 准备答疑
```

### 技巧2: 定制化你的提示词

修改模板中的方括号内容，加入你的具体信息：

```markdown
# 原始模板
[Suggest multiple, functional tasks customers need to perform]

# 你的定制版
- 快速展示博主影响力数据
- 一键生成商业合作报价
- 实时查看粉丝增长趋势
- 导出粉丝画像分析报告
```

### 技巧3: 建立你的提示词库

在桌面创建你的个人提示词收藏：

```bash
mkdir ~/Desktop/我的产品提示词
cd ~/Desktop/我的产品提示词

# 复制你最常用的提示词
cp ~/.claude/skills/product-manager-prompts/prompts/jobs-to-be-done.md ./
cp ~/.claude/skills/product-manager-prompts/prompts/user-story-prompt-template.md ./
cp ~/.claude/skills/product-manager-prompts/prompts/positioning-statement.md ./

# 添加你自己的注释和案例
```

---

## 📖 其他目录说明

### prompt-generators/ （提示词生成器）
自动生成定制化提示词的工具

### flows/ （完整工作流）
端到端的产品管理流程

### storytelling/ （叙事技巧）
- IKEA式指导步骤生成器
- 产品故事讲述模板

### skeletons/ （框架骨架）
可复用的基础框架结构

### vibes/ （风格指南）
不同场景下的沟通风格

---

## 🔗 学习资源

### 作者资源
- **GitHub**: [deanpeters/product-manager-prompts](https://github.com/deanpeters/product-manager-prompts)
- **Substack**: [deanpeters.substack.com](https://deanpeters.substack.com/)
- **文章**: [如何编写引导式生成提示词](https://deanpeters.substack.com/p/how-to-write-guided-generation-prompts)
- **LinkedIn**: 搜索 "Dean Peters product manager prompts"

### 推荐阅读顺序
1. 先读 `prompts/README.md` - 理解整体方法论
2. 试用 `jobs-to-be-done.md` - 最容易上手
3. 探索 `prompting-style-guide.md` - 提升使用效果
4. 查看 `SUBMISSIONS-GUIDE.md` - 了解如何贡献

---

## ⚙️ VSCode便捷访问

### 添加到VSCode工作区

1. 打开VSCode
2. File → Add Folder to Workspace
3. 选择 `/Users/liubin1/.claude/skills/product-manager-prompts`
4. 保存工作区

以后就可以快速访问所有提示词了！

### 创建代码片段（Snippet）

在VSCode中创建快捷方式：

1. Code → Preferences → User Snippets → markdown.json
2. 添加你最常用的提示词模板
3. 输入缩写快速插入

---

## 🎯 针对你工作的推荐使用方案

### 微博产品相关工作

#### 做竞品分析时:
1. `company-profile-executive-insights-research.md` - 研究竞品
2. `positioning-statement.md` - 明确差异化
3. `pestel-analysis-prompt-template.md` - 宏观环境分析

#### 设计新功能时:
1. `jobs-to-be-done.md` - 理解用户需求
2. `user-story-prompt-template.md` - 编写用户故事
3. `customer-journey-mapping-prompt-template.md` - 设计体验流程

#### CEO汇报时:
1. `visionary-press-release.md` - 愿景描述
2. `recommendation-canvas-template.md` - 商业案例
3. `futuristic-product-faq.md` - 预备问答

#### 日常需求管理:
1. `user-story-prompt-template.md` - 需求描述
2. `user-story-splitting-prompt-template.md` - 拆分大需求
3. `backlog-epic-hypothesis.md` - Epic假设验证

---

## 🚀 立即开始

**最简单的第一步**:

```bash
# 在VSCode中打开整个文件夹
code /Users/liubin1/.claude/skills/product-manager-prompts/

# 打开README了解全貌
# 然后试试 jobs-to-be-done.md 分析你当前的项目
```

**下次和Claude对话时，试试这个**:

```
我正在用Jobs-to-be-Done框架分析[你的项目]，
请引导我系统化地分析用户的任务、痛点和期望收益。

（然后粘贴 jobs-to-be-done.md 的模板内容）
```

---

## 💡 关键要点

1. **这不是自动skill** - 需要手动复制粘贴使用
2. **结构化对话** - 不是填空题，是引导式的深度思考
3. **基于框架** - 使用业界公认的产品管理方法论
4. **可定制** - 根据你的项目修改模板内容
5. **可组合** - 多个提示词串联使用效果更好

---

**你现在拥有328★的顶级产品经理提示词库！充分利用它让你的产品思考更系统化。** 🎉

有任何问题随时问我，我可以帮你定制特定场景的使用方法！
