"""
OAuth 配置模块 - Google OAuth 2.0 集成

使用 authlib 库处理 Google OAuth 认证流程
"""

import os
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from .config import settings

# 从环境变量加载配置
try:
    config = Config('.env')  # 本地开发时可以读取.env文件
except Exception:
    # 生产环境可能没有.env文件，直接使用环境变量
    config = Config()

# 初始化 OAuth 实例
oauth = OAuth(config)

def register_google_oauth():
    """
    注册 Google OAuth 提供者
    """
    # 检查必需的环境变量
    if not settings.google_client_id or not settings.google_client_secret:
        raise ValueError(
            "Google OAuth 配置不完整: 缺少 GOOGLE_CLIENT_ID 或 GOOGLE_CLIENT_SECRET 环境变量"
        )
    
    # 注册 Google OAuth 提供者
    oauth.register(
        name='google',
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

# 延迟注册，允许在运行时检查配置
_google_client = None

def get_google_oauth_client():
    """
    获取 Google OAuth 客户端实例
    
    Returns:
        google oauth client: authlib 客户端实例
    """
    global _google_client
    
    if _google_client is None:
        # 首次调用时注册 Google OAuth
        register_google_oauth()
        _google_client = oauth.google
    
    return _google_client