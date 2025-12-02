#!/bin/bash

# 展場控制系統啟動腳本
# 血型展覽 - Exhibition Controller

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "======================================"
echo "  血型展覽 - 展場控制系統"
echo "======================================"
echo ""

# 檢查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "首次執行，正在安裝依賴..."
    npm install
    echo ""
fi

# 檢查後台的 node_modules
BACKEND_DIR="../blood-exhibition_InputUserData"
if [ -d "$BACKEND_DIR" ] && [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "安裝後台依賴..."
    (cd "$BACKEND_DIR" && npm install)
    echo ""
fi

# 檢查裝置的 node_modules
DEVICE_DIR="../blood-exhibition_Device/blood-exhibition_A_StickerDevice"
if [ -d "$DEVICE_DIR" ] && [ ! -d "$DEVICE_DIR/node_modules" ]; then
    echo "安裝裝置依賴..."
    (cd "$DEVICE_DIR" && npm install)
    echo ""
fi

echo "啟動展場控制系統..."
echo ""

# 啟動 Electron 應用
npm start
