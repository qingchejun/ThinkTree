#!/usr/bin/env python3
"""
创建测试兑换码脚本
生成一个1000积分的测试兑换码，有效期1个月
"""

import sys
import os
import secrets
import string
from datetime import datetime, timezone, timedelta

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.redemption_code import RedemptionCode, RedemptionCodeStatus

def generate_redemption_code() -> str:
    """生成一个随机的兑换码"""
    # 使用大写字母和数字，避免容易混淆的字符
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('0', '').replace('O', '').replace('1', '').replace('I', '')  # 移除容易混淆的字符
    
    # 生成12位兑换码，格式：XXXX-XXXX-XXXX
    code_parts = []
    for _ in range(3):
        part = ''.join(secrets.choice(chars) for _ in range(4))
        code_parts.append(part)
    
    return '-'.join(code_parts)

def create_test_redemption_code():
    """创建测试兑换码"""
    print("=== 创建测试兑换码 ===")
    
    # 创建数据库连接
    engine = create_engine(settings.database_url, echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # 生成唯一的兑换码
        while True:
            code = generate_redemption_code()
            
            # 检查是否已存在
            existing = db.query(RedemptionCode).filter(RedemptionCode.code == code).first()
            if not existing:
                break
            print(f"兑换码 {code} 已存在，重新生成...")
        
        # 设置过期时间为1个月后
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        
        # 创建兑换码记录
        redemption_code = RedemptionCode(
            code=code,
            credits_amount=1000,
            status=RedemptionCodeStatus.ACTIVE,
            expires_at=expires_at
        )
        
        db.add(redemption_code)
        db.commit()
        
        print(f"✅ 测试兑换码创建成功！")
        print(f"")
        print(f"🎫 兑换码: {code}")
        print(f"💰 积分数量: 1000")
        print(f"📅 过期时间: {expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"🔄 状态: ACTIVE")
        print(f"")
        print(f"📋 使用说明:")
        print(f"1. 登录到 ThinkSo 应用")
        print(f"2. 进入设置页面 -> 用量与计费")
        print(f"3. 在兑换码输入框中输入: {code}")
        print(f"4. 点击「立即兑换」按钮")
        print(f"5. 成功后将获得 1000 积分")
        
        return code
        
    except Exception as e:
        db.rollback()
        print(f"❌ 创建兑换码失败: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_redemption_code()