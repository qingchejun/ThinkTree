"""
邀请码数据模型
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from ..core.database import Base


class InvitationCode(Base):
    """
    邀请码表模型
    """
    __tablename__ = "invitation_codes"

    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 邀请码 (唯一，8位随机字符串)
    code = Column(String(16), unique=True, index=True, nullable=False)
    
    # 生成邀请码的用户ID
    generated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 使用状态
    is_used = Column(Boolean, default=False, nullable=False)
    
    # 使用该邀请码注册的用户ID (可为空)
    used_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # 邀请码描述/备注 (可选)
    description = Column(Text, nullable=True)
    
    # 过期时间 (可选，默认永不过期)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # 时间戳
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    used_at = Column(
        DateTime(timezone=True), 
        nullable=True
    )
    
    # 关系定义
    # 生成邀请码的用户
    generated_by_user = relationship(
        "User", 
        foreign_keys=[generated_by_user_id],
        backref="generated_invitations"
    )
    
    # 使用邀请码的用户
    used_by_user = relationship(
        "User", 
        foreign_keys=[used_by_user_id],
        backref="used_invitation"
    )
    
    def __repr__(self):
        return f"<InvitationCode(id={self.id}, code='{self.code}', is_used={self.is_used})>"
    
    def to_dict(self):
        """
        将邀请码对象转换为字典
        """
        return {
            "id": self.id,
            "code": self.code,
            "generated_by_user_id": self.generated_by_user_id,
            "is_used": self.is_used,
            "used_by_user_id": self.used_by_user_id,
            "description": self.description,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "used_at": self.used_at.isoformat() if self.used_at else None
        }
    
    @property
    def is_expired(self):
        """
        检查邀请码是否已过期
        """
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self):
        """
        检查邀请码是否有效 (未使用且未过期)
        """
        return not self.is_used and not self.is_expired