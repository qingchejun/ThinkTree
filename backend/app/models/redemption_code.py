"""
兑换码数据模型
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from ..core.database import Base


class RedemptionCodeStatus(enum.Enum):
    """
    兑换码状态枚举
    """
    ACTIVE = "ACTIVE"       # 激活状态，可以兑换
    REDEEMED = "REDEEMED"   # 已兑换
    EXPIRED = "EXPIRED"     # 已过期


class RedemptionCode(Base):
    """
    积分兑换码表模型
    """
    __tablename__ = "redemption_codes"

    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 兑换码（唯一字符串）
    code = Column(String(50), unique=True, nullable=False, index=True)
    
    # 积分数量
    credits_amount = Column(Integer, nullable=False)
    
    # 兑换码状态
    status = Column(Enum(RedemptionCodeStatus), nullable=False, default=RedemptionCodeStatus.ACTIVE)
    
    # 过期时间
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # 兑换时间（可为空）
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    
    # 兑换者用户ID（可为空，外键）
    redeemed_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    
    # 创建时间
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    
    # 关系定义
    redeemed_by_user = relationship("User", foreign_keys=[redeemed_by_user_id])
    
    def __repr__(self):
        return f"<RedemptionCode(id={self.id}, code={self.code}, credits={self.credits_amount}, status={self.status.value})>"
    
    def to_dict(self):
        """
        将兑换码对象转换为字典
        """
        return {
            "id": self.id,
            "code": self.code,
            "credits_amount": self.credits_amount,
            "status": self.status.value,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "redeemed_at": self.redeemed_at.isoformat() if self.redeemed_at else None,
            "redeemed_by_user_id": self.redeemed_by_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }