"""
最小化管理员API模块 - 用于测试导入问题
"""

from fastapi import APIRouter
from pydantic import BaseModel

# 创建路由器
router = APIRouter()

class AdminStatsResponse(BaseModel):
    """简化的管理员统计响应模型"""
    status: str = "ok"

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats():
    """简化的统计接口"""
    return AdminStatsResponse(status="ok")

@router.get("/health")
async def admin_health():
    """管理员模块健康检查"""
    return {"status": "healthy", "module": "admin"}