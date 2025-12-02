#!/bin/bash

echo "========================================="
echo "    B區 - 捐血緊急任務系統啟動"
echo "========================================="
echo ""

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null
then
    echo "❌ 錯誤: 未安裝 Node.js"
    echo "請先安裝 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"
echo ""

# 檢查 .env 檔案
if [ ! -f .env ]; then
    echo "⚠️  警告: 未找到 .env 檔案"
    echo "   使用預設配置..."
    echo ""
fi

# 檢查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴套件..."
    npm install
    echo ""
fi

# 啟動伺服器
echo "🚀 啟動伺服器..."
echo ""
npm start
