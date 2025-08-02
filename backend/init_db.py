# backend/init_db.py
import logging
import sys
import os

# 确保 app 模块可以被找到
sys.path.append(os.getcwd())

from app.core.database import Base, engine
# 关键：确保导入所有模型，以便Base.metadata知道它们的存在
from app.models import User, Mindmap, InvitationCode, UserCredits, CreditTransaction, RedemptionCode, LoginToken

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    try:
        logger.info("Creating all database tables based on models...")
        # 一次性创建所有在Base中定义的表
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    init_db()