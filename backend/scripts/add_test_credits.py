"""
本地脚本：为测试环境中的指定用户增加积分

使用方法（本地执行，指向你的测试数据库）：

1) 确保在 backend 目录已配置好数据库连接环境变量，比如：
   export DATABASE_URL="postgresql://user:pass@host:5432/thinktree_db_staging"

2) 在项目根目录执行：
   python backend/scripts/add_test_credits.py --email ryan7642@163.com --amount 10000

脚本会：
 - 查询用户
 - 增加其积分余额
 - 写入一条 CreditTransaction（MANUAL_GRANT）
"""

import os
import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import User, UserCredits, CreditTransaction, TransactionType  # noqa


def get_db_session():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("缺少环境变量 DATABASE_URL")
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def add_credits(email: str, amount: int):
    db = get_db_session()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise RuntimeError(f"未找到邮箱为 {email} 的用户")

        user_credits = db.query(UserCredits).filter(UserCredits.user_id == user.id).first()
        if not user_credits:
            user_credits = UserCredits(user_id=user.id, balance=0)
            db.add(user_credits)
            db.flush()

        user_credits.balance += amount

        tx = CreditTransaction(
            user_id=user.id,
            type=TransactionType.MANUAL_GRANT,
            amount=amount,
            description=f"测试加分 {amount}"
        )
        db.add(tx)
        db.commit()
        print(f"✅ 已为 {email} 增加 {amount} 分，当前余额：{user_credits.balance}")
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--amount", type=int, required=True)
    args = parser.parse_args()
    add_credits(args.email, args.amount)


