"""
检查数据库中的用户情况
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User
from app.models.login_token import LoginToken
from app.models.user_credits import UserCredits

def check_database():
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 查看用户总数
        total_users = db.query(User).count()
        print(f"📊 用户总数: {total_users}")
        
        if total_users > 0:
            # 显示所有用户
            users = db.query(User).all()
            print(f"\n👥 用户列表:")
            for user in users:
                print(f"  ID: {user.id}, Email: {user.email}, 管理员: {'是' if user.is_superuser else '否'}")

        # 额外：按邮箱查找
        target = os.environ.get('EMAIL')
        if target:
            print(f"\n🔎 查询邮箱: {target}")
            u = db.query(User).filter(User.email.ilike(target)).first()
            print(f"  users 表命中: {'是' if u else '否'}")
            t = db.query(LoginToken).filter(LoginToken.email.ilike(target)).order_by(LoginToken.created_at.desc()).first()
            print(f"  login_tokens 表命中: {'是' if t else '否'}; 最近记录时间: {getattr(t, 'created_at', None)}")
        
        # 查看积分记录总数
        total_credits = db.query(UserCredits).count()
        print(f"\n💰 积分记录总数: {total_credits}")
        
        if total_credits > 0:
            credits = db.query(UserCredits).all()
            print(f"\n💳 积分记录:")
            for credit in credits:
                print(f"  用户ID: {credit.user_id}, 余额: {credit.balance}")
    
    finally:
        db.close()

if __name__ == "__main__":
    check_database()