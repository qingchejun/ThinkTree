#!/usr/bin/env python3
"""
为生产环境创建兑换码
使用生产数据库URL
"""

import sys
import os
import secrets
import string
from datetime import datetime, timezone, timedelta

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def generate_simple_code() -> str:
    """生成一个简单的8位兑换码"""
    # 使用大写字母和数字，避免容易混淆的字符
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  # 移除容易混淆的字符
    
    # 生成8位兑换码
    return ''.join(secrets.choice(chars) for _ in range(8))

def create_production_redemption_code():
    """为生产数据库创建兑换码"""
    print("=== 创建生产环境兑换码 ===")
    
    # 检查是否有生产数据库URL
    production_db_url = os.getenv("DATABASE_URL")
    if not production_db_url:
        print("❌ 未找到生产数据库URL环境变量")
        print("请设置 DATABASE_URL 环境变量或直接在Render控制台执行此脚本")
        return None
    
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # 修复PostgreSQL URL格式
        if production_db_url.startswith("postgres://"):
            production_db_url = production_db_url.replace("postgres://", "postgresql://", 1)
        
        # 连接生产数据库
        engine = create_engine(production_db_url, echo=False)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # 导入模型 - 需要在数据库连接后导入
        from app.models.redemption_code import RedemptionCode, RedemptionCodeStatus
        
        db = SessionLocal()
        
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
        
        print(f"✅ 生产环境兑换码创建成功！")
        print(f"")
        print(f"🎫 兑换码: {code}")
        print(f"💰 积分数量: 1000")
        print(f"📅 过期时间: {expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"🔄 状态: ACTIVE")
        print(f"🌐 数据库: 生产环境 (PostgreSQL)")
        print(f"")
        print(f"📋 使用说明:")
        print(f"1. 访问 https://thinkso.io/settings?tab=billing")
        print(f"2. 在兑换码输入框中输入: {code}")
        print(f"3. 点击「立即兑换」按钮")
        print(f"4. 成功后将获得 1000 积分")
        
        db.close()
        return code
        
    except Exception as e:
        print(f"❌ 创建生产兑换码失败: {e}")
        import traceback
        traceback.print_exc()
        return None

def create_with_manual_sql():
    """提供手动SQL命令，可以在Render控制台执行"""
    code = generate_simple_code()
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    print("=== 手动SQL命令 ===")
    print("如果Python脚本无法运行，可以在Render的PostgreSQL控制台执行以下SQL：")
    print("")
    print(f"INSERT INTO redemption_codes (code, credits_amount, status, expires_at, created_at)")
    print(f"VALUES ('{code}', 1000, 'ACTIVE', '{expires_at.isoformat()}', '{datetime.now(timezone.utc).isoformat()}');")
    print("")
    print(f"生成的兑换码: {code}")
    return code

if __name__ == "__main__":
    # 尝试自动创建
    result = create_production_redemption_code()
    
    if not result:
        print("\n" + "="*50)
        # 如果自动创建失败，提供手动方案
        create_with_manual_sql()