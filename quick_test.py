#!/usr/bin/env python3
"""
快速测试邮件发送问题
"""
import asyncio
import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

async def test_email():
    print("🔍 开始测试邮件配置...")
    
    # 检查环境变量
    mail_username = os.getenv("MAIL_USERNAME", "")
    mail_password = os.getenv("MAIL_PASSWORD", "")
    mail_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    mail_port = int(os.getenv("MAIL_PORT", "587"))
    mail_from = os.getenv("MAIL_FROM", "noreply@thinktree.com")
    
    print(f"📧 MAIL_SERVER: {mail_server}")
    print(f"📧 MAIL_PORT: {mail_port}")
    print(f"📧 MAIL_FROM: {mail_from}")
    print(f"📧 MAIL_USERNAME: {mail_username}")
    print(f"📧 MAIL_PASSWORD: {'***设置***' if mail_password else 'NOT SET'}")
    
    if not mail_username or not mail_password:
        print("❌ 邮件用户名或密码未设置!")
        return False
    
    try:
        conf = ConnectionConfig(
            MAIL_USERNAME=mail_username,
            MAIL_PASSWORD=mail_password,
            MAIL_FROM=mail_from,
            MAIL_FROM_NAME="ThinkSo Test",
            MAIL_PORT=mail_port,
            MAIL_SERVER=mail_server,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        
        fm = FastMail(conf)
        
        message = MessageSchema(
            subject="ThinkSo 测试邮件",
            recipients=["gingcheun@gmail.com"],
            body="这是一封测试邮件，用于验证邮件服务配置。",
            subtype=MessageType.plain
        )
        
        print("🚀 正在发送测试邮件...")
        await fm.send_message(message)
        print("✅ 邮件发送成功!")
        return True
        
    except Exception as e:
        print(f"❌ 邮件发送失败: {str(e)}")
        import traceback
        print(f"详细错误: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    asyncio.run(test_email())