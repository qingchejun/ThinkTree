"""
邀请码管理 API 路由
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..models.user import User
from ..models.invitation import InvitationCode
from ..utils.invitation_utils import (
    create_invitation_code,
    get_user_invitation_stats,
    can_generate_invitation,
    generate_invitation_link,
    generate_referral_code
)
from ..core.config import settings
from .auth import get_current_user

router = APIRouter()


# Pydantic 模型
class CreateInvitationRequest(BaseModel):
    """创建邀请码请求模型"""
    description: Optional[str] = None
    expires_hours: Optional[int] = None  # None 表示永不过期


class InvitationResponse(BaseModel):
    """邀请码响应模型"""
    id: int
    code: str
    description: Optional[str]
    is_used: bool
    expires_at: Optional[str]
    created_at: str
    used_at: Optional[str]
    used_by_user_id: Optional[int]
    invitation_link: str


class InvitationStatsResponse(BaseModel):
    """邀请码统计响应模型"""
    total_generated: int
    used_count: int
    expired_count: int
    active_count: int
    remaining_quota: int
    user_quota: int
    # 新增：推荐统计
    referral_limit: int | None = None
    referral_used: int | None = None


class CreateInvitationResponse(BaseModel):
    """创建邀请码响应模型"""
    success: bool
    message: str
    invitation: Optional[InvitationResponse] = None


@router.get("/stats", response_model=InvitationStatsResponse)
async def get_invitation_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户的邀请码统计信息
    """
    stats = get_user_invitation_stats(db, current_user.id)
    # 带上新推荐字段，保持兼容
    try:
        user_ref_limit = getattr(current_user, 'referral_limit', 10)
        user_ref_used = getattr(current_user, 'referral_used', 0)
    except Exception:
        user_ref_limit, user_ref_used = 10, 0

    return InvitationStatsResponse(
        total_generated=stats["total_generated"],
        used_count=stats["used_count"],
        expired_count=stats["expired_count"],
        active_count=stats["active_count"],
        remaining_quota=stats["remaining_quota"],
        user_quota=stats["remaining_quota"] + stats["total_generated"],
        referral_limit=user_ref_limit,
        referral_used=user_ref_used
    )


@router.get("/list", response_model=List[InvitationResponse])
async def get_user_invitations(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    include_used: bool = Query(True, description="是否包含已使用的邀请码"),
    include_expired: bool = Query(True, description="是否包含已过期的邀请码"),
    limit: int = Query(50, le=100, description="返回数量限制")
):
    """
    获取当前用户生成的邀请码列表
    """
    query = db.query(InvitationCode).filter(
        InvitationCode.generated_by_user_id == current_user.id
    )
    
    # 根据参数过滤
    if not include_used:
        query = query.filter(InvitationCode.is_used == False)
    
    if not include_expired:
        query = query.filter(
            (InvitationCode.expires_at.is_(None)) |
            (InvitationCode.expires_at > datetime.utcnow())
        )
    
    invitations = query.order_by(InvitationCode.created_at.desc()).limit(limit).all()
    
    # 构造响应
    result = []
    for inv in invitations:
        result.append(InvitationResponse(
            id=inv.id,
            code=inv.code,
            description=inv.description,
            is_used=inv.is_used,
            expires_at=inv.expires_at.isoformat() if inv.expires_at else None,
            created_at=inv.created_at.isoformat(),
            used_at=inv.used_at.isoformat() if inv.used_at else None,
            used_by_user_id=inv.used_by_user_id,
            invitation_link=generate_invitation_link(inv.code, settings.frontend_url)
        ))
    
    return result


@router.post("/create", response_model=CreateInvitationResponse)
async def create_invitation(
    request: Request,
    invitation_request: CreateInvitationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新的邀请码
    """
    # 添加调试信息
    print(f"DEBUG: 用户 {current_user.id} 尝试创建邀请码")
    print(f"DEBUG: 用户验证状态: {current_user.is_verified}")
    print(f"DEBUG: 请求数据: {request}")
    
    # 权限收拢：仅管理员可以生成一次性邀请码
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可生成一次性邀请码"
        )
    
    try:
        # 创建邀请码
        invitation = create_invitation_code(
            db=db,
            generated_by_user_id=current_user.id,
            description=invitation_request.description,
            expires_hours=invitation_request.expires_hours
        )
        
        # 构造响应
        invitation_response = InvitationResponse(
            id=invitation.id,
            code=invitation.code,
            description=invitation.description,
            is_used=invitation.is_used,
            expires_at=invitation.expires_at.isoformat() if invitation.expires_at else None,
            created_at=invitation.created_at.isoformat(),
            used_at=invitation.used_at.isoformat() if invitation.used_at else None,
            used_by_user_id=invitation.used_by_user_id,
            invitation_link=generate_invitation_link(invitation.code, settings.frontend_url)
        )
        
        return CreateInvitationResponse(
            success=True,
            message="邀请码创建成功",
            invitation=invitation_response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建邀请码失败: {str(e)}"
        )


@router.get("/{invitation_id}", response_model=InvitationResponse)
async def get_invitation_detail(
    request: Request,
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取邀请码详情
    """
    invitation = db.query(InvitationCode).filter(
        InvitationCode.id == invitation_id,
        InvitationCode.generated_by_user_id == current_user.id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="邀请码不存在或您无权访问"
        )
    
    return InvitationResponse(
        id=invitation.id,
        code=invitation.code,
        description=invitation.description,
        is_used=invitation.is_used,
        expires_at=invitation.expires_at.isoformat() if invitation.expires_at else None,
        created_at=invitation.created_at.isoformat(),
        used_at=invitation.used_at.isoformat() if invitation.used_at else None,
        used_by_user_id=invitation.used_by_user_id,
        invitation_link=generate_invitation_link(invitation.code, settings.frontend_url)
    )


@router.delete("/{invitation_id}")
async def delete_invitation(
    request: Request,
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除邀请码 (仅能删除未使用的邀请码)
    """
    invitation = db.query(InvitationCode).filter(
        InvitationCode.id == invitation_id,
        InvitationCode.generated_by_user_id == current_user.id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="邀请码不存在或您无权访问"
        )
    
    if invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无法删除已使用的邀请码"
        )
    
    try:
        db.delete(invitation)
        db.commit()
        
        return {
            "success": True,
            "message": f"邀请码 {invitation.code} 已成功删除"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除邀请码失败: {str(e)}"
        )


class ValidateInvitationRequest(BaseModel):
    """验证邀请码请求模型"""
    code: str


class ValidateInvitationResponse(BaseModel):
    """验证邀请码响应模型"""
    valid: bool
    message: str
    invitation_info: Optional[dict] = None


@router.post("/validate", response_model=ValidateInvitationResponse)
async def validate_invitation_code_api(
    request: Request,
    validation_request: ValidateInvitationRequest,
    db: Session = Depends(get_db)
):
    """
    验证邀请码（公开接口，用于注册前验证）
    """
    from ..utils.invitation_utils import validate_invitation_code
    
    is_valid, error_msg, invitation = validate_invitation_code(db, validation_request.code)
    
    if not is_valid:
        return ValidateInvitationResponse(
            valid=False,
            message=error_msg
        )
    
    # 获取邀请者信息
    inviter = db.query(User).filter(User.id == invitation.generated_by_user_id).first()
    
    return ValidateInvitationResponse(
        valid=True,
        message="邀请码有效",
        invitation_info={
            "code": invitation.code,
            "description": invitation.description,
            "created_at": invitation.created_at.isoformat(),
            "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
            "inviter_email": inviter.email if inviter else "未知"
        }
    )