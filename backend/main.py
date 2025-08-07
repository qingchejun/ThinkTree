from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 确认导入路径正确 - 根据项目结构调整
from app.api import upload, mindmaps, auth, share, invitations, admin, redemption

app = FastAPI(title="ThinkSo API")

# ─────────────── CORS 中间件 (最终修正版) ───────────────
# 确保这是第一个被添加的中间件，并且在所有路由注册之前
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://thinkso.io",
        "https://www.thinkso.io", 
        "http://localhost:3000",   # 本地开发环境的前端端口号
    ],
    allow_credentials=True,
    allow_methods=["*"],          # 关键修正：必须是 ["*"] 来允许所有标准方法
    allow_headers=["*"],          # 关键修正：必须是 ["*"] 来允许所有请求头
)

# ────────────────────────────────────────────────────────
# 把所有 app.include_router(...) 的调用都放在CORS中间件之后
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(mindmaps.router, prefix="/api/mindmaps", tags=["mindmaps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(share.router, prefix="/api", tags=["share"])
app.include_router(invitations.router, prefix="/api/invitations", tags=["invitations"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(redemption.router, prefix="/api/codes", tags=["redemption"])

# 可选的健康检查接口，用于测试服务是否启动
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Welcome to ThinkSo API"}