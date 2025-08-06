"""
邮件服务模块
"""

import secrets
import os
from typing import Optional
from pydantic import EmailStr
import jwt
from datetime import datetime, timedelta
import resend

from ..core.config import settings


class EmailService:
    """邮件服务类"""
    
    def __init__(self):
        """初始化邮件配置 - 仅使用Resend服务"""
        # Resend API配置
        self.resend_api_key = settings.resend_api_key
        self.mail_from = settings.mail_from
        self.mail_from_name = settings.mail_from_name
        
        # 检查Resend配置
        if not self.resend_api_key:
            print("⚠️ 警告: RESEND_API_KEY未配置，邮件功能将不可用")
        else:
            print(f"✅ Resend邮件服务已配置: {self.mail_from}")
            
        # 注意：已移除FastMail SMTP配置，仅使用Resend API
    
    def generate_verification_token(self, email: str, expires_hours: int = 24) -> str:
        """生成邮箱验证令牌"""
        expire = datetime.utcnow() + timedelta(hours=expires_hours)
        token_data = {
            "email": email,
            "exp": expire,
            "type": "email_verification",
            "jti": secrets.token_urlsafe(32)  # 唯一标识符
        }
        return jwt.encode(token_data, settings.secret_key, algorithm=settings.algorithm)
    
    def verify_verification_token(self, token: str) -> Optional[str]:
        """验证邮箱验证令牌"""
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            email: str = payload.get("email")
            token_type: str = payload.get("type")
            
            if email is None or token_type != "email_verification":
                return None
            
            return email
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None
    
    
    
    async def send_welcome_email_resend(self, email: EmailStr, user_name: Optional[str] = None) -> bool:
        """
        使用 Resend 发送欢迎邮件
        """
        try:
            # 检查是否配置了 Resend API 密钥
            resend_api_key = os.getenv('RESEND_API_KEY')
            if not resend_api_key:
                print("⚠️ RESEND_API_KEY 环境变量未配置，跳过 Resend 欢迎邮件发送")
                return False
            
            # 初始化 Resend 客户端
            resend.api_key = resend_api_key
            
            # 设置显示名称
            display_name = user_name if user_name else email.split('@')[0]
            
            # HTML 邮件内容
            html_content = f"""
            <h1>欢迎加入 ThinkSo！</h1>
            <p>尊敬的 <strong>{display_name}</strong>，</p>
            <p>我们很高兴能与您一起开启高效的思维整理之旅。</p>
            <p>ThinkSo 是一款AI驱动的思维导图生成工具，能够帮助您：</p>
            <ul>
                <li>📄 智能解析文档内容</li>
                <li>🗺️ 自动生成思维导图</li>
                <li>💾 云端保存您的创作</li>
                <li>🔗 轻松分享给团队</li>
                <li>📥 多格式导出</li>
            </ul>
            <p>现在就开始体验 ThinkSo 的强大功能吧！</p>
            <p>祝您使用愉快！</p>
            <p>The ThinkSo Team</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
                此邮件由 ThinkSo 系统自动发送，请勿回复。<br>
                © 2025 ThinkSo Team. All rights reserved.
            </p>
            """
            
            # 发送邮件
            params = {
                "from": "ThinkSo Team <hello@thinkso.io>",
                "to": [email],
                "subject": "欢迎来到 ThinkSo！",
                "html": html_content
            }
            
            # 使用 Resend 发送邮件
            response = resend.Emails.send(params)
            
            print(f"✅ Resend 欢迎邮件发送成功到 {email}，Message ID: {response.get('id', 'N/A')}")
            return True
            
        except Exception as e:
            print(f"❌ Resend 欢迎邮件发送失败: {str(e)}")
            return False
    
    async def send_magic_link_email(self, user_email: EmailStr, user_name: str, login_code: str, magic_link_url: str) -> bool:
        """
        使用 Resend 发送魔法链接登录邮件
        """
        try:
            # 获取 Resend API 密钥
            resend_api_key = os.getenv('RESEND_API_KEY')
            if not resend_api_key:
                print("❌ RESEND_API_KEY 环境变量未配置")
                return False
            
            # 初始化 Resend 客户端
            resend.api_key = resend_api_key
            
            # HTML 邮件内容
            html_content = f"""
            <div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333;">
              <p>Hi {user_name},</p>
              <p>{login_code} is your login code. You can also click below to login to your account：</p>
              <p>
                <a href="{magic_link_url}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
                  Login to Thinkso
                </a>
              </p>
              <p>- Thinkso.io</p>
            </div>
            """
            
            # 发送邮件
            params = {
                "from": "ThinkSo Login <noreply@thinkso.io>",
                "to": [user_email],
                "subject": f"👏 {login_code} is your login code.",
                "html": html_content
            }
            
            # 使用 Resend 发送邮件
            response = resend.Emails.send(params)
            
            print(f"✅ Resend 魔法链接邮件发送成功到 {user_email}，Message ID: {response.get('id', 'N/A')}")
            return True
            
        except Exception as e:
            print(f"❌ Resend 魔法链接邮件发送失败: {str(e)}")
            return False
    


# 全局邮件服务实例
email_service = EmailService()


def get_email_service() -> EmailService:
    """获取邮件服务实例"""
    return email_service