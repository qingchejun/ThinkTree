"""
推荐码与邀请统计 API
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.config import settings
from ..models.user import User
from ..models.referral_event import ReferralEvent
from .auth import get_current_user

router = APIRouter()


class ReferralLinkResponse(BaseModel):
    referral_code: str | None
    referral_link: str | None
    invited_count: int
    limit: int
    rule_text: str


@router.get("/me/link", response_model=ReferralLinkResponse)
async def get_my_referral_link(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = getattr(current_user, 'referral_code', None)
    invited = int(getattr(current_user, 'referral_used', 0) or 0)
    limit = int(getattr(current_user, 'referral_limit', 10) or 10)
    link = f"{settings.frontend_url}/register?invitation_code={code}" if code else None
    rule_text = f"你和好友各得 {settings.referral_bonus_per_signup} 积分（最高累计 {settings.referral_max_total_bonus} 积分）"
    return ReferralLinkResponse(
        referral_code=code,
        referral_link=link,
        invited_count=invited,
        limit=limit,
        rule_text=rule_text,
    )


class ReferralStatsResponse(BaseModel):
    invited_count: int
    limit: int
    total_bonus_gained: int


@router.get("/me/stats", response_model=ReferralStatsResponse)
async def get_my_referral_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invited = int(getattr(current_user, 'referral_used', 0) or 0)
    limit = int(getattr(current_user, 'referral_limit', 10) or 10)
    # 简化：从事件表汇总邀请人获得的积分
    total_bonus = db.query(ReferralEvent).filter(ReferralEvent.inviter_user_id == current_user.id).count() * settings.referral_bonus_per_signup
    return ReferralStatsResponse(invited_count=invited, limit=limit, total_bonus_gained=total_bonus)


class ReferralHistoryItem(BaseModel):
    invitee_user_id: int
    granted_credits_to_inviter: int
    granted_credits_to_invitee: int
    status: str
    created_at: str


class ReferralHistoryResponse(BaseModel):
    items: list[ReferralHistoryItem]


@router.get("/me/history", response_model=ReferralHistoryResponse)
async def get_my_referral_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.query(ReferralEvent).filter(ReferralEvent.inviter_user_id == current_user.id).order_by(ReferralEvent.created_at.desc()).limit(50).all()
    items = [
        ReferralHistoryItem(
            invitee_user_id=e.invitee_user_id,
            granted_credits_to_inviter=e.granted_credits_to_inviter,
            granted_credits_to_invitee=e.granted_credits_to_invitee,
            status=e.status,
            created_at=e.created_at.isoformat() if e.created_at else "",
        ) for e in events
    ]
    return ReferralHistoryResponse(items=items)


