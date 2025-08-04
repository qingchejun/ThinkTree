"""
邮件服务模块
"""

import secrets
import random
import os
from typing import List, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
import jwt
from datetime import datetime, timedelta
import resend

from ..core.config import settings


class EmailService:
    """邮件服务类"""
    
    def __init__(self):
        """初始化邮件配置"""
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.mail_username,
            MAIL_PASSWORD=settings.mail_password,
            MAIL_FROM=settings.mail_from,
            MAIL_FROM_NAME=settings.mail_from_name,
            MAIL_PORT=settings.mail_port,
            MAIL_SERVER=settings.mail_server,
            MAIL_STARTTLS=settings.mail_tls,
            MAIL_SSL_TLS=settings.mail_ssl,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
            # 暂不使用模板文件，直接在代码中构建HTML
        )
        self.fm = FastMail(self.conf)
    
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
    
    async def send_verification_email(self, email: EmailStr, user_name: Optional[str] = None) -> bool:
        """发送邮箱验证邮件"""
        try:
            # 生成验证令牌
            verification_token = self.generate_verification_token(email)
            
            # 生成验证链接
            verification_url = f"{settings.frontend_url}/verify-email?token={verification_token}"
            
            # 生成6位纯数字验证码用于邮件标题
            verification_code = str(random.randint(100000, 999999))
            
            # 邮件内容 - 统一称呼为"ThinkSo用户"
            display_name = "ThinkSo用户"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>验证您的 ThinkSo 账户</title>
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
                        <h2>欢迎加入 ThinkSo！</h2>
                    </div>
                    <div class="content">
                        <p>尊敬的 <strong>{display_name}</strong>，</p>
                        
                        <p>感谢您注册 ThinkSo AI 驱动的思维导图生成工具！为了确保您的账户安全，请点击下面的按钮验证您的邮箱地址：</p>
                        
                        <div style="text-align: center;">
                            <a href="{verification_url}" class="button">🔐 验证邮箱地址</a>
                        </div>
                        
                        <p>如果上面的按钮无法点击，请复制以下链接到浏览器地址栏：</p>
                        <p style="background: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all;">
                            <code>{verification_url}</code>
                        </p>
                        
                        <p><strong>注意事项：</strong></p>
                        <ul>
                            <li>此验证链接有效期为 24 小时</li>
                            <li>验证成功后即可正常使用所有功能</li>
                            <li>如果您没有注册 ThinkSo 账户，请忽略此邮件</li>
                        </ul>
                        
                        <p>验证完成后，您将能够：</p>
                        <ul>
                            <li>📄 上传文档并生成AI思维导图</li>
                            <li>💾 保存和管理您的思维导图</li>
                            <li>🔗 分享思维导图给他人</li>
                            <li>📥 导出为 SVG/PNG 格式</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>此邮件由 ThinkSo 系统自动发送，请勿回复。</p>
                        <p>如有问题，请联系客服支持。</p>
                        <p>© 2024 ThinkSo Team. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # 纯文本版本
            text_body = f"""
            欢迎加入 ThinkSo！
            
            尊敬的 {display_name}，
            
            感谢您注册 ThinkSo AI 驱动的思维导图生成工具！
            
            请点击以下链接验证您的邮箱地址：
            {verification_url}
            
            注意：此验证链接有效期为 24 小时。
            
            如果您没有注册 ThinkSo 账户，请忽略此邮件。
            
            ThinkSo Team
            """
            
            # 创建邮件消息
            message = MessageSchema(
                subject=f"ThinkSo注册验证码：{verification_code}",
                recipients=[email],
                body=text_body,
                html=html_body,
                subtype=MessageType.html
            )
            
            # 发送邮件
            await self.fm.send_message(message)
            return True
            
        except Exception as e:
            print(f"发送验证邮件失败: {str(e)}")
            return False
    
    async def send_welcome_email(self, email: EmailStr, user_name: Optional[str] = None) -> bool:
        """发送欢迎邮件 (验证完成后)"""
        try:
            display_name = "ThinkSo用户"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>欢迎来到 ThinkSo</title>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
                    .feature {{ background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                    .logo {{ font-size: 24px; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🧠 ThinkSo</div>
                        <h2>账户验证成功！</h2>
                    </div>
                    <div class="content">
                        <p>恭喜 <strong>{display_name}</strong>！</p>
                        
                        <p>您的 ThinkSo 账户已成功验证，现在可以开始使用所有功能了！</p>
                        
                        <div style="text-align: center;">
                            <a href="{settings.frontend_url}" class="button">🚀 开始使用 ThinkSo</a>
                        </div>
                        
                        <h3>🎯 您现在可以使用的功能：</h3>
                        
                        <div class="feature">
                            <strong>📄 智能文档解析</strong><br>
                            上传 PDF、Word、文本等格式文档，AI 自动提取关键信息
                        </div>
                        
                        <div class="feature">
                            <strong>🗺️ 专业思维导图</strong><br>
                            基于 Markmap 技术生成高质量、交互式思维导图
                        </div>
                        
                        <div class="feature">
                            <strong>💾 云端存储</strong><br>
                            思维导图自动保存到云端，随时随地访问您的创作
                        </div>
                        
                        <div class="feature">
                            <strong>🔗 轻松分享</strong><br>
                            一键生成分享链接，与团队成员协作讨论
                        </div>
                        
                        <div class="feature">
                            <strong>📥 多格式导出</strong><br>
                            支持 SVG、PNG 高清格式导出，满足不同使用场景
                        </div>
                        
                        <p><strong>💡 小贴士：</strong></p>
                        <ul>
                            <li>首次使用建议先上传一个小文档熟悉流程</li>
                            <li>思维导图支持展开/折叠功能，便于查看不同层次信息</li>
                            <li>记得定期保存重要的思维导图到个人账户</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>感谢您选择 ThinkSo，期待您的精彩创作！</p>
                        <p>© 2024 ThinkSo Team. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_body = f"""
            恭喜 {display_name}！
            
            您的 ThinkSo 账户已成功验证，现在可以开始使用所有功能了！
            
            访问 ThinkTree: {settings.frontend_url}
            
            可用功能：
            - 智能文档解析
            - 专业思维导图生成
            - 云端存储
            - 轻松分享
            - 多格式导出
            
            感谢您选择 ThinkSo！
            
            ThinkSo Team
            """
            
            message = MessageSchema(
                subject="🎉 欢迎来到 ThinkSo - 开始您的思维导图之旅",
                recipients=[email],
                body=text_body,
                html=html_body,
                subtype=MessageType.html
            )
            
            await self.fm.send_message(message)
            return True
            
        except Exception as e:
            print(f"发送欢迎邮件失败: {str(e)}")
            return False
    
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
    
    async def send_password_reset_email(self, email: EmailStr, user_name: str, reset_link: str) -> bool:
        """发送密码重置邮件"""
        try:
            display_name = user_name if user_name else email.split('@')[0]
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>重置您的 ThinkSo 密码</title>
                <style>
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f5f5f5;
                        margin: 0;
                        padding: 20px;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }}
                    .content {{
                        padding: 30px;
                    }}
                    .button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-decoration: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-weight: 600;
                        margin: 20px 0;
                        transition: transform 0.2s;
                    }}
                    .button:hover {{
                        transform: translateY(-2px);
                    }}
                    .warning-box {{
                        background-color: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 8px;
                        padding: 15px;
                        margin: 20px 0;
                        color: #856404;
                    }}
                    .footer {{
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }}
                    .logo {{
                        font-size: 24px;
                        margin-bottom: 10px;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🧠 ThinkSo</div>
                        <h1>密码重置请求</h1>
                    </div>
                    <div class="content">
                        <p>您好 <strong>{display_name}</strong>，</p>
                        
                        <p>我们收到了您重置 ThinkSo 账户密码的请求。如果这是您本人的操作，请点击下方按钮重置密码：</p>
                        
                        <div style="text-align: center;">
                            <a href="{reset_link}" class="button">🔑 重置密码</a>
                        </div>
                        
                        <div class="warning-box">
                            <strong>⚠️ 重要提醒：</strong>
                            <ul>
                                <li>此链接仅在 <strong>15 分钟</strong> 内有效</li>
                                <li>出于安全考虑，链接只能使用一次</li>
                                <li>如果链接过期，请重新申请密码重置</li>
                            </ul>
                        </div>
                        
                        <p><strong>🛡️ 安全提示：</strong></p>
                        <ul>
                            <li>如果您没有申请密码重置，请忽略此邮件</li>
                            <li>请勿将此链接分享给他人</li>
                            <li>设置强密码以保护您的账户安全</li>
                            <li>如有疑问，请联系我们的客服团队</li>
                        </ul>
                        
                        <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
                        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                            {reset_link}
                        </p>
                    </div>
                    <div class="footer">
                        <p>此邮件由系统自动发送，请勿回复</p>
                        <p>© 2024 ThinkSo Team. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_body = f"""
            您好 {display_name}，
            
            我们收到了您重置 ThinkSo 账户密码的请求。
            
            请点击以下链接重置密码（15分钟内有效）：
            {reset_link}
            
            重要提醒：
            - 此链接仅在 15 分钟内有效
            - 出于安全考虑，链接只能使用一次
            - 如果您没有申请密码重置，请忽略此邮件
            
            如有疑问，请联系我们的客服团队。
            
            ThinkSo Team
            """
            
            # 创建邮件消息
            message = MessageSchema(
                subject="🔑 ThinkSo 密码重置 - 请在15分钟内完成",
                recipients=[email],
                body=text_body,
                html=html_body,
                subtype=MessageType.html
            )
            
            # 发送邮件
            await self.fm.send_message(message)
            return True
            
        except Exception as e:
            print(f"发送密码重置邮件失败: {str(e)}")
            return False


# 全局邮件服务实例
email_service = EmailService()


def get_email_service() -> EmailService:
    """获取邮件服务实例"""
    return email_service