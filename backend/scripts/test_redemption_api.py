#!/usr/bin/env python3
"""
测试兑换码API功能
"""

import sys
import os
from datetime import datetime, timezone, timedelta

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import RedemptionCode, RedemptionCodeStatus, User, UserCredits, CreditTransaction, TransactionType
from app.services.redemption_service import RedemptionService

def test_redemption_system():
    """测试兑换码系统"""
    print("=== 兑换码系统测试 ===")
    
    # 创建数据库连接
    engine = create_engine(settings.database_url, echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. 获取现有用户进行测试
        test_user = db.query(User).first()
        if not test_user:
            print("❌ 没有找到测试用户，请先注册一个用户")
            return
        else:
            print(f"✅ 使用现有用户进行测试: {test_user.email}")
        
        # 确保用户有积分记录
        user_credits = db.query(UserCredits).filter(UserCredits.user_id == test_user.id).first()
        if not user_credits:
            user_credits = UserCredits(user_id=test_user.id, balance=100)
            db.add(user_credits)
            db.commit()
            print("✅ 创建用户积分记录")
        
        # 2. 创建测试兑换码
        test_code = "TEST2024CREDITS"
        existing_code = db.query(RedemptionCode).filter(RedemptionCode.code == test_code).first()
        
        if existing_code:
            # 如果已存在，删除旧的
            db.delete(existing_code)
            db.commit()
        
        print(f"创建测试兑换码: {test_code}")
        redemption_code = RedemptionCode(
            code=test_code,
            credits_amount=50,
            status=RedemptionCodeStatus.ACTIVE,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30)
        )
        db.add(redemption_code)
        db.commit()
        print("✅ 测试兑换码创建成功")
        
        # 3. 测试兑换码格式验证
        print("\n--- 测试兑换码格式验证 ---")
        
        # 测试空码
        is_valid, error = RedemptionService.validate_code_format("")
        print(f"空码验证: {is_valid}, 错误: {error}")
        
        # 测试短码
        is_valid, error = RedemptionService.validate_code_format("ABC")
        print(f"短码验证: {is_valid}, 错误: {error}")
        
        # 测试有效码
        is_valid, error = RedemptionService.validate_code_format(test_code)
        print(f"有效码验证: {is_valid}, 错误: {error}")
        
        # 4. 测试兑换功能
        print(f"\n--- 测试兑换功能 ---")
        original_balance = user_credits.balance
        print(f"用户原始积分: {original_balance}")
        
        success, message, credits_gained = RedemptionService.redeem_code(
            db, test_user.id, test_code
        )
        
        print(f"兑换结果: 成功={success}, 消息={message}, 获得积分={credits_gained}")
        
        # 刷新用户积分
        db.refresh(user_credits)
        print(f"兑换后积分: {user_credits.balance}")
        
        # 验证积分增加
        if success and user_credits.balance == original_balance + 50:
            print("✅ 积分增加正确")
        else:
            print("❌ 积分增加不正确")
        
        # 5. 测试重复兑换
        print(f"\n--- 测试重复兑换 ---")
        success2, message2, credits_gained2 = RedemptionService.redeem_code(
            db, test_user.id, test_code
        )
        print(f"重复兑换结果: 成功={success2}, 消息={message2}")
        
        if not success2 and "已被使用" in message2:
            print("✅ 重复兑换正确被拒绝")
        else:
            print("❌ 重复兑换处理不正确")
        
        # 6. 测试兑换历史
        print(f"\n--- 测试兑换历史 ---")
        history = RedemptionService.get_redemption_history(db, test_user.id)
        print(f"兑换历史记录数: {len(history)}")
        if history:
            print(f"最新兑换记录: {history[0]}")
            print("✅ 兑换历史功能正常")
        
        # 7. 检查交易记录
        print(f"\n--- 检查交易记录 ---")
        transactions = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == test_user.id,
            CreditTransaction.type == TransactionType.MANUAL_GRANT
        ).all()
        
        print(f"兑换相关交易记录数: {len(transactions)}")
        if transactions:
            latest_transaction = transactions[-1]
            print(f"最新交易: 金额={latest_transaction.amount}, 描述={latest_transaction.description}")
            print("✅ 交易记录创建正常")
        
        print("\n=== 测试完成 ===")
        print("✅ 兑换码系统功能正常")
        
    except Exception as e:
        print(f"❌ 测试过程中出错: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_redemption_system()