"""
一次性脚本：为现有用户补发积分
此脚本只运行一次，为所有没有积分记录的用户创建初始积分
"""

import os
import sys
from datetime import datetime
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
# 导入所有模型以确保关系正确识别
from app.models import User, UserCredits, CreditTransaction, TransactionType

def backfill_user_credits():
    """为现有用户补发积分的主函数"""
    
    # 创建数据库连接
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🚀 开始为现有用户补发积分...")
        print(f"⏰ 执行时间: {datetime.now().isoformat()}")
        
        # 查找所有没有积分记录的用户
        users_without_credits = db.query(User).filter(
            ~User.id.in_(
                db.query(UserCredits.user_id)
            )
        ).all()
        
        print(f"📊 发现 {len(users_without_credits)} 个用户需要补发积分")
        
        if not users_without_credits:
            print("✅ 所有用户都已有积分记录，无需补发")
            return
        
        processed_count = 0
        admin_count = 0
        regular_count = 0
        
        for user in users_without_credits:
            print(f"\n📤 处理用户: {user.email} (ID: {user.id})")
            
            # 开始事务
            try:
                if user.is_superuser:
                    # 管理员用户
                    balance = 999999
                    description = "管理员初始积分"
                    admin_count += 1
                    print(f"  👑 管理员用户，分配 {balance} 积分")
                else:
                    # 普通用户
                    balance = 1000
                    description = "系统上线积分补发"
                    regular_count += 1
                    print(f"  👤 普通用户，分配 {balance} 积分")
                
                # 创建用户积分记录
                user_credits = UserCredits(
                    user_id=user.id,
                    balance=balance
                )
                db.add(user_credits)
                
                # 创建交易记录
                transaction = CreditTransaction(
                    user_id=user.id,
                    type=TransactionType.MANUAL_GRANT,
                    amount=balance,
                    description=description
                )
                db.add(transaction)
                
                # 提交这个用户的记录
                db.commit()
                processed_count += 1
                print(f"  ✅ 成功为用户 {user.email} 创建积分记录")
                
            except Exception as e:
                print(f"  ❌ 处理用户 {user.email} 时出错: {e}")
                db.rollback()
                continue
        
        print(f"\n🎉 积分补发完成！")
        print(f"📈 处理统计:")
        print(f"  - 总处理用户数: {processed_count}")
        print(f"  - 管理员用户: {admin_count}")
        print(f"  - 普通用户: {regular_count}")
        
        # 验证结果
        print(f"\n🔍 验证结果:")
        total_credits = db.query(UserCredits).count()
        total_transactions = db.query(CreditTransaction).count()
        print(f"  - 积分记录总数: {total_credits}")
        print(f"  - 交易记录总数: {total_transactions}")
        
    except Exception as e:
        print(f"❌ 脚本执行失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_backfill():
    """验证补发结果"""
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print(f"\n📋 详细验证报告:")
        
        # 查询管理员积分情况
        admin_credits = db.query(UserCredits).join(User).filter(
            User.is_superuser == True
        ).all()
        
        print(f"👑 管理员积分情况:")
        for credit in admin_credits:
            user = db.query(User).filter(User.id == credit.user_id).first()
            print(f"  - {user.email}: {credit.balance} 积分")
        
        # 查询普通用户积分情况（显示前5个）
        regular_credits = db.query(UserCredits).join(User).filter(
            User.is_superuser == False
        ).limit(5).all()
        
        print(f"👤 普通用户积分情况（前5个）:")
        for credit in regular_credits:
            user = db.query(User).filter(User.id == credit.user_id).first()
            print(f"  - {user.email}: {credit.balance} 积分")
        
        # 查询交易记录统计
        manual_grants = db.query(CreditTransaction).filter(
            CreditTransaction.type == TransactionType.MANUAL_GRANT
        ).count()
        
        print(f"📊 交易记录统计:")
        print(f"  - MANUAL_GRANT 类型交易: {manual_grants} 条")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🏦 ThinkSo 积分系统 - 一次性用户积分补发脚本")
    print("=" * 60)
    
    # 执行补发
    backfill_user_credits()
    
    # 验证结果
    verify_backfill()
    
    print("\n" + "=" * 60)
    print("✨ 脚本执行完成")
    print("=" * 60)