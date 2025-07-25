"""
渐进式恢复的管理员API模块
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from pydantic import BaseModel

# 先导入基础模块
from app.core.database import get_db
from app.models.user import User
from app.models.mindmap import Mindmap

# 配置日志
logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter()

# 基础Pydantic模型
class AdminStatsResponse(BaseModel):
    """管理员统计数据响应模型"""
    total_users: int
    active_users: int
    verified_users: int
    total_mindmaps: int
    total_invitations: int = 0  # 暂时设为0
    used_invitations: int = 0   # 暂时设为0
    today_new_users: int
    today_new_mindmaps: int
    last_updated: datetime

class UserListItem(BaseModel):
    """用户列表项模型"""
    id: int
    email: str
    display_name: Optional[str]
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: datetime
    last_login_at: Optional[datetime]
    mindmap_count: int

class UserListResponse(BaseModel):
    """用户列表响应模型"""
    users: List[UserListItem]
    total: int
    page: int
    per_page: int
    total_pages: int

# 简化的管理员权限验证
async def get_current_admin_simple(db: Session = Depends(get_db)):
    """简化的管理员权限验证"""
    # TODO: 实现真正的权限验证
    # 现在暂时返回一个模拟的管理员用户
    admin_user = db.query(User).filter(User.email == "admin@thinktree.com").first()
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return admin_user

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin_user: User = Depends(get_current_admin_simple),
    db: Session = Depends(get_db)
):
    """获取管理员统计数据"""
    try:
        # 用户统计
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        verified_users = db.query(User).filter(User.is_verified == True).count()
        
        # 思维导图统计
        total_mindmaps = db.query(Mindmap).count()
        
        # 今日新增统计
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        today_new_users = db.query(User).filter(User.created_at >= today_start).count()
        today_new_mindmaps = db.query(Mindmap).filter(Mindmap.created_at >= today_start).count()
        
        return AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            verified_users=verified_users,
            total_mindmaps=total_mindmaps,
            total_invitations=0,  # 暂时设为0
            used_invitations=0,   # 暂时设为0
            today_new_users=today_new_users,
            today_new_mindmaps=today_new_mindmaps,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"获取管理员统计数据失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取统计数据失败"
        )

@router.get("/users", response_model=UserListResponse)
async def get_users_list(
    admin_user: User = Depends(get_current_admin_simple),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="按邮箱搜索"),
    status_filter: Optional[str] = Query(None, description="状态筛选")
):
    """获取用户列表"""
    try:
        # 构建查询
        query = db.query(User)
        
        # 邮箱搜索
        if search:
            query = query.filter(User.email.ilike(f"%{search}%"))
        
        # 状态筛选
        if status_filter:
            if status_filter == "active":
                query = query.filter(User.is_active == True)
            elif status_filter == "inactive":
                query = query.filter(User.is_active == False)
            elif status_filter == "verified":
                query = query.filter(User.is_verified == True)
            elif status_filter == "unverified":
                query = query.filter(User.is_verified == False)
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * per_page
        users = query.order_by(desc(User.created_at)).offset(offset).limit(per_page).all()
        
        # 构建用户列表
        user_list = []
        for user in users:
            # 获取用户的思维导图数量
            mindmap_count = db.query(Mindmap).filter(Mindmap.user_id == user.id).count()
            
            user_list.append(UserListItem(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                is_superuser=user.is_superuser,
                created_at=user.created_at,
                last_login_at=None,  # TODO: 实现登录时间追踪
                mindmap_count=mindmap_count
            ))
        
        # 计算总页数
        total_pages = (total + per_page - 1) // per_page
        
        return UserListResponse(
            users=user_list,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"获取用户列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取用户列表失败"
        )

@router.get("/health")
async def admin_health():
    """管理员模块健康检查"""
    return {"status": "healthy", "module": "admin_progressive"}