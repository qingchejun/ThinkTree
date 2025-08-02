# Render 部署配置 (最终修正版)
services:
  # FastAPI 后端服务
  - type: web
    name: thinktree-backend
    env: python
    # 构建命令保持不变
    buildCommand: cd backend && pip install -r requirements.txt
    # 启动命令已修正：不再调用外部脚本(start.sh)，而是直接执行标准流程
    # 1. 进入 backend 目录
    # 2. 运行数据库迁移 (正确的方式)
    # 3. 启动应用服务器
    startCommand: cd backend && alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: thinktree-db
          property: connectionString
      - key: ALGORITHM
        value: HS256
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: 30
      - key: MAX_FILE_SIZE
        value: 10485760
      - key: UPLOAD_DIR
        value: ./uploads

  # Next.js 前端服务 (此部分无需改动)
  - type: web
    name: thinktree-frontend
    env: node
    buildCommand: cd frontend && npm install && npm run build
    startCommand: cd frontend && npm start
    healthCheckPath: /api/health
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://thinktree-backend.onrender.com # 后端服务 URL
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "10000"

# PostgreSQL 数据库 (此部分无需改动)
databases:
  - name: thinktree-db
    plan: free