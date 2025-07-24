"""
管理员权限认证模块
提供管理员权限验证和中间件功能
"""

import logging
from typing import Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.api.auth import get_current_user

# 配置日志
logger = logging.getLogger(__name__)

async def get_current_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    获取当前管理员用户
    
    验证当前用户是否为管理员（is_superuser = True）
    如果不是管理员，抛出403权限不足异常
    
    Args:
        current_user: 当前认证用户
        db: 数据库会话
        
    Returns:
        User: 管理员用户对象
        
    Raises:
        HTTPException: 403 权限不足
    """
    if not current_user:
        logger.warning("管理员权限检查失败：用户未登录")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="需要登录才能访问管理员功能"
        )
    
    if not current_user.is_superuser:
        logger.warning(f"管理员权限检查失败：用户 {current_user.email} 不是管理员")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限才能访问此功能"
        )
    
    if not current_user.is_active:
        logger.warning(f"管理员权限检查失败：管理员账户 {current_user.email} 已被禁用")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理员账户已被禁用"
        )
    
    logger.info(f"管理员权限验证成功：{current_user.email}")
    return current_user

def log_admin_action(admin_user: User, action: str, target: str = "", details: str = ""):
    """
    记录管理员操作日志
    
    Args:
        admin_user: 执行操作的管理员用户
        action: 操作类型（如：create_user, disable_user, delete_mindmap等）
        target: 操作目标（如：用户ID、思维导图ID等）
        details: 操作详情
    """
    log_message = f"[ADMIN_ACTION] 管理员: {admin_user.email} | 操作: {action}"
    
    if target:
        log_message += f" | 目标: {target}"
    
    if details:
        log_message += f" | 详情: {details}"
    
    logger.info(log_message)

def check_admin_permission(user: Optional[User]) -> bool:
    """
    检查用户是否具有管理员权限
    
    Args:
        user: 用户对象
        
    Returns:
        bool: 是否为管理员
    """
    if not user:
        return False
    
    return user.is_superuser and user.is_active

def require_admin_permission(user: User) -> None:
    """
    要求管理员权限，如果不满足则抛出异常
    
    Args:
        user: 用户对象
        
    Raises:
        HTTPException: 403 权限不足
    """
    if not check_admin_permission(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )