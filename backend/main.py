"""
ThinkSo FastAPI 主应用入口
"""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
# Restore full functionality with all modules  
from app.api import upload, mindmaps, auth, share, invitations, admin, redemption
from app.core.config import settings

# 创建rate limiter实例
limiter = Limiter(key_func=get_remote_address)

# 创建FastAPI应用实例
app = FastAPI(
    title="ThinkSo API",
    description="ThinkSo 思维导图生成 API",
    version="3.0.0"
)

# 添加rate limiting中间件
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 数据库初始化事件 - 仅在开发环境使用
@app.on_event("startup")
async def startup_event():
    """应用启动事件 - 生产环境使用Alembic管理数据库"""
    # 仅在使用SQLite的开发环境中创建表
    if "sqlite" in settings.database_url:
        from app.core.database import create_tables
        create_tables()
        print("Development mode: Created tables using SQLAlchemy")
    else:
        print("Production mode: Using Alembic for database management")

# 配置CORS - 支持环境变量配置允许的域名
allowed_origins = [
    "http://localhost:3000",  # 本地开发
    "https://thinkso.io",  # 生产域名
    "https://www.thinkso.io",  # 支持www子域名
]

# 从环境变量获取额外的允许域名
extra_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
extra_origins = [origin.strip() for origin in extra_origins if origin.strip()]
allowed_origins.extend(extra_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 注册路由
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(mindmaps.router, prefix="/api/mindmaps", tags=["mindmaps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(share.router, prefix="/api", tags=["share"])
app.include_router(invitations.router, prefix="/api/invitations", tags=["invitations"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(redemption.router, prefix="/api/codes", tags=["redemption"])

@app.get("/")
async def root():
    return {"message": "Welcome to ThinkSo API v3.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.0.0"}

if __name__ == "__main__":
    import uvicorn
    import logging
    
    # 配置日志
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    try:
        # 支持 Render 的 PORT 环境变量
        port = int(os.getenv("PORT", 8000))
        logger.info(f"Starting ThinkSo API on port {port}")
        
        # 检查关键模块导入
        logger.info("Checking module imports...")
        logger.info("Admin module loaded successfully")
        logger.info("Basic modules imported successfully")
        
        uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise