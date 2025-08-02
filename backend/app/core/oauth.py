"""
OAuth 配置模块 - Google OAuth 2.0 集成

使用简化的方式处理 Google OAuth 认证流程
"""

import secrets
import urllib.parse
from typing import Dict, Any
import httpx
from .config import settings

class GoogleOAuthClient:
    """Google OAuth 客户端"""
    
    def __init__(self):
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self._discovery_cache = None
    
    async def get_discovery_document(self) -> Dict[str, Any]:
        """获取 Google OAuth 发现文档"""
        if self._discovery_cache is None:
            # 硬编码已知的Google OAuth端点，避免网络问题
            self._discovery_cache = {
                "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_endpoint": "https://oauth2.googleapis.com/token",
                "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
                "issuer": "https://accounts.google.com",
                "jwks_uri": "https://www.googleapis.com/oauth2/v3/certs"
            }
        return self._discovery_cache
    
    async def get_authorization_url(self, redirect_uri: str, state: str = None) -> str:
        """获取 Google OAuth 授权 URL"""
        discovery = await self.get_discovery_document()
        
        if state is None:
            state = secrets.token_urlsafe(32)
        
        params = {
            'client_id': self.client_id,
            'redirect_uri': redirect_uri,
            'scope': 'openid email profile',
            'response_type': 'code',
            'state': state,
            'access_type': 'offline'
        }
        
        auth_url = discovery['authorization_endpoint']
        return f"{auth_url}?{urllib.parse.urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """用授权码换取访问令牌"""
        discovery = await self.get_discovery_document()
        
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                discovery['token_endpoint'],
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """获取用户信息"""
        discovery = await self.get_discovery_document()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                discovery['userinfo_endpoint'],
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response.raise_for_status()
            return response.json()

def get_google_oauth_client() -> GoogleOAuthClient:
    """
    获取 Google OAuth 客户端实例
    
    Returns:
        GoogleOAuthClient: OAuth 客户端实例
    """
    # 检查必需的环境变量
    if not settings.google_client_id or not settings.google_client_secret:
        raise ValueError(
            "Google OAuth 配置不完整: 缺少 GOOGLE_CLIENT_ID 或 GOOGLE_CLIENT_SECRET 环境变量"
        )
    
    return GoogleOAuthClient()