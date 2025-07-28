"""
创建测试用户（简化版）
"""

import os
import sys
import sqlite3
from datetime import datetime

def create_test_users_sql():
    """使用直接SQL创建测试用户"""
    
    # 连接数据库
    db_path = './database.db'  # 根据实际情况调整
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🚀 创建测试用户...")
        
        # 检查用户表是否已有数据
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        if user_count > 0:
            print(f"📊 数据库中已有 {user_count} 个用户")
            # 显示现有用户
            cursor.execute("SELECT id, email, is_superuser FROM users")
            users = cursor.fetchall()
            for user in users:
                role = "管理员" if user[2] else "普通用户"
                print(f"  - ID: {user[0]}, Email: {user[1]} ({role})")
            return
        
        current_time = datetime.now().isoformat()
        
        # 创建管理员用户
        cursor.execute("""
            INSERT INTO users (
                email, password_hash, is_active, is_verified, is_superuser, 
                display_name, credits_balance, invitation_quota,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "admin@thinkso.io",
            "$2b$12$test_hash_for_admin",  # 简化的哈希
            1, 1, 1,
            "系统管理员", 100, 10,
            current_time, current_time
        ))
        
        # 创建普通用户
        users_data = [
            ("user1@thinkso.io", "用户一"),
            ("user2@thinkso.io", "用户二"), 
            ("user3@thinkso.io", "用户三")
        ]
        
        for email, name in users_data:
            cursor.execute("""
                INSERT INTO users (
                    email, password_hash, is_active, is_verified, is_superuser,
                    display_name, credits_balance, invitation_quota,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                email,
                "$2b$12$test_hash_for_user",  # 简化的哈希
                1, 1, 0,
                name, 100, 10,
                current_time, current_time
            ))
        
        conn.commit()
        print("✅ 测试用户创建成功")
        
        # 验证创建结果
        cursor.execute("SELECT id, email, is_superuser, display_name FROM users")
        users = cursor.fetchall()
        print(f"\n📊 创建的用户:")
        for user in users:
            role = "管理员" if user[2] else "普通用户"
            print(f"  - ID: {user[0]}, Email: {user[1]}, 姓名: {user[3]} ({role})")
        
    except Exception as e:
        print(f"❌ 创建用户失败: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    create_test_users_sql()