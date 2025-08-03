#!/usr/bin/env python3
"""
创建全新的测试兑换码
确保代码格式正确且未被使用
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

def generate_simple_code() -> str:
    """生成一个简单的8位兑换码"""
    # 使用大写字母和数字，避免容易混淆的字符
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  # 移除容易混淆的字符
    
    # 生成8位兑换码
    return ''.join(secrets.choice(chars) for _ in range(8))

def create_fresh_redemption_code():
    """创建全新的测试兑换码"""
    print("=== 创建全新的测试兑换码 ===")
    
    # 创建数据库连接
    engine = create_engine(settings.database_url, echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # 先清理已有的测试兑换码（防止冲突）
        old_codes = db.query(RedemptionCode).filter(
            RedemptionCode.code.in_(['5Y2L-BMLK-2F6W', 'VRVT-9QJY-Y8ST', 'TEST2024CREDITS'])
        ).all()
        
        if old_codes:
            print(f"清理 {len(old_codes)} 个旧的测试兑换码...")
            for old_code in old_codes:
                db.delete(old_code)
        
        # 生成唯一的兑换码
        attempts = 0
        while attempts < 10:
            code = generate_simple_code()
            existing = db.query(RedemptionCode).filter(RedemptionCode.code == code).first()
            if not existing:
                break
            attempts += 1
            print(f"兑换码 {code} 已存在，重新生成...")
        
        if attempts >= 10:
            print("❌ 无法生成唯一兑换码")
            return None
        
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
        
        # 验证创建结果
        verification = db.query(RedemptionCode).filter(RedemptionCode.code == code).first()
        if not verification:
            print("❌ 兑换码创建验证失败")
            return None
        
        print(f"✅ 全新测试兑换码创建成功！")
        print(f"")
        print(f"🎫 兑换码: {code}")
        print(f"💰 积分数量: 1000")
        print(f"📅 过期时间: {expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"🔄 状态: ACTIVE")
        print(f"🔍 数据库验证: 通过")
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
    create_fresh_redemption_code()