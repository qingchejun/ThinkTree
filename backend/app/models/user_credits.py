"""
用户积分数据模型
"""

from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base


class UserCredits(Base):
    """
    用户积分表模型 - 存储用户的积分余额
    """
    __tablename__ = "user_credits"

    # 主键 - 用户ID，与User表建立一对一关系
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True, nullable=False)
    
    # 积分余额
    balance = Column(Integer, default=0, nullable=False)
    
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
    
    # 关系定义 - 与User表的一对一关联
    user = relationship("User", back_populates="credits")
    
    def __repr__(self):
        return f"<UserCredits(user_id={self.user_id}, balance={self.balance})>"
    
    def to_dict(self):
        """
        将积分对象转换为字典
        """
        return {
            "user_id": self.user_id,
            "balance": self.balance,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }