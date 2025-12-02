#!/bin/bash

echo "血型展覽貼紙系統啟動中..."
echo "=============================="

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    echo "安裝依賴套件..."
    npm install
fi

# 檢查是否有 .env 檔案
if [ ! -f ".env" ]; then
    echo "創建環境設定檔..."
    cp .env.example .env
    echo "請編輯 .env 檔案設定 API 位址"
    exit 1
fi

# 啟動服務
echo "啟動服務..."
npm start