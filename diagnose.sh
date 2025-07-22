#!/bin/bash

echo "🔍 ThinkTree 服务诊断工具"
echo "==============================="

# 检查前端状态
echo "📱 检查前端服务状态..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务正常 (http://localhost:3000)"
else
    echo "❌ 前端服务异常 (http://localhost:3000)"
    echo "   建议: 运行 'cd frontend && npm run dev'"
fi

# 检查后端状态
echo "🔧 检查后端服务状态..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务正常 (http://localhost:8000)"
else
    echo "❌ 后端服务异常 (http://localhost:8000)"
    echo "   建议: 运行 'cd backend && source venv/bin/activate && python main.py'"
fi

# 检查端口占用
echo "🔍 检查端口占用情况..."
echo "端口 3000:"
lsof -i :3000 || echo "   未被占用"
echo "端口 8000:"
lsof -i :8000 || echo "   未被占用"

# 检查进程状态
echo "🔄 检查相关进程..."
NEXT_PROCESSES=$(ps aux | grep -c "next-server" | grep -v grep)
PYTHON_PROCESSES=$(ps aux | grep -c "python.*main" | grep -v grep)

echo "Next.js 进程数: $NEXT_PROCESSES"
echo "Python 后端进程数: $PYTHON_PROCESSES"

# 提供解决建议
echo ""
echo "🛠️ 问题解决建议:"
echo "==============================="

if ! curl -s http://localhost:3000 > /dev/null; then
    echo "前端问题解决:"
    echo "  1. cd frontend && npm run dev"
    echo "  2. 检查 Node.js 版本: node --version (需要 >= 18.0.0)"
    echo "  3. 重新安装依赖: rm -rf node_modules && npm install"
fi

if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "后端问题解决:"
    echo "  1. cd backend && source venv/bin/activate"
    echo "  2. python main.py"
    echo "  3. 检查虚拟环境: ls backend/venv"
    echo "  4. 重新安装依赖: pip install -r requirements.txt"
fi

echo ""
echo "💡 一键修复命令:"
echo "./start_services.sh" 