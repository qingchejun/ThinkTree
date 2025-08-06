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
    
    to_encode.update({"exp": expire, "type": "access"})
    
    # 生成 JWT
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.secret_key, 
        algorithm="HS256"
    )
    
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    创建 JWT 刷新令牌
    
    Args:
        data: 要编码的数据
        expires_delta: 过期时间间隔
        
    Returns:
        str: JWT 刷新令牌
    """
    to_encode = data.copy()
    
    # 设置过期时间 - 默认7天
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
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
    强密码验证 - 确保密码符合安全策略
    
    密码策略要求：
    - 最小长度：8位
    - 最大长度：128位
    - 复杂度：必须同时包含大写字母、小写字母、数字和特殊字符中的至少三种
    
    Args:
        password: 密码
        
    Returns:
        tuple: (是否有效, 错误信息)
    """
    import re
    
    # 基础长度检查
    if len(password) < 8:
        return False, "密码长度至少 8 位"
    
    if len(password) > 128:
        return False, "密码长度不能超过 128 位"
    
    # 复杂度检查 - 统计包含的字符类型
    character_types = 0
    requirements = []
    
    # 检查大写字母
    if re.search(r"[A-Z]", password):
        character_types += 1
    else:
        requirements.append("大写字母")
    
    # 检查小写字母
    if re.search(r"[a-z]", password):
        character_types += 1
    else:
        requirements.append("小写字母")
    
    # 检查数字
    if re.search(r"\d", password):
        character_types += 1
    else:
        requirements.append("数字")
    
    # 检查特殊字符
    if re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]", password):
        character_types += 1
    else:
        requirements.append("特殊字符")
    
    # 需要至少包含三种字符类型
    if character_types < 3:
        missing_count = 3 - character_types
        if len(requirements) >= missing_count:
            missing_types = requirements[:missing_count]
            return False, f"密码必须至少包含以下{missing_count}种字符类型中的任意组合：{', '.join(missing_types)}"
        else:
            return False, "密码必须包含大写字母、小写字母、数字和特殊字符中的至少三种"
    
    return True, ""


def get_password_strength(password: str) -> dict:
    """
    获取密码强度详细信息 - 用于前端显示
    
    Args:
        password: 密码
        
    Returns:
        dict: 密码强度详细信息
    """
    import re
    
    strength_info = {
        "length": len(password) >= 8,
        "has_uppercase": bool(re.search(r"[A-Z]", password)),
        "has_lowercase": bool(re.search(r"[a-z]", password)),
        "has_numbers": bool(re.search(r"\d", password)),
        "has_special": bool(re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]", password)),
        "is_valid": False,
        "strength_level": "weak",
        "score": 0
    }
    
    # 计算强度分数
    score = 0
    if strength_info["length"]:
        score += 1
    if strength_info["has_uppercase"]:
        score += 1
    if strength_info["has_lowercase"]:
        score += 1
    if strength_info["has_numbers"]:
        score += 1
    if strength_info["has_special"]:
        score += 1
    
    strength_info["score"] = score
    
    # 判断是否符合强密码策略（至少3种字符类型且长度>=8）
    character_types = sum([
        strength_info["has_uppercase"],
        strength_info["has_lowercase"], 
        strength_info["has_numbers"],
        strength_info["has_special"]
    ])
    
    strength_info["is_valid"] = strength_info["length"] and character_types >= 3
    
    # 设置强度等级
    if score <= 2:
        strength_info["strength_level"] = "weak"
    elif score == 3:
        strength_info["strength_level"] = "medium"
    elif score == 4:
        strength_info["strength_level"] = "strong"
    else:  # score == 5
        strength_info["strength_level"] = "very_strong"
    
    return strength_info


def get_token_from_cookie(request, cookie_name: str) -> Optional[str]:
    """
    从HTTP请求的Cookie中提取令牌
    
    Args:
        request: FastAPI Request对象
        cookie_name: Cookie名称
        
    Returns:
        str: 令牌值，如果不存在则返回None
    """
    return request.cookies.get(cookie_name)