"""
OAuth 配置模块 - Google OAuth 2.0 集成

使用 authlib 库处理 Google OAuth 认证流程
"""

import os
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config

# 从环境变量加载配置
config = Config('.env')  # 本地开发时可以读取.env文件

# 初始化 OAuth 实例
oauth = OAuth(config)

# 注册 Google OAuth 提供者
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

def get_google_oauth_client():
    """
    获取 Google OAuth 客户端实例
    
    Returns:
        google oauth client: authlib 客户端实例
    """
    return oauth.google