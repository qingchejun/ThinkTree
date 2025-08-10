"""
邀请码管理工具函数
"""

import secrets
import string
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..models.invitation import InvitationCode
from ..models.user import User


def generate_invitation_code(length: int = 8) -> str:
    """
    生成邀请码
    
    Args:
        length: 邀请码长度，默认8位
        
    Returns:
        生成的邀请码字符串
    """
    # 使用数字和大写字母，避免混淆的字符（如0、O、1、I）
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_referral_code(db: Session, length: int = 8) -> str:
    """
    生成用于用户固定推荐码的唯一短码（与一次性邀请码区分）。
    """
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    for _ in range(20):
        code = ''.join(secrets.choice(alphabet) for _ in range(length))
        exists = db.query(User).filter(User.referral_code == code).first()
        if not exists:
            return code
    raise RuntimeError("无法生成唯一推荐码，请稍后重试")


def generate_unique_invitation_code(db: Session, length: int = 8, max_attempts: int = 10) -> str:
    """
    生成唯一的邀请码
    
    Args:
        db: 数据库会话
        length: 邀请码长度
        max_attempts: 最大尝试次数
        
    Returns:
        唯一的邀请码
        
    Raises:
        RuntimeError: 如果无法生成唯一邀请码
    """
    for _ in range(max_attempts):
        code = generate_invitation_code(length)
        # 检查是否已存在
        existing = db.query(InvitationCode).filter(InvitationCode.code == code).first()
        if not existing:
            return code
    
    raise RuntimeError(f"无法在 {max_attempts} 次尝试内生成唯一邀请码")


def create_invitation_code(
    db: Session, 
    generated_by_user_id: int, 
    description: Optional[str] = None,
    expires_hours: Optional[int] = None
) -> InvitationCode:
    """
    创建新的邀请码
    
    Args:
        db: 数据库会话
        generated_by_user_id: 生成邀请码的用户ID
        description: 邀请码描述
        expires_hours: 过期时间（小时），None表示永不过期
        
    Returns:
        创建的邀请码对象
    """
    code = generate_unique_invitation_code(db)
    
    expires_at = None
    if expires_hours is not None:
        expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
    
    invitation = InvitationCode(
        code=code,
        generated_by_user_id=generated_by_user_id,
        description=description,
        expires_at=expires_at
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    return invitation


def validate_invitation_code(db: Session, code: str) -> tuple[bool, Optional[str], Optional[InvitationCode]]:
    """
    验证邀请码
    
    Args:
        db: 数据库会话
        code: 邀请码
        
    Returns:
        (是否有效, 错误信息, 邀请码对象)
    """
    # 特殊处理：管理员初始化邀请码
    if code == "ADMIN_INIT":
        # 检查是否已有管理员用户
        existing_admin = db.query(User).filter(User.email == "admin@thinktree.com").first()
        if existing_admin:
            return False, "管理员账户已存在，无法使用初始化邀请码", None
        
        # 返回特殊的成功标识（invitation为None表示这是特殊邀请码）
        return True, None, None
    
    # 查找邀请码
    invitation = db.query(InvitationCode).filter(InvitationCode.code == code).first()
    
    if not invitation:
        return False, "邀请码不存在", None
    
    if invitation.is_used:
        return False, "邀请码已被使用", invitation
    
    if invitation.is_expired:
        return False, "邀请码已过期", invitation
    
    return True, None, invitation


def use_invitation_code(db: Session, code: str, used_by_user_id: int) -> bool:
    """
    使用邀请码
    
    Args:
        db: 数据库会话
        code: 邀请码
        used_by_user_id: 使用邀请码的用户ID
        
    Returns:
        是否成功使用
    """
    is_valid, error_msg, invitation = validate_invitation_code(db, code)
    
    if not is_valid:
        return False
    
    # 特殊处理：管理员初始化邀请码不需要标记为已使用
    if code == "ADMIN_INIT":
        return True
    
    # 标记为已使用
    invitation.is_used = True
    invitation.used_by_user_id = used_by_user_id
    invitation.used_at = datetime.utcnow()
    
    db.commit()
    return True


def get_user_invitation_stats(db: Session, user_id: int) -> dict:
    """
    获取用户邀请码统计信息
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        统计信息字典
    """
    # 查询用户生成的所有邀请码
    invitations = db.query(InvitationCode).filter(
        InvitationCode.generated_by_user_id == user_id
    ).all()
    
    total_generated = len(invitations)
    used_count = sum(1 for inv in invitations if inv.is_used)
    expired_count = sum(1 for inv in invitations if inv.is_expired and not inv.is_used)
    active_count = sum(1 for inv in invitations if inv.is_valid)
    
    return {
        "total_generated": total_generated,
        "used_count": used_count,
        "expired_count": expired_count,
        "active_count": active_count,
        "remaining_quota": max(0, get_user_invitation_quota(db, user_id) - total_generated)
    }


def get_user_invitation_quota(db: Session, user_id: int) -> int:
    """
    获取用户邀请码生成配额
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        邀请码配额数量
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return 0
    
    # TODO: 后续可以根据用户等级、VIP状态等设置不同配额
    # 目前简单实现：普通用户10个，管理员无限制
    
    # 假设管理员邮箱包含admin或者是特定邮箱
    if "admin" in user.email or user.email in ["admin@thinktree.com"]:
        return 999999  # 管理员无限制
    
    return 10  # 普通用户10个


def can_generate_invitation(db: Session, user_id: int) -> tuple[bool, Optional[str]]:
    """
    检查用户是否可以生成新的邀请码
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        (是否可以生成, 错误信息)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False, "用户不存在"
    
    if not user.is_verified:
        return False, "请先验证邮箱后再生成邀请码"
    
    stats = get_user_invitation_stats(db, user_id)
    quota = get_user_invitation_quota(db, user_id)
    
    if stats["total_generated"] >= quota:
        return False, f"已达到邀请码生成上限 ({quota} 个)"
    
    return True, None


def generate_invitation_link(code: str, frontend_url: str = "http://localhost:3000") -> str:
    """
    生成邀请链接
    
    Args:
        code: 邀请码
        frontend_url: 前端URL
        
    Returns:
        完整的邀请链接
    """
    return f"{frontend_url}/register?invitation_code={code}"