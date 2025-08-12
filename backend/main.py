# main.py - ThinkSo API 服务
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core import register_exception_handlers
from app.core.config import settings

app = FastAPI(
    title="ThinkSo API",
    description="AI思维导图生成服务",
    version="3.2.3"
)

# 注册全局异常处理系统
register_exception_handlers(app)

# CORS 中间件配置（读取配置文件/环境变量）
_origins = settings.allowed_origins or [
    "https://thinkso.io",
    "https://www.thinkso.io",
    "http://localhost:3000",
]

print("[CORS] allow_origins:", _origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 健康检查接口
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# 注册业务路由
from app.api import upload, mindmaps, auth, share, invitations, admin, redemption
from app.api import referrals

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(mindmaps.router, prefix="/api/mindmaps", tags=["mindmaps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(share.router, prefix="/api", tags=["share"])
app.include_router(invitations.router, prefix="/api/invitations", tags=["invitations"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(redemption.router, prefix="/api/codes", tags=["redemption"])
app.include_router(referrals.router, prefix="/api/referrals", tags=["referrals"])