#!/bin/bash

# 财务记账系统 一键启动脚本
# 项目路径
PROJECT_DIR="/Users/enjoy0710/Desktop/test"

echo "🚀 启动财务记账系统..."

# 1. 启动 cloudflared 隧道
echo "📡 启动 Cloudflare Tunnel..."
cd "$PROJECT_DIR"
cloudflared tunnel run finance-tunnel &
CLOUDFLARED_PID=$!
sleep 2

# 2. 启动后端
echo "🔧 启动后端服务..."
cd "$PROJECT_DIR/server"
node app.js &
SERVER_PID=$!

# 3. 启动前端
echo "🎨 启动前端服务..."
cd "$PROJECT_DIR/client"
npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ 启动完成！"
echo "   本地:   http://localhost:5173"
echo "   线上:   https://ysj0710.xyz"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断
trap "kill $CLOUDFLARED_PID $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM
wait
