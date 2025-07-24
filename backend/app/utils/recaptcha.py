"""
Google reCAPTCHA v3 验证工具
"""

import httpx
from typing import Optional, Tuple
from ..core.config import settings


async def verify_recaptcha_token(recaptcha_token: str) -> Tuple[bool, str, Optional[float]]:
    """
    验证 Google reCAPTCHA v3 令牌
    
    Args:
        recaptcha_token: 前端获取的reCAPTCHA令牌
        
    Returns:
        tuple: (是否验证成功, 错误信息, 分数)
    """
    # 检查是否配置了reCAPTCHA密钥
    if not settings.recaptcha_secret_key:
        # 开发环境或未配置reCAPTCHA时，可以跳过验证
        return True, "", 1.0
    
    if not recaptcha_token:
        return False, "缺少reCAPTCHA令牌", None
    
    try:
        # 向Google reCAPTCHA API发送验证请求
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.recaptcha_secret_key,
                    "response": recaptcha_token
                },
                timeout=10.0  # 10秒超时
            )
            
            if response.status_code != 200:
                return False, f"reCAPTCHA验证服务响应错误: {response.status_code}", None
            
            result = response.json()
            
            # 检查验证结果
            if not result.get("success", False):
                error_codes = result.get("error-codes", [])
                error_msg = f"reCAPTCHA验证失败: {', '.join(error_codes)}"
                return False, error_msg, None
            
            # 获取分数 (reCAPTCHA v3特有)
            score = result.get("score", 0.0)
            
            # 检查分数是否达到阈值
            if score < settings.recaptcha_score_threshold:
                return False, f"人机验证分数过低: {score:.2f}, 要求: {settings.recaptcha_score_threshold}", score
            
            return True, "", score
            
    except httpx.TimeoutException:
        return False, "reCAPTCHA验证服务超时", None
    except httpx.RequestError as e:
        return False, f"reCAPTCHA验证网络错误: {str(e)}", None
    except Exception as e:
        return False, f"reCAPTCHA验证内部错误: {str(e)}", None


def is_recaptcha_enabled() -> bool:
    """
    检查是否启用了reCAPTCHA验证
    
    Returns:
        bool: 是否启用
    """
    return bool(settings.recaptcha_secret_key)


async def verify_recaptcha_with_action(recaptcha_token: str, expected_action: str) -> Tuple[bool, str, Optional[float]]:
    """
    验证 reCAPTCHA 令牌并检查动作
    
    Args:
        recaptcha_token: reCAPTCHA令牌
        expected_action: 期望的动作名称 (如 'register', 'login')
        
    Returns:
        tuple: (是否验证成功, 错误信息, 分数)
    """
    # 检查是否配置了reCAPTCHA密钥
    if not settings.recaptcha_secret_key:
        return True, "", 1.0
    
    if not recaptcha_token:
        return False, "缺少reCAPTCHA令牌", None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.recaptcha_secret_key,
                    "response": recaptcha_token
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                return False, f"reCAPTCHA验证服务响应错误: {response.status_code}", None
            
            result = response.json()
            
            # 检查验证结果
            if not result.get("success", False):
                error_codes = result.get("error-codes", [])
                error_msg = f"reCAPTCHA验证失败: {', '.join(error_codes)}"
                return False, error_msg, None
            
            # 检查动作是否匹配
            action = result.get("action", "")
            if action != expected_action:
                return False, f"reCAPTCHA动作不匹配: 期望 '{expected_action}', 实际 '{action}'", None
            
            # 获取分数
            score = result.get("score", 0.0)
            
            # 检查分数阈值
            if score < settings.recaptcha_score_threshold:
                return False, f"人机验证分数过低: {score:.2f}, 要求: {settings.recaptcha_score_threshold}", score
            
            return True, "", score
            
    except httpx.TimeoutException:
        return False, "reCAPTCHA验证服务超时", None
    except httpx.RequestError as e:
        return False, f"reCAPTCHA验证网络错误: {str(e)}", None
    except Exception as e:
        return False, f"reCAPTCHA验证内部错误: {str(e)}", None