"""
ThinkTree FastAPI 主应用入口
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, mindmaps, auth, share
from app.core.config import settings
from app.core.database import create_tables

# 创建FastAPI应用实例
app = FastAPI(
    title="ThinkTree API",
    description="ThinkTree 思维导图生成 API",
    version="2.0.0"
)

# 数据库初始化事件
@app.on_event("startup")
async def startup_event():
    """应用启动时创建数据表"""
    create_tables()

# 配置CORS - 支持环境变量配置允许的域名
allowed_origins = [
    "http://localhost:3000",  # 本地开发
    "https://thinktree-frontend.onrender.com",  # Render前端域名
]

# 从环境变量获取额外的允许域名
extra_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
extra_origins = [origin.strip() for origin in extra_origins if origin.strip()]
allowed_origins.extend(extra_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(mindmaps.router, prefix="/api/mindmaps", tags=["mindmaps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(share.router, prefix="/api", tags=["share"])

@app.get("/")
async def root():
    return {"message": "Welcome to ThinkTree API v2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    # 支持 Render 的 PORT 环境变量
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)