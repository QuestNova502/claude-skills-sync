#!/bin/bash

# ========================================
# Claude Skills 安装脚本
# 功能：从仓库安装skills到本地 ~/.claude/skills
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  安装Claude Skills到本地${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 检查是否在正确的目录
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo -e "${BLUE}📂 仓库目录: $REPO_DIR${NC}\n"

# 检查skills目录是否存在
if [ ! -d "$REPO_DIR/skills" ]; then
    echo -e "${RED}❌ 错误: 找不到skills目录${NC}"
    exit 1
fi

# 统计skills数量
SKILLS_COUNT=$(ls -1 "$REPO_DIR/skills" | wc -l | tr -d ' ')
echo -e "${BLUE}📊 发现 $SKILLS_COUNT 个skills${NC}\n"

# 目标目录
TARGET_DIR="$HOME/.claude/skills"

# 检查目标目录是否存在
if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}⚠️  目标目录已存在: $TARGET_DIR${NC}"
    echo -e "${YELLOW}是否备份现有skills并继续? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        BACKUP_DIR="$HOME/.claude/skills_backup_$(date +%Y%m%d_%H%M%S)"
        echo -e "${YELLOW}📦 备份到: $BACKUP_DIR${NC}"
        mv "$TARGET_DIR" "$BACKUP_DIR"
        echo -e "${GREEN}✓ 备份完成${NC}\n"
    else
        echo -e "${YELLOW}⏸️  已取消${NC}"
        exit 0
    fi
fi

# 创建目标目录
echo -e "${YELLOW}📁 创建目录: $TARGET_DIR${NC}"
mkdir -p "$TARGET_DIR"

# 复制skills
echo -e "${YELLOW}📂 正在复制skills...${NC}"
if command -v rsync &> /dev/null; then
    rsync -av --exclude='.DS_Store' "$REPO_DIR/skills/" "$TARGET_DIR/"
    echo -e "${GREEN}✓ rsync复制完成${NC}\n"
else
    cp -r "$REPO_DIR/skills/"* "$TARGET_DIR/"
    echo -e "${GREEN}✓ cp复制完成${NC}\n"
fi

# 验证安装
INSTALLED_COUNT=$(ls -1 "$TARGET_DIR" | wc -l | tr -d ' ')
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 安装成功完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}已安装Skills: $INSTALLED_COUNT 个${NC}"
echo -e "${GREEN}安装位置: $TARGET_DIR${NC}\n"

echo -e "${BLUE}📝 下一步:${NC}"
echo -e "   1. 重启Claude Code"
echo -e "   2. Skills会自动加载"
echo -e "   3. 查看docs/目录了解使用方法\n"

# 列出前10个安装的skills
echo -e "${BLUE}🎯 部分已安装的skills:${NC}"
ls -1 "$TARGET_DIR" | head -10
if [ "$INSTALLED_COUNT" -gt 10 ]; then
    echo -e "   ... 还有 $((INSTALLED_COUNT - 10)) 个"
fi

echo ""
