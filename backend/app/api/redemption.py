"""
兑换码相关API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..services.redemption_service import RedemptionService

router = APIRouter()


class RedeemCodeRequest(BaseModel):
    """兑换码请求模型"""
    code: str = Field(..., description="兑换码", example="WELCOME2024")


class RedeemCodeResponse(BaseModel):
    """兑换码响应模型"""
    success: bool = Field(..., description="是否兑换成功")
    message: str = Field(..., description="兑换结果消息")
    credits_gained: int = Field(None, description="获得的积分数量")
    current_balance: int = Field(None, description="当前积分余额")


class RedemptionHistoryItem(BaseModel):
    """兑换历史项模型"""
    code: str = Field(..., description="兑换码")
    credits_amount: int = Field(..., description="兑换的积分数量")
    redeemed_at: str = Field(..., description="兑换时间")
    created_at: str = Field(..., description="兑换码创建时间")


class RedemptionHistoryResponse(BaseModel):
    """兑换历史响应模型"""
    history: List[RedemptionHistoryItem] = Field(..., description="兑换历史列表")


@router.post("/redeem", response_model=RedeemCodeResponse)
def redeem_code(
    request: RedeemCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    兑换积分码
    """
    # 验证兑换码格式
    is_valid, format_error = RedemptionService.validate_code_format(request.code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=format_error
        )
    
    # 执行兑换操作
    success, message, credits_gained = RedemptionService.redeem_code(
        db=db,
        user_id=current_user.id,
        code=request.code
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # 获取用户当前积分余额
    from ..models.user_credits import UserCredits
    user_credits = db.query(UserCredits).filter(
        UserCredits.user_id == current_user.id
    ).first()
    
    current_balance = user_credits.balance if user_credits else 0
    
    return RedeemCodeResponse(
        success=True,
        message=message,
        credits_gained=credits_gained,
        current_balance=current_balance
    )


@router.get("/history", response_model=RedemptionHistoryResponse)
def get_redemption_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户兑换历史
    """
    history = RedemptionService.get_redemption_history(
        db=db,
        user_id=current_user.id,
        limit=20
    )
    
    return RedemptionHistoryResponse(
        history=[
            RedemptionHistoryItem(**item) for item in history
        ]
    )