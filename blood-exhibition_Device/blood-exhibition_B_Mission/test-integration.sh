#!/bin/bash

echo "========================================"
echo "  B區系統整合測試腳本"
echo "========================================"
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查項目
check_pass=0
check_fail=0

echo "📋 檢查清單："
echo ""

# 1. 檢查 Exhibition Controller 配置
echo -n "1. 檢查 Exhibition Controller 配置... "
if grep -q '"id": "mission-device"' ../../exhibition-controller/devices.config.json 2>/dev/null; then
    if grep -q '"enabled": true' ../../exhibition-controller/devices.config.json 2>/dev/null; then
        echo -e "${GREEN}✓ 通過${NC}"
        ((check_pass++))
    else
        echo -e "${RED}✗ 失敗 - 系統未啟用${NC}"
        ((check_fail++))
    fi
else
    echo -e "${RED}✗ 失敗 - 找不到配置${NC}"
    ((check_fail++))
fi

# 2. 檢查埠號配置
echo -n "2. 檢查埠號配置... "
if grep -q "PORT=8081" .env 2>/dev/null; then
    if grep -q '"port": 8081' ../../exhibition-controller/devices.config.json 2>/dev/null; then
        echo -e "${GREEN}✓ 通過${NC}"
        ((check_pass++))
    else
        echo -e "${RED}✗ 失敗 - Controller 配置不一致${NC}"
        ((check_fail++))
    fi
else
    echo -e "${YELLOW}⚠ 警告 - .env 檔案不存在或埠號未設定${NC}"
    ((check_fail++))
fi

# 3. 檢查依賴套件
echo -n "3. 檢查 npm 依賴... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ 通過${NC}"
    ((check_pass++))
else
    echo -e "${RED}✗ 失敗 - 請執行 npm install${NC}"
    ((check_fail++))
fi

# 4. 檢查主要檔案
echo -n "4. 檢查主要檔案... "
missing_files=()
[ ! -f "server.js" ] && missing_files+=("server.js")
[ ! -f "package.json" ] && missing_files+=("package.json")
[ ! -f "public/index.html" ] && missing_files+=("public/index.html")

if [ ${#missing_files[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ 通過${NC}"
    ((check_pass++))
else
    echo -e "${RED}✗ 失敗 - 缺少檔案: ${missing_files[*]}${NC}"
    ((check_fail++))
fi

# 5. 檢查後台 API 路徑
echo -n "5. 檢查後台 API 配置... "
if grep -q "API_BASE_URL" .env 2>/dev/null; then
    echo -e "${GREEN}✓ 通過${NC}"
    ((check_pass++))
else
    echo -e "${YELLOW}⚠ 警告 - 未設定 API_BASE_URL${NC}"
    ((check_fail++))
fi

# 6. 檢查 Exhibition Controller 是否存在
echo -n "6. 檢查 Exhibition Controller... "
if [ -d "../../exhibition-controller" ]; then
    if [ -f "../../exhibition-controller/package.json" ]; then
        echo -e "${GREEN}✓ 通過${NC}"
        ((check_pass++))
    else
        echo -e "${RED}✗ 失敗 - Controller 不完整${NC}"
        ((check_fail++))
    fi
else
    echo -e "${RED}✗ 失敗 - Controller 不存在${NC}"
    ((check_fail++))
fi

# 7. 檢查埠號是否被佔用
echo -n "7. 檢查埠號 8081 是否可用... "
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 警告 - 埠號 8081 已被佔用${NC}"
    lsof -i :8081
    ((check_fail++))
else
    echo -e "${GREEN}✓ 通過${NC}"
    ((check_pass++))
fi

echo ""
echo "========================================"
echo -e "檢查結果: ${GREEN}${check_pass} 通過${NC} / ${RED}${check_fail} 失敗${NC}"
echo "========================================"
echo ""

if [ $check_fail -eq 0 ]; then
    echo -e "${GREEN}✓ 所有檢查通過！系統已準備好整合到 Exhibition Controller${NC}"
    echo ""
    echo "下一步："
    echo "  1. 啟動 Exhibition Controller:"
    echo "     cd ../../exhibition-controller"
    echo "     npm start"
    echo ""
    echo "  2. 在控制面板中："
    echo "     - 點擊「全部啟動」或「啟動後台」"
    echo "     - 點擊「B. 任務系統」的「啟動」"
    echo "     - 點擊「任務主畫面」的「開啟」"
    echo ""
    exit 0
else
    echo -e "${RED}✗ 檢查未通過，請修復上述問題${NC}"
    echo ""
    echo "常見解決方法："
    echo "  - npm install          安裝依賴"
    echo "  - cp .env.example .env 建立配置檔"
    echo "  - lsof -ti:8081 | xargs kill  釋放埠號"
    echo ""
    exit 1
fi
