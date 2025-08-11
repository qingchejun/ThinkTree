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
from ..utils.invitation_utils import generate_referral_code
from .auth import get_current_user

router = APIRouter()


class ReferralLinkResponse(BaseModel):
    referral_code: str | None
    referral_link: str | None
    invited_count: int
    limit: int
    rule_text: str
    reached_limit: bool | None = None


@router.get("/me/link", response_model=ReferralLinkResponse)
async def get_my_referral_link(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = getattr(current_user, 'referral_code', None)
    if not code:
        # 为旧用户即时分配一个推荐码
        try:
            code = generate_referral_code(db)
            current_user.referral_code = code
            db.commit()
        except Exception:
            db.rollback()
    invited = int(getattr(current_user, 'referral_used', 0) or 0)
    limit = int(getattr(current_user, 'referral_limit', 10) or 10)
    reached_limit = invited >= limit
    # 邀请链接前缀改为 /referralCode=
    link = f"{settings.frontend_url}/referralCode={code}" if code else None
    # 精简文案：去掉“最高累计”提示
    rule_text = f"你和好友各得 {settings.referral_bonus_per_signup} 积分"
    return ReferralLinkResponse(
        referral_code=code,
        referral_link=link,
        invited_count=invited,
        limit=limit,
        rule_text=rule_text,
        reached_limit=reached_limit,
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
    invitee_email_masked: str
    granted_credits_to_inviter: int
    granted_credits_to_invitee: int
    status: str
    created_at: str


class ReferralHistoryResponse(BaseModel):
    items: list[ReferralHistoryItem]
    page: int | None = None
    limit: int | None = None
    has_next: bool | None = None


def _mask_email(email: str) -> str:
    """对邮箱做简单脱敏，例如 a***@ex.com"""
    try:
        if not email or "@" not in email:
            return "***"
        name, domain = email.split("@", 1)
        if len(name) <= 1:
            masked_name = "*"
        elif len(name) == 2:
            masked_name = name[0] + "*"
        else:
            masked_name = name[0] + "***" + name[-1]
        return masked_name + "@" + domain
    except Exception:
        return "***"


@router.get("/me/history", response_model=ReferralHistoryResponse)
async def get_my_referral_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    page = max(1, page)
    limit = min(50, max(1, limit))
    q = db.query(ReferralEvent).filter(ReferralEvent.inviter_user_id == current_user.id).order_by(ReferralEvent.created_at.desc())
    events = q.offset((page - 1) * limit).limit(limit + 1).all()
    # 预取受邀用户邮箱并进行脱敏
    invitee_ids = [e.invitee_user_id for e in events]
    emails_by_id = {}
    if invitee_ids:
        users = db.query(User).filter(User.id.in_(invitee_ids)).all()
        emails_by_id = {u.id: _mask_email(u.email) for u in users if getattr(u, "email", None)}

    items = []
    for e in events:
        masked_email = emails_by_id.get(e.invitee_user_id, "***")
        items.append(
            ReferralHistoryItem(
                invitee_user_id=e.invitee_user_id,
                invitee_email_masked=masked_email,
                granted_credits_to_inviter=e.granted_credits_to_inviter,
                granted_credits_to_invitee=e.granted_credits_to_invitee,
                status=e.status,
                created_at=e.created_at.isoformat() if e.created_at else "",
            )
        )
    has_next = len(items) > limit
    if has_next:
        items = items[:limit]
    return ReferralHistoryResponse(items=items, page=page, limit=limit, has_next=has_next)


