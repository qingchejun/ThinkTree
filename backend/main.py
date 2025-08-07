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

# 🔧 关键修复：导入所有模型，确保 SQLAlchemy Base 能注册到它们
# 这解决了 LoginToken 表和其他表在 Alembic 迁移中不被识别的问题
from app.models import User, Mindmap, InvitationCode, UserCredits, CreditTransaction, RedemptionCode, LoginToken

# 创建rate limiter实例
limiter = Limiter(key_func=get_remote_address)

# 创建FastAPI应用实例
app = FastAPI(
    title="ThinkSo API",
    description="ThinkSo 思维导图生成 API - 可通过邮请链接注册，稳定版",
    version="3.2.3-stable"
)

# 🔧 CORS配置 - HttpOnly Cookie跨域认证专用配置
# 🚨 重要：CORS中间件必须是第一个添加的中间件，确保全局生效
# 🎯 同根域架构：简化CORS配置，专注于thinkso.io根域
allowed_origins = [
    "http://localhost:3000",   # 本地开发
    "https://thinkso.io",      # 生产域名（不带www）
    "https://www.thinkso.io",  # 生产域名（带www）
]

# 打印CORS配置以便调试
print(f"🌐 CORS Configuration for Same-Root Domain:")
print(f"  - Backend: api.thinkso.io")
print(f"  - Frontend: www.thinkso.io")  
print(f"  - Allowed Origins: {allowed_origins}")
print(f"  - Allow Credentials: True")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # 明确的域名列表，绝不使用通配符
    allow_credentials=True,  # 🔑 关键：允许携带Cookie
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # 支持所有需要的方法
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",  # 保留用于向后兼容
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Cookie",  # 明确允许Cookie头
        "Set-Cookie",  # 明确允许Set-Cookie头
    ],
    expose_headers=["Set-Cookie"],  # 暴露Set-Cookie响应头
    max_age=600,  # 预检请求缓存10分钟
)

# 添加其他中间件（必须在CORS之后）
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 数据库初始化事件 - 仅在开发环境使用
@app.on_event("startup")
async def startup_event():
    """应用启动事件 - 生产环境使用Alembic管理数据库"""
    print(f"---DIAGNOSTIC-INFO--- Application using DATABASE_URL: {settings.database_url}")
    # 仅在使用SQLite的开发环境中创建表
    if "sqlite" in settings.database_url:
        from app.core.database import create_tables
        create_tables()
        print("Development mode: Created tables using SQLAlchemy")
    else:
        print("Production mode: Using Alembic for database management")

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
    return {"message": "Welcome to ThinkSo API v3.2.3-stable", "feature": "邀请链接注册支持"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.2.3-stable", "feature": "邀请链接注册支持"}

@app.options("/{full_path:path}")
async def options_handler(request: Request):
    """处理所有OPTIONS预检请求"""
    return {"message": "OK"}


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