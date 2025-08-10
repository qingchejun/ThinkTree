"""
推荐事件模型
"""
from sqlalchemy import Column, Integer, String, DateTime, func
from ..core.database import Base


class ReferralEvent(Base):
    __tablename__ = "referral_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inviter_user_id = Column(Integer, index=True, nullable=False)
    invitee_user_id = Column(Integer, index=True, nullable=False)
    granted_credits_to_inviter = Column(Integer, nullable=False, default=0)
    granted_credits_to_invitee = Column(Integer, nullable=False, default=0)
    status = Column(String(16), nullable=False, default="COMPLETED")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "inviter_user_id": self.inviter_user_id,
            "invitee_user_id": self.invitee_user_id,
            "granted_credits_to_inviter": self.granted_credits_to_inviter,
            "granted_credits_to_invitee": self.granted_credits_to_invitee,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


