"""
ThinkTree FastAPI 主应用入口
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, mindmaps, auth, share
from app.core.config import settings

# 创建FastAPI应用实例
app = FastAPI(
    title="ThinkTree API",
    description="ThinkTree 思维导图生成 API",
    version="1.2.0"
)

# 配置CORS - 生产环境需要更严格的配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(mindmaps.router, prefix="/api", tags=["mindmaps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(share.router, prefix="/api", tags=["share"])

@app.get("/")
async def root():
    return {"message": "Welcome to ThinkTree API v1.2.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.2.0"}

if __name__ == "__main__":
    import uvicorn
    # 支持 Render 的 PORT 环境变量
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)