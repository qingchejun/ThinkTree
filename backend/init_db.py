#!/usr/bin/env python3
"""
数据库初始化脚本
用于生产环境的数据库初始化和迁移
"""

import subprocess
import sys
from pathlib import Path

from app.core.config import settings
from app.core.database import engine
from sqlalchemy import text

def run_command(command, description):
    """运行shell命令"""
    print(f"📋 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} 成功")
        if result.stdout:
            print(f"输出: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} 失败")
        print(f"错误: {e.stderr}")
        return False

def check_database_connection():
    """检查数据库连接"""
    print("🔍 检查数据库连接...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        print("✅ 数据库连接正常")
        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {str(e)}")
        return False

def init_database():
    """初始化数据库"""
    print("🚀 开始数据库初始化...")
    print(f"📍 数据库URL: {settings.database_url_fixed}")
    
    # 检查数据库连接
    if not check_database_connection():
        print("❌ 数据库连接失败，请检查 DATABASE_URL 配置")
        return False
    
    # 运行数据库迁移
    if not run_command("alembic upgrade head", "运行数据库迁移"):
        return False
    
    print("🎉 数据库初始化完成！")
    return True

def reset_database():
    """重置数据库（开发环境使用）"""
    print("⚠️  警告：这将删除所有数据！")
    confirm = input("确认重置数据库？(yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ 操作已取消")
        return False
    
    print("🔄 重置数据库...")
    
    # 删除所有迁移版本
    if not run_command("alembic downgrade base", "回滚所有迁移"):
        return False
    
    # 重新运行迁移
    if not run_command("alembic upgrade head", "重新运行迁移"):
        return False
    
    print("🎉 数据库重置完成！")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        reset_database()
    else:
        init_database()