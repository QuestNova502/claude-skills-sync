# Claude Skills Sync 🚀

我的Claude Code技能库备份和同步仓库

---

## 📊 当前状态

- **Skills总数**: 153个
- **最后更新**: 2026-01-19
- **Claude Code版本**: 最新版

---

## 📁 仓库结构

```
claude-skills-sync/
├── README.md           # 本文件
├── .gitignore          # Git忽略规则
├── skills/             # 153个Claude skills（核心内容）
│   ├── product-manager-prompts/    # 产品经理提示词库
│   ├── competitive-ads-extractor/  # 竞品广告分析
│   ├── jira-integration/           # Jira集成
│   ├── docx/                       # Word文档处理
│   ├── pptx/                       # PowerPoint处理
│   └── ... （共153个）
├── docs/               # 使用文档和指南
│   ├── 同步方案设计.md
│   ├── 安装记录.md
│   └── 产品经理Prompts指南.md
└── scripts/            # 实用脚本
    ├── sync.sh         # 同步到GitHub
    ├── install.sh      # 新电脑安装
    └── list-skills.sh  # 列出所有skills
```

---

## 🎯 Skills来源

### 1. Anthropic官方 (11个)
- docx, pptx, pdf, xlsx - 文档处理核心
- frontend-design - 前端设计
- 授权: Apache 2.0 / Proprietary

### 2. Alireza Rezvani社区 (约50个)
- 工程团队、产品团队、营销与领导力团队
- 授权: MIT License
- 仓库: https://github.com/alirezarezvani/claude-skills

### 3. ComposioHQ (12个新增)
- competitive-ads-extractor - 竞品分析
- meeting-insights-analyzer - 会议洞察
- content-research-writer - 内容研究
- 授权: 各自的开源协议

### 4. Netresearch (7个新增)
- jira-integration - Jira集成
- git-workflow - Git工作流
- 授权: 各自的开源协议

### 5. Dean Peters产品经理提示词库
- 328★ GitHub项目
- 25个产品管理提示词模板
- 授权: MIT License

---

## 🚀 快速开始

### 在新电脑上安装

```bash
# 1. 克隆仓库
git clone https://github.com/你的用户名/claude-skills-sync.git
cd claude-skills-sync

# 2. 运行安装脚本
./scripts/install.sh

# 3. 重启Claude Code
# Skills会自动加载
```

### 手动安装

```bash
# 复制skills到Claude目录
mkdir -p ~/.claude/skills
cp -r ./skills/* ~/.claude/skills/
```

---

## 🔄 同步工作流

### 本地更新后同步到GitHub

```bash
# 运行同步脚本
cd ~/claude-skills-sync
./scripts/sync.sh
```

### 从GitHub更新到本地

```bash
cd ~/claude-skills-sync
git pull origin main
./scripts/install.sh
```

---

## 📚 文档

详细文档在 `docs/` 目录：

- **同步方案设计.md** - 完整的架构设计和方案说明
- **安装记录.md** - 所有skills的安装记录和来源
- **产品经理Prompts指南.md** - 产品经理提示词库使用指南

---

## 🎯 重点Skills推荐

### 产品经理必备
- `product-manager-prompts/` - 25个产品管理框架提示词
- `competitive-ads-extractor` - 竞品分析
- `meeting-insights-analyzer` - 会议洞察
- `content-research-writer` - 内容研究写作

### 日常办公
- `docx` - Word文档处理
- `pptx` - PowerPoint制作
- `pdf` - PDF处理
- `file-organizer` - 文件整理

### 项目管理
- `jira-integration` - Jira集成
- `git-workflow` - Git工作流
- `github-project` - GitHub项目管理

### 工程开发
- `senior-architect` - 系统架构设计
- `senior-frontend` - 前端开发
- `senior-backend` - 后端开发
- `code-reviewer` - 代码审查

---

## 🔒 隐私和权限

### 本仓库不包含
- ❌ API keys和密码
- ❌ 个人敏感信息
- ❌ 公司内部代码
- ❌ 客户数据

### 建议设置
- 🔐 **Private仓库**（已设置）
- 👥 只邀请信任的协作者
- 📋 定期review提交内容

---

## 👥 与朋友共享

### 方式1: 邀请协作者
1. GitHub仓库 → Settings → Collaborators
2. 输入朋友的GitHub用户名
3. 发送邀请

### 方式2: 导出压缩包
```bash
tar -czf claude-skills-backup.tar.gz skills/ docs/
# 分享给朋友
```

---

## 🛠️ 脚本说明

### sync.sh - 同步到GitHub
```bash
# 将本地最新的skills同步到GitHub
./scripts/sync.sh
```

### install.sh - 安装到本地
```bash
# 从仓库安装skills到 ~/.claude/skills
./scripts/install.sh
```

### list-skills.sh - 列出所有skills
```bash
# 查看已安装的skills列表
./scripts/list-skills.sh
```

---

## 📅 维护计划

### 每周
- [ ] 运行 `sync.sh` 同步最新skills

### 每月
- [ ] Review新增skills
- [ ] 更新文档
- [ ] 清理废弃skills

### 每季度
- [ ] 检查skills更新
- [ ] 备份到其他位置
- [ ] Review权限设置

---

## 🤝 贡献

如果你发现了有用的新skills：

1. Fork本仓库
2. 添加新skills到 `skills/` 目录
3. 更新 `README.md` 和 `docs/`
4. 提交Pull Request

---

## 📄 License

- 本仓库配置和脚本: MIT License
- 各个skills: 遵循原始仓库的license

---

## 🔗 相关资源

### 官方资源
- [Claude Code文档](https://code.claude.com/docs/en/skills)
- [Anthropic Skills仓库](https://github.com/anthropics/skills)

### 社区资源
- [Alireza Rezvani Claude Skills](https://github.com/alirezarezvani/claude-skills)
- [ComposioHQ Awesome Skills](https://github.com/ComposioHQ/awesome-claude-skills)
- [Netresearch Marketplace](https://github.com/netresearch/claude-code-marketplace)
- [Dean Peters Product Manager Prompts](https://github.com/deanpeters/product-manager-prompts)

---

## 📧 联系

如有问题或建议，请通过GitHub Issues联系。

---

**最后更新**: 2026-01-19
**Skills数量**: 153个
**仓库状态**: 🟢 正常维护中
