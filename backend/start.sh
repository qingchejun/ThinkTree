#!/bin/bash

# ThinkTree 生产环境启动脚本
echo "Starting ThinkTree backend..."

# 运行数据库迁移
echo "Running database migrations..."
alembic upgrade head

# 启动应用
echo "Starting FastAPI application..."
exec python main.py 