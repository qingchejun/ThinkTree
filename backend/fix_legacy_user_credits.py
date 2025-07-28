#!/usr/bin/env python3
"""
修复存量用户积分数据脚本
该脚本用于解决存量用户积分字段为NULL导致的积分系统问题
"""

import os
import sys
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.user import User
from app.models.credit_history import CreditHistory, CreditOperationType, CreditReason
from sqlalchemy import text


def fix_legacy_user_credits():
    """修复存量用户的积分数据"""
    print("🚀 开始修复存量用户积分数据...")
    
    # 获取数据库连接
    db = next(get_db())
    
    try:
        # 查找所有积分为NULL的用户
        users_with_null_credits = db.execute(
            text("SELECT id, email, created_at FROM users WHERE credits IS NULL")
        ).fetchall()
        
        print(f"📊 发现 {len(users_with_null_credits)} 个积分为NULL的用户")
        
        if len(users_with_null_credits) == 0:
            print("✅ 所有用户积分数据正常，无需修复")
            return True
        
        # 为每个用户初始化积分
        fixed_count = 0
        for user_row in users_with_null_credits:
            user_id, email, created_at = user_row
            
            # 更新用户积分为100（默认值）
            db.execute(
                text("UPDATE users SET credits = 100 WHERE id = :user_id"),
                {"user_id": user_id}
            )
            
            # 创建积分历史记录
            history_record = CreditHistory(
                user_id=user_id,
                change_amount=100,
                balance_after=100,
                reason=CreditReason.SYSTEM_INIT,
                operation_type=CreditOperationType.REWARD,
                description="系统修复：为存量用户初始化积分余额",
                related_id=f"legacy_fix_{user_id}",
                created_at=datetime.now()
            )
            db.add(history_record)
            
            fixed_count += 1
            print(f"✅ 修复用户 {email} (ID: {user_id}) 的积分数据")
        
        # 提交所有更改
        db.commit()
        
        print(f"🎉 成功修复 {fixed_count} 个用户的积分数据")
        
        # 验证修复结果
        print("\n📋 验证修复结果...")
        remaining_null_users = db.execute(
            text("SELECT COUNT(*) FROM users WHERE credits IS NULL")
        ).scalar()
        
        if remaining_null_users == 0:
            print("✅ 所有用户积分数据已修复完成")
            return True
        else:
            print(f"⚠️  仍有 {remaining_null_users} 个用户积分为NULL")
            return False
            
    except Exception as e:
        print(f"❌ 修复过程中发生错误: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()


def check_credits_status():
    """检查用户积分状态"""
    print("🔍 检查当前用户积分状态...")
    
    db = next(get_db())
    
    try:
        # 统计积分状态
        total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
        null_credits_users = db.execute(text("SELECT COUNT(*) FROM users WHERE credits IS NULL")).scalar()
        valid_credits_users = db.execute(text("SELECT COUNT(*) FROM users WHERE credits IS NOT NULL")).scalar()
        
        print(f"📊 用户积分统计:")
        print(f"   - 总用户数: {total_users}")
        print(f"   - 积分为NULL的用户: {null_credits_users}")
        print(f"   - 积分正常的用户: {valid_credits_users}")
        
        if null_credits_users > 0:
            print("\n🔍 积分为NULL的用户详情:")
            null_users = db.execute(
                text("SELECT id, email, created_at FROM users WHERE credits IS NULL")
            ).fetchall()
            
            for user_id, email, created_at in null_users:
                print(f"   - ID: {user_id}, 邮箱: {email}, 注册时间: {created_at}")
        
        return null_credits_users == 0
        
    except Exception as e:
        print(f"❌ 检查过程中发生错误: {str(e)}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("ThinkTree 存量用户积分修复工具")
    print("=" * 60)
    
    # 检查当前状态
    if check_credits_status():
        print("\n✅ 所有用户积分数据正常，无需修复")
        sys.exit(0)
    
    # 询问是否继续修复
    if len(sys.argv) > 1 and sys.argv[1] == "--auto":
        confirm = "yes"
    else:
        print("\n⚠️  发现积分数据异常，是否继续修复？")
        confirm = input("确认修复 (yes/no): ").lower().strip()
    
    if confirm != "yes":
        print("❌ 操作已取消")
        sys.exit(1)
    
    # 执行修复
    if fix_legacy_user_credits():
        print("\n🎉 积分数据修复完成！")
        sys.exit(0)
    else:
        print("\n❌ 积分数据修复失败！")
        sys.exit(1)