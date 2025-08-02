"""
管理员后台 API 路由
提供管理员专用的用户管理、统计查看等功能
"""

import logging
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.user import User
from app.models.mindmap import Mindmap
from app.models.invitation import InvitationCode
from app.models.redemption_code import RedemptionCode, RedemptionCodeStatus
from app.utils.admin_auth import get_current_admin, log_admin_action
from app.utils.invitation_utils import create_invitation_code
from app.utils.security import get_password_hash, validate_password

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

class EmailResetRequest(BaseModel):
    """邮件重置密码请求模型"""
    reset_type: str = "admin"  # 重置类型：admin（管理员发起）或 user（用户自助）
    custom_message: Optional[str] = None  # 自定义消息

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

@router.post("/users/{user_id}/send-reset-email")
async def send_password_reset_email(
    user_id: int,
    request: EmailResetRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    管理员发送密码重置邮件
    
    为指定用户发送密码重置邮件，用户可通过邮件链接自行重置密码
    """
    try:
        # 查找目标用户
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 防止管理员为自己发送重置邮件
        if target_user.id == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="请使用账户设置页面修改自己的密码"
            )
        
        # 生成重置令牌
        reset_token = secrets.token_urlsafe(32)
        
        # TODO: 在实际生产环境中，应该：
        # 1. 将重置令牌存储到数据库中，设置过期时间
        # 2. 配置邮件服务（SMTP）
        # 3. 发送包含重置链接的邮件
        
        # 目前模拟邮件发送功能
        reset_link = f"https://thinktree-frontend.onrender.com/reset-password?token={reset_token}"
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "send_reset_email",
            f"user_id={user_id}",
            f"为用户 {target_user.email} 发送密码重置邮件"
        )
        
        # 在实际生产环境中，这里应该调用邮件服务
        # 目前返回模拟结果
        
        return {
            "success": True,
            "message": f"密码重置邮件已发送到 {target_user.email}",
            "user_email": target_user.email,
            "reset_link": reset_link,  # 仅开发阶段显示，生产环境应移除
            "sent_time": datetime.now().isoformat(),
            "note": "用户将收到包含重置链接的邮件，链接有效期为24小时",
            "development_notice": "当前为开发模式，实际生产环境需要配置邮件服务"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发送密码重置邮件失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="发送重置邮件失败"
        )


# ===== 兑换码管理功能 =====

class RedemptionCodeCreateRequest(BaseModel):
    """管理员创建兑换码请求模型"""
    quantity: int = Field(..., gt=0, le=100, description="生成数量，1-100之间")
    credits_amount: int = Field(..., gt=0, le=10000, description="积分面额，1-10000之间")
    expires_in_days: int = Field(..., gt=0, le=365, description="有效期天数，1-365之间")


class RedemptionCodeItem(BaseModel):
    """兑换码项模型"""
    code: str = Field(..., description="兑换码")
    credits_amount: int = Field(..., description="积分面额")
    expires_at: datetime = Field(..., description="过期时间")


class RedemptionCodeCreateResponse(BaseModel):
    """兑换码创建响应模型"""
    success: bool = Field(..., description="是否创建成功")
    message: str = Field(..., description="响应消息")
    codes: List[str] = Field(..., description="生成的兑换码列表")
    total_generated: int = Field(..., description="生成的总数量")
    expires_at: datetime = Field(..., description="过期时间")


class RedemptionCodeListItem(BaseModel):
    """兑换码列表项模型"""
    id: int = Field(..., description="兑换码ID")
    code: str = Field(..., description="兑换码")
    credits_amount: int = Field(..., description="积分面额")
    status: str = Field(..., description="状态：ACTIVE/REDEEMED/EXPIRED")
    created_at: datetime = Field(..., description="创建时间")
    expires_at: datetime = Field(..., description="过期时间")
    redeemed_at: Optional[datetime] = Field(None, description="兑换时间")
    redeemed_by_email: Optional[str] = Field(None, description="兑换用户邮箱")


class RedemptionCodeListResponse(BaseModel):
    """兑换码列表响应模型"""
    codes: List[RedemptionCodeListItem] = Field(..., description="兑换码列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页码")
    per_page: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")


def generate_redemption_code() -> str:
    """生成一个8位兑换码"""
    # 使用大写字母和数字，避免容易混淆的字符
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  # 移除 0,O,1,I 等容易混淆的字符
    return ''.join(secrets.choice(chars) for _ in range(8))


@router.post("/redemption-codes", response_model=RedemptionCodeCreateResponse)
async def create_redemption_codes(
    request: RedemptionCodeCreateRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    管理员批量生成兑换码
    
    权限要求：仅管理员（is_superuser=True）可访问
    """
    try:
        logger.info(f"管理员 {admin_user.email} 开始生成兑换码：数量={request.quantity}, 面额={request.credits_amount}, 有效期={request.expires_in_days}天")
        
        # 计算过期时间
        expires_at = datetime.now(timezone.utc) + timedelta(days=request.expires_in_days)
        
        generated_codes = []
        
        # 批量生成兑换码
        for i in range(request.quantity):
            # 生成唯一兑换码
            attempts = 0
            while attempts < 50:  # 最多尝试50次
                code = generate_redemption_code()
                existing = db.query(RedemptionCode).filter(RedemptionCode.code == code).first()
                if not existing:
                    break
                attempts += 1
            
            if attempts >= 50:
                logger.error(f"无法为第{i+1}个兑换码生成唯一代码")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"生成第{i+1}个兑换码时失败，请重试"
                )
            
            # 创建兑换码记录
            redemption_code = RedemptionCode(
                code=code,
                credits_amount=request.credits_amount,
                status=RedemptionCodeStatus.ACTIVE,
                expires_at=expires_at
            )
            
            db.add(redemption_code)
            generated_codes.append(code)
        
        # 提交到数据库
        db.commit()
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "create_redemption_codes",
            f"quantity={request.quantity},credits={request.credits_amount},days={request.expires_in_days}",
            f"批量生成{request.quantity}个兑换码，面额{request.credits_amount}积分，有效期{request.expires_in_days}天"
        )
        
        logger.info(f"管理员 {admin_user.email} 成功生成{len(generated_codes)}个兑换码")
        
        return RedemptionCodeCreateResponse(
            success=True,
            message=f"成功生成{len(generated_codes)}个兑换码",
            codes=generated_codes,
            total_generated=len(generated_codes),
            expires_at=expires_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"生成兑换码失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="生成兑换码失败，请稍后重试"
        )


@router.get("/redemption-codes", response_model=RedemptionCodeListResponse)
async def get_redemption_codes_list(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(20, ge=1, le=100, description="每页数量"),
    status_filter: Optional[str] = Query(None, description="状态筛选: ACTIVE, REDEEMED, EXPIRED, ALL")
):
    """
    获取兑换码列表
    
    管理员可以查看所有兑换码的详细信息，包括状态、面额、过期时间、被谁兑换等
    权限要求：仅管理员（is_superuser=True）可访问
    """
    try:
        logger.info(f"管理员 {admin_user.email} 查看兑换码列表，页码={page}，状态筛选={status_filter}")
        
        # 构建查询
        query = db.query(RedemptionCode)
        
        # 状态筛选
        if status_filter and status_filter != "ALL":
            if status_filter in ["ACTIVE", "REDEEMED", "EXPIRED"]:
                query = query.filter(RedemptionCode.status == RedemptionCodeStatus(status_filter))
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="无效的状态筛选值，支持: ACTIVE, REDEEMED, EXPIRED, ALL"
                )
        
        # 获取总数
        total = query.count()
        
        # 分页查询
        offset = (page - 1) * per_page
        codes = query.order_by(desc(RedemptionCode.created_at)).offset(offset).limit(per_page).all()
        
        # 构建兑换码列表
        code_list = []
        for code in codes:
            # 获取兑换用户信息
            redeemed_by_email = None
            if code.redeemed_by_user_id:
                redeemed_user = db.query(User).filter(User.id == code.redeemed_by_user_id).first()
                if redeemed_user:
                    redeemed_by_email = redeemed_user.email
            
            code_list.append(RedemptionCodeListItem(
                id=code.id,
                code=code.code,
                credits_amount=code.credits_amount,
                status=code.status.value,
                created_at=code.created_at,
                expires_at=code.expires_at,
                redeemed_at=code.redeemed_at,
                redeemed_by_email=redeemed_by_email
            ))
        
        # 计算总页数
        total_pages = (total + per_page - 1) // per_page
        
        # 记录管理员操作
        log_admin_action(
            admin_user,
            "view_redemption_codes",
            f"page={page},status_filter={status_filter}",
            f"查看兑换码列表，共{total}个兑换码"
        )
        
        logger.info(f"管理员 {admin_user.email} 成功获取兑换码列表，共{total}条记录")
        
        return RedemptionCodeListResponse(
            codes=code_list,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取兑换码列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取兑换码列表失败，请稍后重试"
        )


# ========================================
# 临时管理员设置端点 (一次性使用)
# ⚠️ 使用后请立即删除此部分代码！
# ========================================

import os

# 临时安全密钥 - 从环境变量获取
TEMP_ADMIN_SECRET = os.getenv("TEMP_ADMIN_SECRET", "CHANGE_THIS_SECRET_KEY_2024")

class TempAdminSetupResponse(BaseModel):
    """临时管理员设置响应模型"""
    success: bool
    message: str
    user_info: Optional[dict] = None
    admin_permissions: Optional[List[str]] = None

@router.post("/temp-setup-admin", response_model=TempAdminSetupResponse)
async def temp_setup_admin(
    email: str = Query(..., description="要设置为管理员的用户邮箱"),
    secret: str = Query(..., description="安全密钥"),
    db: Session = Depends(get_db)
):
    """
    临时管理员设置端点
    ⚠️ 仅用于一次性设置，使用后请删除此端点！
    
    使用方法:
    POST /api/admin/temp-setup-admin?email=thinktree.app@gmail.com&secret=YOUR_SECRET
    """
    # 验证安全密钥
    if secret != TEMP_ADMIN_SECRET:
        logger.warning(f"临时管理员设置尝试失败：密钥错误，邮箱={email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid secret key"
        )
    
    try:
        # 查找用户
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            logger.warning(f"临时管理员设置失败：用户不存在，邮箱={email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with email {email} not found. Please ensure the user is registered first."
            )
        
        # 检查是否已经是管理员
        if user.is_superuser:
            logger.info(f"用户 {email} 已经是管理员")
            return TempAdminSetupResponse(
                success=True,
                message=f"User {email} is already an admin",
                user_info={
                    "id": user.id,
                    "email": user.email,
                    "display_name": user.display_name,
                    "is_superuser": user.is_superuser,
                    "is_active": user.is_active,
                    "is_verified": user.is_verified
                }
            )
        
        # 设置为管理员
        user.is_superuser = True
        user.is_active = True
        user.is_verified = True
        
        db.commit()
        
        logger.info(f"✅ 成功将用户 {email} (ID: {user.id}) 设置为管理员")
        
        return TempAdminSetupResponse(
            success=True,
            message=f"Successfully promoted {email} to admin",
            user_info={
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "is_superuser": user.is_superuser,
                "is_active": user.is_active,
                "is_verified": user.is_verified
            },
            admin_permissions=[
                "Access admin dashboard",
                "Manage users",
                "Manage invitation codes", 
                "Generate redemption codes",
                "View system statistics"
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"临时管理员设置失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set admin: {str(e)}"
        )