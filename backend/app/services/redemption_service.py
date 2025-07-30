"""
兑换码服务模块
"""

from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..models.redemption_code import RedemptionCode, RedemptionCodeStatus
from ..models.credit_transaction import CreditTransaction, TransactionType
from ..models.user_credits import UserCredits


class RedemptionService:
    """兑换码服务类"""
    
    @staticmethod
    def redeem_code(db: Session, user_id: int, code: str) -> Tuple[bool, str, Optional[int]]:
        """
        兑换积分码
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            code: 兑换码
            
        Returns:
            Tuple[bool, str, Optional[int]]: (是否成功, 消息, 获得的积分数量)
        """
        try:
            # 获取兑换码记录（使用悲观锁防止并发问题）
            redemption_code = db.query(RedemptionCode).filter(
                RedemptionCode.code == code.strip().upper()
            ).with_for_update().first()
            
            # 检查兑换码是否存在
            if not redemption_code:
                return False, "兑换码不存在", None
            
            # 检查兑换码状态
            if redemption_code.status != RedemptionCodeStatus.ACTIVE:
                if redemption_code.status == RedemptionCodeStatus.REDEEMED:
                    return False, "该兑换码已被使用", None
                elif redemption_code.status == RedemptionCodeStatus.EXPIRED:
                    return False, "该兑换码已过期", None
                else:
                    return False, "兑换码状态异常", None
            
            # 检查是否过期
            current_time = datetime.now(timezone.utc)
            # 确保过期时间也有时区信息
            expires_at = redemption_code.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at < current_time:
                # 自动更新状态为过期
                redemption_code.status = RedemptionCodeStatus.EXPIRED
                db.commit()
                return False, "该兑换码已过期", None
            
            # 获取用户积分记录（使用悲观锁）
            user_credits = db.query(UserCredits).filter(
                UserCredits.user_id == user_id
            ).with_for_update().first()
            
            if not user_credits:
                return False, "用户积分记录不存在", None
            
            # 执行兑换操作
            credits_amount = redemption_code.credits_amount
            
            # 更新用户积分
            user_credits.balance += credits_amount
            
            # 更新兑换码状态
            redemption_code.status = RedemptionCodeStatus.REDEEMED
            redemption_code.redeemed_at = current_time
            redemption_code.redeemed_by_user_id = user_id
            
            # 创建积分交易记录
            transaction = CreditTransaction(
                user_id=user_id,
                type=TransactionType.INITIAL_GRANT,  # 临时使用初始发放类型
                amount=credits_amount,
                description=f"兑换码充值: {code}"
            )
            db.add(transaction)
            
            # 提交事务
            db.commit()
            
            return True, f"兑换成功，获得 {credits_amount} 积分", credits_amount
            
        except IntegrityError as e:
            db.rollback()
            print(f"数据库完整性错误: {str(e)}")  # 临时调试日志
            return False, "兑换操作失败，请重试", None
        except Exception as e:
            db.rollback()
            print(f"兑换过程异常: {str(e)}")  # 临时调试日志
            import traceback
            traceback.print_exc()  # 临时调试日志
            return False, f"兑换过程中发生错误: {str(e)}", None
    
    @staticmethod
    def validate_code_format(code: str) -> Tuple[bool, str]:
        """
        验证兑换码格式
        
        Args:
            code: 兑换码
            
        Returns:
            Tuple[bool, str]: (是否有效, 错误消息)
        """
        if not code:
            return False, "兑换码不能为空"
        
        code = code.strip()
        if len(code) < 6:
            return False, "兑换码长度不能少于6位"
        
        if len(code) > 50:
            return False, "兑换码长度不能超过50位"
        
        # 检查字符是否合法（只允许字母和数字）
        if not code.replace('-', '').replace('_', '').isalnum():
            return False, "兑换码只能包含字母、数字、短横线和下划线"
        
        return True, ""
    
    @staticmethod
    def get_redemption_history(db: Session, user_id: int, limit: int = 20) -> list:
        """
        获取用户的兑换历史
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            limit: 返回记录数量限制
            
        Returns:
            list: 兑换历史列表
        """
        try:
            history = db.query(RedemptionCode).filter(
                RedemptionCode.redeemed_by_user_id == user_id,
                RedemptionCode.status == RedemptionCodeStatus.REDEEMED
            ).order_by(RedemptionCode.redeemed_at.desc()).limit(limit).all()
            
            return [
                {
                    "code": item.code,
                    "credits_amount": item.credits_amount,
                    "redeemed_at": item.redeemed_at.isoformat() if item.redeemed_at else None,
                    "created_at": item.created_at.isoformat() if item.created_at else None
                }
                for item in history
            ]
        except Exception as e:
            return []