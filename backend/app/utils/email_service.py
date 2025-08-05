"""
邮件服务模块 - 仅使用Resend API
移除了所有Gmail SMTP相关代码，专注于Resend邮件发送
"""

import secrets
import random
import os
from typing import List, Optional
from pydantic import EmailStr
import jwt
from datetime import datetime, timedelta
import resend
from app.core.config import settings

class EmailService:
    """邮件服务类 - 仅使用Resend API"""
    
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
            # 设置Resend API密钥
            resend.api_key = self.resend_api_key
    
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
            email = payload.get("email")
            token_type = payload.get("type")
            
            if token_type != "email_verification":
                return None
                
            return email
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None
    
    async def send_welcome_email_resend(self, email: EmailStr, user_name: Optional[str] = None) -> bool:
        """使用Resend发送欢迎邮件"""
        if not self.resend_api_key:
            print("⚠️ RESEND_API_KEY未配置，无法发送欢迎邮件")
            return False
            
        try:
            # 邮件内容
            display_name = user_name if user_name else "ThinkSo用户"
            
            html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>欢迎来到 ThinkSo</title>
<style>
body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
.container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
.header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
.content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }}
.button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
.footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
.logo {{ font-size: 24px; font-weight: bold; }}
</style>
</head>
<body>
<div class="container">
<div class="header">
<div class="logo">🧠 ThinkSo</div>
<h2>欢迎来到 ThinkSo！</h2>
</div>
<div class="content">
<p>尊敬的 <strong>{display_name}</strong>，</p>

<p>🎉 恭喜您成功加入 ThinkSo！您的思维导图创作之旅即将开始。</p>

<div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h3 style="color: #2d6a2d; margin-top: 0;">🎁 新用户专属礼包</h3>
<p><strong>✨ 免费积分:</strong> 已为您充值 <span style="color: #d63384; font-weight: bold;">100 积分</span></p>
<p><strong>🚀 AI 思维导图生成:</strong> 支持文档、文本、链接转换</p>
<p><strong>📊 多种导出格式:</strong> PNG、SVG、PDF 随心选择</p>
</div>

<div style="text-align: center;">
<a href="{settings.frontend_url}/create" class="button">🚀 立即开始创作</a>
</div>

<div class="footer">
<p>💡 <strong>使用小贴士:</strong><br>
上传您的文档或输入想法，AI 将为您生成精美的思维导图</p>
<p style="font-size: 12px;">此邮件由 ThinkSo 自动发送，请勿回复。</p>
</div>
</div>
</div>
</body>
</html>"""
            
            # 构建邮件参数
            params = {
                "from": f"{self.mail_from_name} <{self.mail_from}>",
                "to": [email],
                "subject": "🎉 欢迎来到 ThinkSo - 开启您的思维导图之旅！",
                "html": html_content,
            }
            
            # 使用 Resend 发送邮件
            response = resend.Emails.send(params)
            
            print(f"✅ Resend 欢迎邮件发送成功到 {email}，Message ID: {response.get('id', 'N/A')}")
            return True
            
        except Exception as e:
            print(f"❌ Resend 欢迎邮件发送失败到 {email}: {str(e)}")
            return False

    async def send_magic_link_email(self, user_email: EmailStr, user_name: str, login_code: str, magic_link_url: str) -> bool:
        """使用Resend发送魔法链接登录邮件"""
        if not self.resend_api_key:
            print("⚠️ RESEND_API_KEY未配置，无法发送登录邮件")
            return False
            
        try:
            html_content = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ThinkSo Login</title>
<style>
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #ffffff; }}
.container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
.greeting {{ font-size: 16px; color: #333; margin-bottom: 20px; }}
.message {{ font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 30px; }}
.button {{ display: inline-block; background: #007AFF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; }}
.signature {{ font-size: 14px; color: #666; margin-top: 30px; }}
</style>
</head>
<body>
<div class="container">
<div class="greeting">Hi {user_name},</div>

<div class="message">
{login_code} is your login code. You can also click below to login to your account:
</div>

<div>
<a href="{magic_link_url}" class="button">Login to Thinkso</a>
</div>

<div class="signature">- Thinkso.io</div>
</div>
</body>
</html>'''
            
            # 构建邮件参数
            params = {
                "from": f"ThinkSo Login <{self.mail_from}>",
                "to": [user_email],
                "subject": f"👏{login_code} is your login code.",
                "html": html_content,
            }
            
            # 使用 Resend 发送邮件
            response = resend.Emails.send(params)
            
            print(f"✅ Resend 魔法链接邮件发送成功到 {user_email}，Message ID: {response.get('id', 'N/A')}")
            return True
            
        except Exception as e:
            print(f"❌ Resend 魔法链接邮件发送失败到 {user_email}: {str(e)}")
            return False

# 创建全局邮件服务实例
email_service = EmailService()

# 提供获取邮件服务的函数
def get_email_service() -> EmailService:
    """获取邮件服务实例"""
    return email_service