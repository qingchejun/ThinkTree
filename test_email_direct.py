#!/usr/bin/env python3
"""
直接测试邮件发送 - 用于诊断配置问题
"""
import asyncio
import os
import sys
import traceback
from pathlib import Path

# 添加项目路径
sys.path.append(str(Path(__file__).parent / "backend"))

async def test_email_config():
    """直接测试邮件配置"""
    print("🔍 开始直接测试邮件配置...")
    
    # 手动设置环境变量（用于测试）
    test_configs = {
        "MAIL_SERVER": "smtp.gmail.com", 
        "MAIL_PORT": "587",
        "MAIL_USERNAME": "thinktree.appgmail.com",  # 请替换为实际值
        "MAIL_PASSWORD": "",  # 请替换为实际应用密码
        "MAIL_FROM": "thinktree.appgmail.com",
        "MAIL_STARTTLS": "true",
        "MAIL_SSL_TLS": "false"
    }
    
    # 显示当前环境变量
    print("\n📧 当前环境变量:")
    for key in ["MAIL_SERVER", "MAIL_PORT", "MAIL_USERNAME", "MAIL_PASSWORD", 
                "MAIL_FROM", "MAIL_STARTTLS", "MAIL_SSL_TLS"]:
        value = os.getenv(key, "NOT_SET")
        if key == "MAIL_PASSWORD":
            display_value = f"***设置*** (长度: {len(value)})" if value != "NOT_SET" else "NOT_SET"
        else:
            display_value = value
        print(f"  {key}: {display_value}")
    
    # 测试基本SMTP连接
    print("\n🔗 测试SMTP连接...")
    try:
        import aiosmtplib
        print(f"✅ aiosmtplib版本: {aiosmtplib.__version__}")
        
        mail_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
        mail_port = int(os.getenv("MAIL_PORT", "587"))
        mail_username = os.getenv("MAIL_USERNAME", "")
        mail_password = os.getenv("MAIL_PASSWORD", "")
        
        if not mail_username or not mail_password:
            print("❌ MAIL_USERNAME 或 MAIL_PASSWORD 未设置")
            return False
        
        smtp = aiosmtplib.SMTP(hostname=mail_server, port=mail_port)
        
        print(f"🔍 连接到 {mail_server}:{mail_port}...")
        await smtp.connect()
        print("✅ SMTP连接成功")
        
        print("🔍 启动TLS...")
        await smtp.starttls()
        print("✅ TLS启动成功")
        
        print("🔍 尝试登录...")
        await smtp.login(mail_username, mail_password)
        print("✅ SMTP登录成功")
        
        await smtp.quit()
        print("✅ SMTP连接测试完成")
        
    except Exception as smtp_error:
        print(f"❌ SMTP连接失败: {str(smtp_error)}")
        print(f"详细错误: {traceback.format_exc()}")
        return False
    
    # 测试FastMail
    print("\n📬 测试FastMail...")
    try:
        from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
        
        conf = ConnectionConfig(
            MAIL_USERNAME=mail_username,
            MAIL_PASSWORD=mail_password,
            MAIL_FROM=os.getenv("MAIL_FROM", "noreply@thinktree.com"),
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
            subject="ThinkSo 邮件配置测试",
            recipients=["gingcheun@gmail.com"],
            body="这是一封测试邮件，用于验证ThinkSo邮件服务配置。如果您收到此邮件，说明配置正确。",
            subtype=MessageType.plain
        )
        
        print("🚀 发送测试邮件...")
        await fm.send_message(message)
        print("✅ FastMail发送成功!")
        return True
        
    except Exception as mail_error:
        print(f"❌ FastMail发送失败: {str(mail_error)}")
        print(f"详细错误: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("ThinkSo 邮件服务诊断工具")
    print("=" * 60)
    
    result = asyncio.run(test_email_config())
    
    print("\n" + "=" * 60)
    if result:
        print("✅ 邮件配置测试成功!")
    else:
        print("❌ 邮件配置测试失败!")
    print("=" * 60)