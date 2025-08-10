"""
Login Token Model
"""
from sqlalchemy import Column, Integer, String, DateTime, func
from ..core.database import Base

class LoginToken(Base):
    """
    Login Token table model
    """
    __tablename__ = "login_tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=False)
    code_hash = Column(String(255), nullable=False)
    magic_token = Column(String(255), unique=True, index=True, nullable=True)
    invitation_code = Column(String(16), nullable=True)  # 兼容旧字段：暂存邀请码
    inviter_user_id = Column(Integer, nullable=True)     # 新：绑定邀请者用户ID
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<LoginToken(email='{self.email}', used_at='{self.used_at}')>"
