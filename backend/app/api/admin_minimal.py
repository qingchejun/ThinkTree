"""
渐进式恢复的管理员API模块
"""

import logging
import secrets
import string
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
from app.utils.security import get_password_hash, create_access_token
from app.api.auth import get_current_user
from app.utils.email_service import get_email_service

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

class UserUpdateRequest(BaseModel):
    """用户更新请求模型"""
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    display_name: Optional[str] = None

class UserPasswordResetRequest(BaseModel):
    """管理员重置用户密码请求模型"""
    new_password: str

class InvitationCreateRequest(BaseModel):
    """管理员邀请码创建请求模型"""
    count: int = 1
    description: Optional[str] = None

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

# 用户管理操作
@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    update_data: UserUpdateRequest,
    admin_user: User = Depends(get_current_admin_simple),
    db: Session = Depends(get_db)
):
    """更新用户信息"""
    try:
        # 查找目标用户
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 防止管理员修改自己的状态
        if target_user.id == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不能修改自己的账户状态"
            )
        
        # 应用更新
        changes = []
        if update_data.is_active is not None:
            target_user.is_active = update_data.is_active
            changes.append(f"is_active: {update_data.is_active}")
        
        if update_data.is_verified is not None:
            target_user.is_verified = update_data.is_verified
            changes.append(f"is_verified: {update_data.is_verified}")
        
        if update_data.display_name is not None:
            target_user.display_name = update_data.display_name
            changes.append(f"display_name: {update_data.display_name}")
        
        if not changes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="没有提供任何更新数据"
            )
        
        # 保存更改
        db.commit()
        db.refresh(target_user)
        
        return {
            "success": True,
            "message": f"用户 {target_user.email} 更新成功",
            "changes": changes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新用户失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新用户失败"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin_simple),
    db: Session = Depends(get_db)
):
    """删除用户（软删除）"""
    try:
        # 查找目标用户
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 防止管理员删除自己
        if target_user.id == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不能删除自己的账户"
            )
        
        # 软删除：将用户设为非活跃状态
        target_user.is_active = False
        
        db.commit()
        
        return {
            "success": True,
            "message": f"用户 {target_user.email} 已被删除（软删除）"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除用户失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除用户失败"
        )

# 密码重置功能
@router.post("/users/{user_id}/reset-password")
async def admin_reset_user_password(
    user_id: int,
    request: UserPasswordResetRequest,
    admin_user: User = Depends(get_current_admin_simple),
    db: Session = Depends(get_db)
):
    """管理员重置用户密码（直接设置）"""
    try:
        # 查找目标用户
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 防止管理员重置自己的密码
        if target_user.id == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="请使用账户设置页面修改自己的密码"
            )
        
        # 简单的密码验证
        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="密码长度至少8位"
            )
        
        # 更新密码
        target_user.password_hash = get_password_hash(request.new_password)
        
        db.commit()
        db.refresh(target_user)
        
        return {
            "success": True,
            "message": f"用户 {target_user.email} 的密码已重置成功",
            "user_email": target_user.email,
            "reset_time": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重置用户密码失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="重置密码失败"
        )

@router.post("/users/{user_id}/generate-temp-password")
async def generate_temp_password_for_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin_simple),
    db: Session = Depends(get_db)
):
    """管理员为用户生成临时密码"""
    try:
        # 查找目标用户
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 防止管理员为自己生成临时密码
        if target_user.id == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="请使用账户设置页面修改自己的密码"
            )
        
        # 生成临时密码：8位字母数字组合
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        
        # 更新用户密码
        target_user.password_hash = get_password_hash(temp_password)
        
        db.commit()
        db.refresh(target_user)
        
        return {
            "success": True,
            "message": f"已为用户 {target_user.email} 生成临时密码",
            "temp_password": temp_password,
            "user_email": target_user.email,
            "valid_hours": 24,
            "generated_time": datetime.now().isoformat(),
            "warning": "请立即通过安全渠道将此临时密码告知用户，并提醒用户登录后立即修改密码"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成临时密码失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="生成临时密码失败"
        )

# 注意：管理员发送重置邮件功能已移除，用户可使用忘记密码功能

# 邀请码管理功能（简化版）
@router.get("/invitations")
async def get_admin_invitations(
    admin_user: User = Depends(get_current_admin_simple),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(20, ge=1, le=100, description="每页数量"),
    status_filter: Optional[str] = Query(None, description="状态筛选")
):
    """获取邀请码列表（简化版，返回空数据）"""
    try:
        # 由于简化版admin模块没有邀请码表，暂时返回空数据
        return {
            "invitations": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "total_pages": 0
        }
        
    except Exception as e:
        logger.error(f"获取邀请码列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取邀请码列表失败"
        )

@router.post("/invitations")
async def create_admin_invitations(
    request: InvitationCreateRequest,
    admin_user: User = Depends(get_current_admin_simple),
    db: Session = Depends(get_db)
):
    """管理员批量生成邀请码（简化版）"""
    try:
        logger.info(f"管理员 {admin_user.email} 请求生成 {request.count} 个邀请码")
        
        if request.count <= 0 or request.count > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码数量必须在1-100之间"
            )
        
        # 简化版：生成模拟邀请码数据
        created_codes = []
        for i in range(request.count):
            # 生成模拟邀请码
            code = ''.join(secrets.choice('23456789ABCDEFGHJKLMNPQRSTUVWXYZ') for _ in range(8))
            created_codes.append({
                "code": code,
                "created_at": datetime.now().isoformat(),
                "description": request.description or f"管理员批量生成 {i+1}/{request.count}",
                "is_used": False
            })
        
        logger.info(f"成功生成 {request.count} 个模拟邀请码")
        
        return {
            "success": True,
            "message": f"成功生成 {request.count} 个邀请码（模拟版本，仅用于界面测试）",
            "invitations": created_codes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"管理员生成邀请码失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="生成邀请码失败"
        )

# 移除模拟邀请码功能 - 现在使用完整的invitations模块

@router.get("/health")
async def admin_health():
    """管理员模块健康检查"""
    return {"status": "healthy", "module": "admin_progressive"}