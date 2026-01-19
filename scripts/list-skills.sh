#!/bin/bash

# ========================================
# 列出所有已安装的Claude Skills
# ========================================

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claude Skills 列表${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 检查仓库中的skills
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -d "$REPO_DIR/skills" ]; then
    echo -e "${GREEN}📦 仓库中的skills ($(ls -1 "$REPO_DIR/skills" | wc -l | tr -d ' ') 个):${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    ls -1 "$REPO_DIR/skills" | nl -w2 -s'. '
    echo ""
fi

# 检查本地安装的skills
LOCAL_DIR="$HOME/.claude/skills"
if [ -d "$LOCAL_DIR" ]; then
    echo -e "${GREEN}💻 本地安装的skills ($(ls -1 "$LOCAL_DIR" | wc -l | tr -d ' ') 个):${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    ls -1 "$LOCAL_DIR" | nl -w2 -s'. '
    echo ""
else
    echo -e "${YELLOW}⚠️  本地未找到skills目录${NC}\n"
fi

# 对比差异
if [ -d "$REPO_DIR/skills" ] && [ -d "$LOCAL_DIR" ]; then
    echo -e "${BLUE}🔍 对比差异:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # 仓库有但本地没有的
    REPO_ONLY=$(comm -23 <(ls -1 "$REPO_DIR/skills" | sort) <(ls -1 "$LOCAL_DIR" | sort))
    if [ -n "$REPO_ONLY" ]; then
        echo -e "${YELLOW}📦 仓库独有（未安装到本地）:${NC}"
        echo "$REPO_ONLY" | nl -w2 -s'. '
        echo ""
    fi

    # 本地有但仓库没有的
    LOCAL_ONLY=$(comm -13 <(ls -1 "$REPO_DIR/skills" | sort) <(ls -1 "$LOCAL_DIR" | sort))
    if [ -n "$LOCAL_ONLY" ]; then
        echo -e "${YELLOW}💻 本地独有（未同步到仓库）:${NC}"
        echo "$LOCAL_ONLY" | nl -w2 -s'. '
        echo ""
    fi

    if [ -z "$REPO_ONLY" ] && [ -z "$LOCAL_ONLY" ]; then
        echo -e "${GREEN}✓ 仓库和本地完全同步${NC}\n"
    fi
fi

echo -e "${BLUE}========================================${NC}"
