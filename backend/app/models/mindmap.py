"""
思维导图数据模型 - ThinkTree v2.2.0
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from ..core.database import Base


class Mindmap(Base):
    """
    思维导图表模型
    存储用户创建的思维导图数据
    """
    __tablename__ = "mindmaps"

    # 主键 - 使用UUID确保唯一性
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True
    )
    
    # 思维导图标题
    title = Column(String(200), nullable=False, index=True)
    
    # 思维导图内容 (Markdown格式)
    content = Column(Text, nullable=False)
    
    # 外键关联到用户表
    user_id = Column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # 时间戳
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False,
        index=True
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )
    
    # 可选字段
    description = Column(String(500), nullable=True)  # 思维导图描述
    tags = Column(String(200), nullable=True)  # 标签 (逗号分隔)
    is_public = Column(String(1), default='0', nullable=False)  # 是否公开 ('0'私有, '1'公开)
    
    # 关系定义 - 与用户表的关联
    user = relationship(
        "User", 
        back_populates="mindmaps",
        lazy="select"
    )
    
    def __repr__(self):
        return f"<Mindmap(id={self.id}, title='{self.title}', user_id={self.user_id})>"
    
    def to_dict(self):
        """
        将思维导图对象转换为字典
        """
        return {
            "id": str(self.id),
            "title": self.title,
            "content": self.content,
            "user_id": self.user_id,
            "description": self.description,
            "tags": self.tags.split(',') if self.tags else [],
            "is_public": self.is_public == '1',
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # 包含用户信息 (如果已加载)
            "user": {
                "id": self.user.id,
                "email": self.user.email,
                "display_name": self.user.display_name
            } if hasattr(self, 'user') and self.user else None
        }
    
    def to_summary_dict(self):
        """
        转换为摘要字典 (不包含完整content，用于列表显示)
        """
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "tags": self.tags.split(',') if self.tags else [],
            "is_public": self.is_public == '1',
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "content_preview": self.content[:100] + "..." if len(self.content) > 100 else self.content
        }