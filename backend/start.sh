#!/bin/bash

# ThinkSo 生产环境启动脚本
echo "Starting ThinkSo backend..."

# 运行数据库迁移
echo "Running database migrations..."
alembic upgrade head

# 执行一次性积分补发脚本（仅在首次部署或需要时运行）
echo "Running credit backfill script..."
python one_time_credit_backfill.py || echo "Credit backfill script completed or skipped"

# 启动应用
echo "Starting FastAPI application..."
exec python main.py 