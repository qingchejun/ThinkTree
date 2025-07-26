#!/bin/bash

echo "🚀 ThinkTree 服务启动脚本"
echo "==============================="

# 清理旧进程
echo "🧹 清理旧进程..."
pkill -f "uvicorn.*8000"
pkill -f "next-server"
pkill -f "npm.*dev"

# 等待进程完全结束
sleep 2

echo "✅ 进程清理完成"

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "⚠️  虚拟环境不存在，正在创建..."
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# 确保在正确目录启动
python main.py &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

# 等待后端启动
sleep 5

# 检查后端是否启动成功
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务启动成功 (http://localhost:8000)"
else
    echo "❌ 后端服务启动失败"
    exit 1
fi

# 启动前端服务
echo "🎨 启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

# 等待前端启动
sleep 5

# 检查前端是否启动成功
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务启动成功 (http://localhost:3000)"
else
    echo "❌ 前端服务启动失败"
fi

echo ""
echo "🎉 ThinkTree 服务启动完成！"
echo "==============================="
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8000"
echo "📖 API文档: http://localhost:8000/docs"
echo ""
echo "💡 提示: 按 Ctrl+C 退出脚本"
echo "📝 进程ID - 后端: $BACKEND_PID, 前端: $FRONTEND_PID"

# 保持脚本运行
wait 