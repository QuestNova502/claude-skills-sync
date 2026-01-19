#!/bin/bash

# ========================================
# Claude Skills 同步脚本
# 功能：将本地 ~/.claude/skills 同步到 GitHub
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claude Skills 同步到 GitHub${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 检查是否在正确的目录
REPO_DIR="$HOME/claude-skills-sync"
if [ ! -d "$REPO_DIR" ]; then
    echo -e "${RED}❌ 错误: 找不到仓库目录 $REPO_DIR${NC}"
    exit 1
fi

cd "$REPO_DIR"

# 检查是否是Git仓库
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ 错误: 当前目录不是Git仓库${NC}"
    exit 1
fi

# 检查源目录是否存在
SOURCE_DIR="$HOME/.claude/skills"
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ 错误: 找不到Claude skills目录 $SOURCE_DIR${NC}"
    exit 1
fi

# 开始同步
echo -e "${YELLOW}📂 正在从本地同步skills...${NC}"
echo -e "   源目录: ${SOURCE_DIR}"
echo -e "   目标目录: ${REPO_DIR}/skills\n"

# 使用rsync同步（保持同步，删除不存在的文件）
if command -v rsync &> /dev/null; then
    rsync -av --delete --exclude='.DS_Store' "$SOURCE_DIR/" "$REPO_DIR/skills/"
    echo -e "${GREEN}✓ rsync同步完成${NC}\n"
else
    # 如果没有rsync，使用cp
    echo -e "${YELLOW}⚠️  rsync未安装，使用cp命令${NC}"
    rm -rf "$REPO_DIR/skills"
    mkdir -p "$REPO_DIR/skills"
    cp -r "$SOURCE_DIR/" "$REPO_DIR/skills/"
    echo -e "${GREEN}✓ cp复制完成${NC}\n"
fi

# 统计skills数量
SKILLS_COUNT=$(ls -1 "$REPO_DIR/skills" | wc -l | tr -d ' ')
echo -e "${BLUE}📊 Skills数量: $SKILLS_COUNT 个${NC}\n"

# Git状态检查
echo -e "${YELLOW}🔍 检查Git状态...${NC}"
if [[ -z $(git status -s) ]]; then
    echo -e "${GREEN}✓ 没有变更，无需提交${NC}"
    exit 0
fi

# 显示变更
echo -e "\n${BLUE}📝 变更内容:${NC}"
git status -s

# 询问是否继续
echo -e "\n${YELLOW}是否继续提交并推送? (y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  已取消${NC}"
    exit 0
fi

# Git添加所有变更
echo -e "\n${YELLOW}📦 添加变更到Git...${NC}"
git add .

# 生成commit message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Sync: Update skills - $TIMESTAMP"

echo -e "${YELLOW}💬 提交信息: $COMMIT_MSG${NC}"
git commit -m "$COMMIT_MSG"

# 推送到GitHub
echo -e "\n${YELLOW}🚀 推送到GitHub...${NC}"
if git push origin main; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ 同步成功完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Skills数量: $SKILLS_COUNT${NC}"
    echo -e "${GREEN}更新时间: $TIMESTAMP${NC}"
else
    echo -e "\n${RED}========================================${NC}"
    echo -e "${RED}❌ 推送失败${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "${YELLOW}请检查网络连接和GitHub权限${NC}"
    exit 1
fi
