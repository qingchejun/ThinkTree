"""
安全工具模块

提供密码哈希、JWT 令牌生成和验证功能
"""

from datetime import datetime, timedelta
from typing import Optional, Union
from passlib.context import CryptContext
from jose import JWTError, jwt

from ..core.config import settings

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码是否正确
    
    Args:
        plain_password: 明文密码
        hashed_password: 哈希密码
        
    Returns:
        bool: 密码是否匹配
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    生成密码哈希
    
    Args:
        password: 明文密码
        
    Returns:
        str: 哈希密码
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    创建 JWT 访问令牌
    
    Args:
        data: 要编码的数据
        expires_delta: 过期时间间隔
        
    Returns:
        str: JWT 令牌
    """
    to_encode = data.copy()
    
    # 设置过期时间
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    
    # 生成 JWT
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.secret_key, 
        algorithm="HS256"
    )
    
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    验证并解码 JWT 令牌
    
    Args:
        token: JWT 令牌
        
    Returns:
        dict: 解码后的数据，如果无效则返回 None
    """
    try:
        payload = jwt.decode(
            token, 
            settings.secret_key, 
            algorithms=["HS256"]
        )
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> Optional[int]:
    """
    从 JWT 令牌中提取用户 ID
    
    Args:
        token: JWT 令牌
        
    Returns:
        int: 用户 ID，如果无效则返回 None
    """
    payload = verify_token(token)
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    try:
        return int(user_id)
    except (ValueError, TypeError):
        return None


def validate_email(email: str) -> bool:
    """
    简单的邮箱格式验证
    
    Args:
        email: 邮箱地址
        
    Returns:
        bool: 邮箱格式是否有效
    """
    import re
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str]:
    """
    密码强度验证
    
    Args:
        password: 密码
        
    Returns:
        tuple: (是否有效, 错误信息)
    """
    if len(password) < 8:
        return False, "密码长度至少 8 位"
    
    if len(password) > 128:
        return False, "密码长度不能超过 128 位"
    
    # 可以添加更多密码复杂度要求
    # if not re.search(r"[A-Z]", password):
    #     return False, "密码必须包含至少一个大写字母"
    
    # if not re.search(r"[a-z]", password):
    #     return False, "密码必须包含至少一个小写字母"
    
    # if not re.search(r"\d", password):
    #     return False, "密码必须包含至少一个数字"
    
    return True, "" 