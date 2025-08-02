"""
数据库连接和会话管理
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from .config import settings

# 创建数据库引擎
engine = create_engine(
    settings.database_url_fixed,
    # SQLite 特殊配置
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=settings.debug,  # 在调试模式下显示 SQL 语句
    # 关闭连接池预连接，避免启动时立即连接数据库
    pool_pre_ping=True,
    pool_recycle=3600
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    获取数据库会话
    
    用作 FastAPI 的依赖注入
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    创建所有数据表
    
    在应用启动时调用
    """
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """
    删除所有数据表
    
    仅用于开发和测试
    """
    Base.metadata.drop_all(bind=engine) 