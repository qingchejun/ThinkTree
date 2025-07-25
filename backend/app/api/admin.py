"""
管理员后台 API 路由
提供管理员专用的用户管理、统计查看等功能
"""

import logging
import secrets
import string
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_

from app.core.database import get_db
from app.models.user import User
from app.models.mindmap import Mindmap
from app.models.invitation import InvitationCode
from app.utils.admin_auth import get_current_admin, log_admin_action
from app.utils.invitation_utils import create_invitation_code
from app.utils.security import get_password_hash, validate_password
from pydantic import BaseModel

# 配置日志
logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter()

# Pydantic 模型定义
class AdminStatsResponse(BaseModel):
    """管理员统计数据响应模型"""
    total_users: int
    active_users: int
    verified_users: int
    total_mindmaps: int
    total_invitations: int
    used_invitations: int
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

class InvitationCreateRequest(BaseModel):
    """管理员邀请码创建请求模型"""
    count: int = 1
    description: Optional[str] = None

class UserPasswordResetRequest(BaseModel):
    """管理员重置用户密码请求模型"""
    new_password: str

class TempPasswordGenerateRequest(BaseModel):
    """临时密码生成请求模型"""
    valid_hours: int = 24  # 临时密码有效期，默认24小时

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    获取管理员统计数据
    
    返回系统的核心统计指标，包括用户数、思维导图数、邀请码使用情况等
    """
    try:
        # 用户统计
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        verified_users = db.query(User).filter(User.is_verified == True).count()
        
        # 思维导图统计
        total_mindmaps = db.query(Mindmap).count()
        
        # 邀请码统计 - 添加错误处理
        total_invitations = 0
        used_invitations = 0
        try:
            total_invitations = db.query(InvitationCode).count()
            used_invitations = db.query(InvitationCode).filter(InvitationCode.used_by_user_id.isnot(None)).count()
        except Exception as invitation_error:
            logger.warning(f"邀请码表查询失败，可能表不存在: {str(invitation_error)}")
            # 使用默认值
            total_invitations = 0
            used_invitations = 0
        
        # 今日新增统计
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        today_new_users = db.query(User).filter(User.created_at >= today_start).count()
        today_new_mindmaps = db.query(Mindmap).filter(Mindmap.created_at >= today_start).count()
        
        # 记录管理员操作
        log_admin_action(admin_user, "view_stats", "", "查看系统统计数据")
        
        return AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            verified_users=verified_users,
            total_mindmaps=total_mindmaps,
            total_invitations=total_invitations,
            used_invitations=used_invitations,
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
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="按邮箱搜索"),
    status_filter: Optional[str] = Query(None, description="状态筛选: active, inactive, verified, unverified")
):
    """
    获取用户列表
    
    支持分页、邮箱搜索和状态筛选
    """
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
        
        # 记录管理员操作
        log_admin_action(
            admin_user, 
            "view_users", 
            f"page={page},search={search},filter={status_filter}",
            f"查看用户列表，共{total}个用户"
        )
        
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

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    update_data: UserUpdateRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    更新用户信息
    
    主要用于启用/禁用用户、验证用户等管理操作
    """
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
        
        # 记录修改前的状态
        old_values = {
            "is_active": target_user.is_active,
            "is_verified": target_user.is_verified,
            "display_name": target_user.display_name
        }
        
        # 应用更新
        changes = []
        if update_data.is_active is not None:
            target_user.is_active = update_data.is_active
            changes.append(f"is_active: {old_values['is_active']} -> {update_data.is_active}")
        
        if update_data.is_verified is not None:
            target_user.is_verified = update_data.is_verified
            changes.append(f"is_verified: {old_values['is_verified']} -> {update_data.is_verified}")
        
        if update_data.display_name is not None:
            target_user.display_name = update_data.display_name
            changes.append(f"display_name: {old_values['display_name']} -> {update_data.display_name}")
        
        if not changes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="没有提供任何更新数据"
            )
        
        # 保存更改
        db.commit()
        db.refresh(target_user)
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "update_user",
            f"user_id={user_id}",
            f"更新用户 {target_user.email}: {', '.join(changes)}"
        )
        
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
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    删除用户（软删除）
    
    将用户标记为非活跃状态，而不是从数据库中物理删除
    """
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
        
        # 防止删除其他管理员
        if target_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不能删除其他管理员账户"
            )
        
        # 软删除：将用户设为非活跃状态
        target_user.is_active = False
        
        # 获取用户的思维导图数量（用于日志）
        mindmap_count = db.query(Mindmap).filter(Mindmap.user_id == user_id).count()
        
        db.commit()
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "delete_user",
            f"user_id={user_id}",
            f"软删除用户 {target_user.email}，该用户有 {mindmap_count} 个思维导图"
        )
        
        return {
            "success": True,
            "message": f"用户 {target_user.email} 已被删除（软删除）",
            "details": f"该用户有 {mindmap_count} 个思维导图"
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

@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: int,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    获取用户详细信息
    
    包括用户基本信息、思维导图列表、邀请记录等
    """
    try:
        # 查找目标用户
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 获取用户的思维导图列表
        mindmaps = db.query(Mindmap).filter(Mindmap.user_id == user_id).order_by(desc(Mindmap.created_at)).limit(10).all()
        
        # 获取用户创建的邀请码
        created_invitations = db.query(InvitationCode).filter(InvitationCode.generated_by_user_id == user_id).count()
        
        # 获取用户使用的邀请码
        used_invitation = db.query(InvitationCode).filter(InvitationCode.used_by_user_id == user_id).first()
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "view_user_detail",
            f"user_id={user_id}",
            f"查看用户 {target_user.email} 的详细信息"
        )
        
        return {
            "user": target_user.to_dict(),
            "mindmaps": [
                {
                    "id": mm.id,
                    "title": mm.title,
                    "created_at": mm.created_at,
                    "is_public": mm.is_public
                } for mm in mindmaps
            ],
            "mindmap_total": db.query(Mindmap).filter(Mindmap.user_id == user_id).count(),
            "created_invitations": created_invitations,
            "used_invitation": used_invitation.code if used_invitation else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取用户详细信息失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取用户详细信息失败"
        )

@router.post("/invitations")
async def create_admin_invitations(
    request: InvitationCreateRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    管理员批量生成邀请码
    
    管理员可以一次性生成多个邀请码用于用户注册
    """
    try:
        if request.count <= 0 or request.count > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码数量必须在1-100之间"
            )
        
        created_codes = []
        
        for i in range(request.count):
            # 生成邀请码
            invitation_code = create_invitation_code(
                db=db,
                generated_by_user_id=admin_user.id,
                description=request.description or f"管理员批量生成 {i+1}/{request.count}"
            )
            created_codes.append({
                "code": invitation_code.code,
                "created_at": invitation_code.created_at,
                "description": invitation_code.description
            })
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "create_invitations",
            f"count={request.count}",
            f"批量生成 {request.count} 个邀请码"
        )
        
        return {
            "success": True,
            "message": f"成功生成 {request.count} 个邀请码",
            "invitations": created_codes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"管理员生成邀请码失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="生成邀请码失败"
        )

@router.get("/invitations")
async def get_admin_invitations(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(20, ge=1, le=100, description="每页数量"),
    status_filter: Optional[str] = Query(None, description="状态筛选: used, unused, all")
):
    """
    获取邀请码列表
    
    管理员可以查看所有邀请码的使用情况
    """
    try:
        # 检查invitation_codes表是否存在
        try:
            # 构建查询
            query = db.query(InvitationCode)
            
            # 状态筛选
            if status_filter == "used":
                query = query.filter(InvitationCode.used_by_user_id.isnot(None))
            elif status_filter == "unused":
                query = query.filter(InvitationCode.used_by_user_id.is_(None))
            
            # 获取总数
            total = query.count()
            
            # 分页
            offset = (page - 1) * per_page
            invitations = query.order_by(desc(InvitationCode.created_at)).offset(offset).limit(per_page).all()
        except Exception as table_error:
            logger.warning(f"邀请码表查询失败，可能表不存在: {str(table_error)}")
            # 返回空结果
            return {
                "invitations": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
                "total_pages": 0
            }
        
        # 构建邀请码列表
        invitation_list = []
        for invitation in invitations:
            # 获取创建者信息
            creator = db.query(User).filter(User.id == invitation.generated_by_user_id).first()
            # 获取使用者信息
            used_by = None
            if invitation.used_by_user_id:
                used_by = db.query(User).filter(User.id == invitation.used_by_user_id).first()
            
            invitation_list.append({
                "id": invitation.id,
                "code": invitation.code,
                "description": invitation.description,
                "is_used": invitation.used_by_user_id is not None,
                "created_at": invitation.created_at,
                "used_at": invitation.used_at,
                "created_by": creator.email if creator else "未知",
                "used_by": used_by.email if used_by else None
            })
        
        # 计算总页数
        total_pages = (total + per_page - 1) // per_page
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "view_invitations",
            f"page={page},filter={status_filter}",
            f"查看邀请码列表，共{total}个邀请码"
        )
        
        return {
            "invitations": invitation_list,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }
        
    except Exception as e:
        logger.error(f"获取邀请码列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取邀请码列表失败"
        )


@router.post("/users/{user_id}/reset-password")
async def admin_reset_user_password(
    user_id: int,
    request: UserPasswordResetRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    管理员重置用户密码
    
    管理员可以为任何用户重置密码，无需原密码验证
    """
    try:
        # 查找目标用户
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 防止管理员重置自己的密码（应该通过正常流程）
        if target_user.id == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="请使用账户设置页面修改自己的密码"
            )
        
        # 密码强度验证
        is_valid, error_message = validate_password(request.new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"密码不符合要求: {error_message}"
            )
        
        # 更新密码
        old_password_hint = target_user.password_hash[:10] + "..." if target_user.password_hash else "无"
        target_user.password_hash = get_password_hash(request.new_password)
        
        db.commit()
        db.refresh(target_user)
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "reset_user_password",
            f"user_id={user_id}",
            f"为用户 {target_user.email} 重置密码"
        )
        
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
    request: TempPasswordGenerateRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    管理员为用户生成临时密码
    
    生成一个临时密码，用户可以使用此密码登录并自行修改密码
    """
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
        
        # 验证有效期参数
        if request.valid_hours <= 0 or request.valid_hours > 168:  # 最长一周
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="临时密码有效期必须在1-168小时之间"
            )
        
        # 生成强临时密码：8位字母数字组合
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        
        # 更新用户密码
        target_user.password_hash = get_password_hash(temp_password)
        
        # TODO: 在实际生产环境中，应该在数据库中记录临时密码的过期时间
        # 这里我们先实现基础功能，后续可以添加临时密码管理表
        
        db.commit()
        db.refresh(target_user)
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "generate_temp_password",
            f"user_id={user_id},valid_hours={request.valid_hours}",
            f"为用户 {target_user.email} 生成临时密码，有效期 {request.valid_hours} 小时"
        )
        
        return {
            "success": True,
            "message": f"已为用户 {target_user.email} 生成临时密码",
            "temp_password": temp_password,
            "user_email": target_user.email,
            "valid_hours": request.valid_hours,
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