#!/usr/bin/env python3
"""
修复现有用户的 last_daily_reward_date 字段
为所有现有用户设置 last_daily_reward_date = NULL（如果还没有设置的话）
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def fix_daily_reward_field():
    """修复现有用户的每日奖励字段"""
    try:
        # 创建数据库连接
        engine = create_engine(settings.database_url, echo=False)
        
        with engine.connect() as conn:
            # 检查是否有用户的 last_daily_reward_date 字段为空
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM user_credits 
                WHERE last_daily_reward_date IS NULL
            """))
            
            null_count = result.scalar()
            print(f"📊 发现 {null_count} 个用户的 last_daily_reward_date 字段为 NULL")
            
            if null_count > 0:
                print("🔄 这些用户在下次登录时将获得每日奖励")
                print("✅ 无需额外修复 - 系统已设计为处理 NULL 值")
            else:
                print("✅ 所有用户的 last_daily_reward_date 字段都已正确设置")
            
            # 显示用户积分状态
            result = conn.execute(text("""
                SELECT 
                    uc.user_id,
                    u.email,
                    uc.balance,
                    uc.last_daily_reward_date
                FROM user_credits uc
                JOIN users u ON uc.user_id = u.id
                ORDER BY uc.user_id
            """))
            
            print("\n📋 当前用户积分状态:")
            print("用户ID | 邮箱 | 积分余额 | 最后奖励日期")
            print("-" * 60)
            
            for row in result:
                user_id, email, balance, last_reward = row
                last_reward_str = str(last_reward) if last_reward else "未设置"
                print(f"{user_id:6d} | {email:25s} | {balance:8d} | {last_reward_str}")
                
        print("\n🎉 检查完成！")
        return True
        
    except Exception as e:
        print(f"❌ 检查失败: {e}")
        return False

if __name__ == "__main__":
    print("🔍 开始检查用户每日奖励字段状态...")
    success = fix_daily_reward_field()
    
    if success:
        print("✅ 检查成功完成")
        sys.exit(0)
    else:
        print("❌ 检查失败")
        sys.exit(1)