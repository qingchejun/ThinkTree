"""
积分历史记录数据模型
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from ..core.database import Base


class CreditHistory(Base):
    """
    积分变动历史记录表
    记录用户每一笔积分的变动情况
    """
    __tablename__ = "credit_history"

    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 用户外键
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # 积分变动数量（正数为增加，负数为扣除）
    change_amount = Column(Integer, nullable=False)
    
    # 变动后的用户积分余额
    balance_after = Column(Integer, nullable=False)
    
    # 变动原因
    reason = Column(String(255), nullable=False)
    
    # 详细描述（可选，用于存储更多信息）
    description = Column(Text, nullable=True)
    
    # 操作类型（用于分类和统计）
    operation_type = Column(String(50), nullable=False, default="consumption")
    # 可能的值: "consumption"(消费), "reward"(奖励), "refund"(退款), "admin_adjustment"(管理员调整)
    
    # 关联的业务ID（可选，比如思维导图ID、邀请记录ID等）
    related_id = Column(String(100), nullable=True, index=True)
    
    # 创建时间
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False,
        index=True  # 添加索引以便按时间查询
    )

    # 关系定义 - 与用户表的关联
    user = relationship(
        "User", 
        back_populates="credit_history",
        lazy="select"
    )

    def __repr__(self):
        return (f"<CreditHistory(id={self.id}, user_id={self.user_id}, "
                f"change_amount={self.change_amount}, balance_after={self.balance_after}, "
                f"reason='{self.reason}')>")

    def to_dict(self):
        """
        将积分历史记录转换为字典格式
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "change_amount": self.change_amount,
            "balance_after": self.balance_after,
            "reason": self.reason,
            "description": self.description,
            "operation_type": self.operation_type,
            "related_id": self.related_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def create_record(cls, user_id: int, change_amount: int, balance_after: int, 
                     reason: str, operation_type: str = "consumption", 
                     description: str = None, related_id: str = None):
        """
        创建积分变动记录的便捷方法
        
        Args:
            user_id: 用户ID
            change_amount: 积分变动数量（正数为增加，负数为扣除）
            balance_after: 变动后的积分余额
            reason: 变动原因
            operation_type: 操作类型
            description: 详细描述
            related_id: 关联的业务ID
        """
        return cls(
            user_id=user_id,
            change_amount=change_amount,
            balance_after=balance_after,
            reason=reason,
            operation_type=operation_type,
            description=description,
            related_id=related_id
        )

    @property
    def is_credit_gain(self) -> bool:
        """判断是否为积分增加"""
        return self.change_amount > 0

    @property
    def is_credit_loss(self) -> bool:
        """判断是否为积分扣除"""
        return self.change_amount < 0

    @property
    def formatted_change(self) -> str:
        """格式化显示积分变动"""
        if self.change_amount > 0:
            return f"+{self.change_amount}"
        return str(self.change_amount)


# 常用的操作类型常量
class CreditOperationType:
    """积分操作类型常量"""
    CONSUMPTION = "consumption"      # 消费（生成思维导图等）
    REWARD = "reward"               # 奖励（邀请好友等）
    REFUND = "refund"               # 退款
    ADMIN_ADJUSTMENT = "admin_adjustment"  # 管理员调整
    SYSTEM_BONUS = "system_bonus"   # 系统奖励
    PURCHASE = "purchase"           # 购买积分


# 常用的变动原因常量
class CreditReason:
    """积分变动原因常量"""
    # 消费类
    GENERATE_MINDMAP = "生成思维导图"
    PROCESS_TEXT = "处理文本内容"
    PROCESS_FILE = "处理文件"
    
    # 奖励类
    INVITATION_REWARD = "邀请好友奖励"
    REGISTRATION_BONUS = "注册奖励"
    DAILY_CHECKIN = "每日签到"
    
    # 管理类
    ADMIN_GRANT = "管理员发放"
    ADMIN_DEDUCT = "管理员扣除"
    SYSTEM_REFUND = "系统退款"
    PURCHASE_CREDITS = "购买积分"