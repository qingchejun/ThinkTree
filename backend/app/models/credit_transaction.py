"""
积分交易记录数据模型
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from ..core.database import Base


class TransactionType(enum.Enum):
    """
    交易类型枚举
    """
    INITIAL_GRANT = "INITIAL_GRANT"  # 初始赠送
    MANUAL_GRANT = "MANUAL_GRANT"    # 手动发放
    DEDUCTION = "DEDUCTION"          # 使用扣除  
    REFUND = "REFUND"                # 失败退款


class CreditTransaction(Base):
    """
    积分交易记录表模型 - 记录每一次积分变动明细
    """
    __tablename__ = "credit_transactions"

    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 用户ID - 外键，与User表关联，并建立索引
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # 交易类型
    type = Column(Enum(TransactionType), nullable=False)
    
    # 积分变动数量（正数）
    amount = Column(Integer, nullable=False)
    
    # 交易描述
    description = Column(String(500), nullable=False)
    
    # 时间戳
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    
    # 关系定义 - 与User表的多对一关联
    user = relationship("User")
    
    def __repr__(self):
        return f"<CreditTransaction(id={self.id}, user_id={self.user_id}, type={self.type.value}, amount={self.amount})>"
    
    def to_dict(self):
        """
        将交易记录对象转换为字典
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type.value,
            "amount": self.amount,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }