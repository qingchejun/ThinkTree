# main.py  —— CORS Final Test (Corrected Version) ——
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="CORS Final Test API")

# ★ 绝对最简且正确的 CORS 配置
# 确保这是第一个被添加的中间件，并且在所有路由注册之前
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://thinkso.io",
        "https://www.thinkso.io",
        "http://localhost:3000",  # 本地开发环境的前端端口号
    ],
    allow_credentials=True,
    allow_methods=["*"],   # 关键修正：必须是 ["*"] 或显式列出方法
    allow_headers=["*"],   # 关键修正：同上
)

# --- 模拟的测试接口 ---
class LoginPayload(BaseModel):
    email: str

@app.get("/api/auth/profile")
async def test_profile():
    return {"message": "CORS test for GET /profile successful!"}

@app.post("/api/auth/initiate-login")
async def test_initiate_login(payload: LoginPayload):
    return {
        "message": f"CORS test for POST /initiate-login successful for {payload.email}!"
    }

@app.get("/health")
async def health_check():
    # Render平台需要的健康检查接口
    return {"status": "ok"}

# --- 如果您有其他路由，请确保在这里（CORS中间件之后）加载 ---
from app.api import upload, mindmaps, auth, share, invitations, admin, redemption

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(mindmaps.router, prefix="/api/mindmaps", tags=["mindmaps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(share.router, prefix="/api", tags=["share"])
app.include_router(invitations.router, prefix="/api/invitations", tags=["invitations"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(redemption.router, prefix="/api/codes", tags=["redemption"])