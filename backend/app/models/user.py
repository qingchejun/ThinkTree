"""
用户数据模型
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from ..core.database import Base


class User(Base):
    """
    用户表模型
    """
    __tablename__ = "users"

    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 用户邮箱 (唯一)
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # 密码哈希 (Google 登录用户可为空)
    password_hash = Column(String(255), nullable=True)
    
    # Google OAuth ID (用于 Google 登录)
    google_id = Column(String(100), unique=True, index=True, nullable=True)
    
    # 用户状态
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # 时间戳
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )
    
    # 可选的用户信息
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # 邀请配额字段（临时保留）
    invitation_quota = Column(Integer, default=10, nullable=False)
    
    # 关系定义 - 与思维导图表的关联
    mindmaps = relationship(
        "Mindmap", 
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    # 关系定义 - 与用户积分表的一对一关联
    credits = relationship(
        "UserCredits",
        back_populates="user",
        uselist=False,  # 一对一关系
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', is_active={self.is_active}, is_superuser={self.is_superuser})>"
    
    def to_dict(self):
        """
        将用户对象转换为字典 (排除敏感信息)
        """
        return {
            "id": self.id,
            "email": self.email,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "is_superuser": self.is_superuser,
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            # 积分信息现在由UserCredits模型单独管理
            "invitation_quota": self.invitation_quota,  # 临时保留
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 