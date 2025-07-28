"""
积分历史记录数据模型
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional

from ..core.database import Base


class CreditOperationType:
    """积分操作类型常量"""
    CONSUMPTION = "consumption"  # 消耗
    REWARD = "reward"           # 奖励
    PURCHASE = "purchase"       # 购买
    REFUND = "refund"          # 退款
    ADJUSTMENT = "adjustment"   # 调整
    TRANSFER = "transfer"       # 转账


class CreditReason:
    """积分变动原因常量"""
    # 消耗类
    AI_GENERATION = "AI思维导图生成"
    FILE_PROCESSING = "文件处理"
    TEXT_PROCESSING = "文本处理"
    
    # 奖励类
    REGISTRATION = "新用户注册"
    INVITATION = "邀请好友"
    DAILY_SIGNIN = "每日签到"
    SYSTEM_REWARD = "系统奖励"
    SYSTEM_INIT = "系统初始化"
    
    # 购买类
    STRIPE_PAYMENT = "Stripe充值"
    MANUAL_RECHARGE = "手动充值"
    
    # 其他
    ADMIN_ADJUSTMENT = "管理员调整"
    ERROR_CORRECTION = "错误修正"


class CreditHistory(Base):
    """
    积分历史记录表模型
    记录所有积分变动的详细信息
    """
    __tablename__ = "credit_history"

    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 用户关联
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # 积分变动信息
    change_amount = Column(Integer, nullable=False)  # 积分变动数量（正数为增加，负数为减少）
    balance_after = Column(Integer, nullable=False)  # 变动后的积分余额
    
    # 操作信息
    operation_type = Column(String(20), nullable=False, index=True)  # 操作类型
    reason = Column(String(100), nullable=False)  # 变动原因
    description = Column(String(500), nullable=True)  # 详细描述
    
    # 关联信息
    related_id = Column(String(100), nullable=True, index=True)  # 关联的业务ID
    
    # 时间戳
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False,
        index=True
    )
    
    # 关系定义
    user = relationship("User", back_populates="credit_history")
    
    def __repr__(self):
        return f"<CreditHistory(id={self.id}, user_id={self.user_id}, change={self.change_amount}, balance={self.balance_after})>"
    
    def to_dict(self):
        """
        将积分历史记录转换为字典
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "change_amount": self.change_amount,
            "balance_after": self.balance_after,
            "operation_type": self.operation_type,
            "reason": self.reason,
            "description": self.description,
            "related_id": self.related_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def create_record(
        cls,
        user_id: int,
        change_amount: int,
        balance_after: int,
        reason: str,
        operation_type: str,
        description: Optional[str] = None,
        related_id: Optional[str] = None
    ) -> "CreditHistory":
        """
        创建积分历史记录的便捷方法
        
        Args:
            user_id: 用户ID
            change_amount: 积分变动数量
            balance_after: 变动后余额
            reason: 变动原因
            operation_type: 操作类型
            description: 详细描述
            related_id: 关联业务ID
            
        Returns:
            CreditHistory: 积分历史记录实例
        """
        return cls(
            user_id=user_id,
            change_amount=change_amount,
            balance_after=balance_after,
            reason=reason,
            operation_type=operation_type,
            description=description,
            related_id=related_id,
            created_at=datetime.now()
        )
    
    @property
    def is_consumption(self) -> bool:
        """是否为消耗类操作"""
        return self.operation_type == CreditOperationType.CONSUMPTION
    
    @property
    def is_reward(self) -> bool:
        """是否为奖励类操作"""
        return self.operation_type == CreditOperationType.REWARD
    
    @property
    def is_purchase(self) -> bool:
        """是否为购买类操作"""
        return self.operation_type == CreditOperationType.PURCHASE
    
    @property
    def formatted_change(self) -> str:
        """格式化的积分变动显示"""
        if self.change_amount > 0:
            return f"+{self.change_amount}"
        else:
            return str(self.change_amount)
    
    @property
    def operation_display(self) -> str:
        """操作类型的显示名称"""
        display_map = {
            CreditOperationType.CONSUMPTION: "消耗",
            CreditOperationType.REWARD: "奖励",
            CreditOperationType.PURCHASE: "购买",
            CreditOperationType.REFUND: "退款",
            CreditOperationType.ADJUSTMENT: "调整",
            CreditOperationType.TRANSFER: "转账"
        }
        return display_map.get(self.operation_type, self.operation_type)