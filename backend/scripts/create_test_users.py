"""
创建测试用户来演示积分补发功能
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User
from passlib.context import CryptContext

def create_test_users():
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # 密码哈希
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        print("🚀 创建测试用户...")
        
        # 创建一个管理员用户
        admin_user = User(
            email="admin@thinkso.io",
            password_hash=pwd_context.hash("test123"),
            is_active=True,
            is_verified=True,
            is_superuser=True,
            display_name="系统管理员"
        )
        db.add(admin_user)
        
        # 创建几个普通用户
        regular_users = [
            {
                "email": "user1@thinkso.io",
                "display_name": "用户一"
            },
            {
                "email": "user2@thinkso.io", 
                "display_name": "用户二"
            },
            {
                "email": "user3@thinkso.io",
                "display_name": "用户三"
            }
        ]
        
        for user_data in regular_users:
            user = User(
                email=user_data["email"],
                password_hash=pwd_context.hash("test123"),
                is_active=True,
                is_verified=True,
                is_superuser=False,
                display_name=user_data["display_name"]
            )
            db.add(user)
        
        db.commit()
        print("✅ 测试用户创建成功")
        
        # 验证创建结果
        users = db.query(User).all()
        print(f"\n📊 创建的用户:")
        for user in users:
            role = "管理员" if user.is_superuser else "普通用户"
            print(f"  - {user.email} ({role})")
        
    except Exception as e:
        print(f"❌ 创建用户失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()