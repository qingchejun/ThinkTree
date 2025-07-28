"""
积分管理服务
提供积分检查、扣除、增加等核心功能
"""

from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from ..models.user import User
from ..models.credit_history import CreditHistory, CreditOperationType, CreditReason


class CreditService:
    """积分管理服务类"""
    
    def __init__(self, db: Session):
        self.db = db

    def get_user_credits(self, user_id: int) -> int:
        """
        获取用户当前积分余额
        
        Args:
            user_id: 用户ID
            
        Returns:
            int: 用户积分余额，如果用户不存在返回0
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        return user.credits if user else 0

    def check_sufficient_credits(self, user_id: int, required_credits: int) -> Tuple[bool, int]:
        """
        检查用户积分是否充足
        
        Args:
            user_id: 用户ID
            required_credits: 需要的积分数量
            
        Returns:
            Tuple[bool, int]: (是否充足, 当前积分余额)
        """
        current_credits = self.get_user_credits(user_id)
        return current_credits >= required_credits, current_credits

    def is_admin_user(self, user_id: int) -> bool:
        """
        检查用户是否为管理员
        
        Args:
            user_id: 用户ID
            
        Returns:
            bool: 是否为管理员
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        return user.is_superuser if user else False

    def deduct_credits(self, user_id: int, amount: int, reason: str, 
                      description: Optional[str] = None, 
                      related_id: Optional[str] = None,
                      force_deduct: bool = False) -> Tuple[bool, str, int]:
        """
        扣除用户积分
        
        Args:
            user_id: 用户ID
            amount: 扣除的积分数量（正数）
            reason: 扣除原因
            description: 详细描述
            related_id: 关联的业务ID
            force_deduct: 是否强制扣除（即使积分不足）
            
        Returns:
            Tuple[bool, str, int]: (是否成功, 错误信息, 扣除后余额)
        """
        if amount <= 0:
            return False, "扣除积分数量必须大于0", 0

        # 检查管理员权限（管理员免费使用）
        if self.is_admin_user(user_id):
            # 管理员不扣除积分，但记录使用历史
            user = self.db.query(User).filter(User.id == user_id).first()
            self._create_history_record(
                user_id=user_id,
                change_amount=0,  # 管理员不扣除积分
                balance_after=user.credits,
                reason=f"[管理员免费] {reason}",
                operation_type=CreditOperationType.CONSUMPTION,
                description=description,
                related_id=related_id
            )
            return True, "管理员免费使用", user.credits

        # 普通用户处理逻辑
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, "用户不存在", 0

        # 检查积分是否充足
        if not force_deduct and user.credits < amount:
            return False, f"积分不足，当前余额：{user.credits}，需要：{amount}", user.credits

        # 执行扣除
        old_balance = user.credits
        new_balance = max(0, user.credits - amount)  # 确保不会变成负数
        user.credits = new_balance

        # 记录历史
        actual_deducted = old_balance - new_balance
        self._create_history_record(
            user_id=user_id,
            change_amount=-actual_deducted,
            balance_after=new_balance,
            reason=reason,
            operation_type=CreditOperationType.CONSUMPTION,
            description=description,
            related_id=related_id
        )

        try:
            self.db.commit()
            return True, "积分扣除成功", new_balance
        except Exception as e:
            self.db.rollback()
            return False, f"积分扣除失败：{str(e)}", old_balance

    def add_credits(self, user_id: int, amount: int, reason: str,
                   description: Optional[str] = None,
                   related_id: Optional[str] = None,
                   operation_type: str = CreditOperationType.REWARD) -> Tuple[bool, str, int]:
        """
        增加用户积分
        
        Args:
            user_id: 用户ID
            amount: 增加的积分数量（正数）
            reason: 增加原因
            description: 详细描述
            related_id: 关联的业务ID
            operation_type: 操作类型
            
        Returns:
            Tuple[bool, str, int]: (是否成功, 错误信息, 增加后余额)
        """
        if amount <= 0:
            return False, "增加积分数量必须大于0", 0

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, "用户不存在", 0

        # 执行增加
        old_balance = user.credits
        new_balance = user.credits + amount
        user.credits = new_balance

        # 记录历史
        self._create_history_record(
            user_id=user_id,
            change_amount=amount,
            balance_after=new_balance,
            reason=reason,
            operation_type=operation_type,
            description=description,
            related_id=related_id
        )

        try:
            self.db.commit()
            return True, "积分增加成功", new_balance
        except Exception as e:
            self.db.rollback()
            return False, f"积分增加失败：{str(e)}", old_balance

    def get_credit_history(self, user_id: int, limit: int = 50, offset: int = 0) -> List[dict]:
        """
        获取用户积分变动历史
        
        Args:
            user_id: 用户ID
            limit: 返回记录数量限制
            offset: 偏移量
            
        Returns:
            List[dict]: 积分历史记录列表
        """
        history_records = (
            self.db.query(CreditHistory)
            .filter(CreditHistory.user_id == user_id)
            .order_by(desc(CreditHistory.created_at))
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        return [record.to_dict() for record in history_records]

    def get_credit_statistics(self, user_id: int) -> dict:
        """
        获取用户积分统计信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            dict: 积分统计信息
        """
        from sqlalchemy import func, and_
        from datetime import datetime, timedelta

        # 获取基础信息
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}

        # 计算今日消耗
        today = datetime.now().date()
        today_consumption = (
            self.db.query(func.sum(CreditHistory.change_amount))
            .filter(
                and_(
                    CreditHistory.user_id == user_id,
                    CreditHistory.operation_type == CreditOperationType.CONSUMPTION,
                    func.date(CreditHistory.created_at) == today
                )
            )
            .scalar() or 0
        )

        # 计算本月消耗
        month_start = datetime.now().replace(day=1).date()
        month_consumption = (
            self.db.query(func.sum(CreditHistory.change_amount))
            .filter(
                and_(
                    CreditHistory.user_id == user_id,
                    CreditHistory.operation_type == CreditOperationType.CONSUMPTION,
                    func.date(CreditHistory.created_at) >= month_start
                )
            )
            .scalar() or 0
        )

        # 计算总获得积分
        total_earned = (
            self.db.query(func.sum(CreditHistory.change_amount))
            .filter(
                and_(
                    CreditHistory.user_id == user_id,
                    CreditHistory.change_amount > 0
                )
            )
            .scalar() or 0
        )

        # 计算总消耗积分
        total_consumed = (
            self.db.query(func.sum(CreditHistory.change_amount))
            .filter(
                and_(
                    CreditHistory.user_id == user_id,
                    CreditHistory.change_amount < 0
                )
            )
            .scalar() or 0
        )

        return {
            "current_balance": user.credits,
            "today_consumption": abs(today_consumption),
            "month_consumption": abs(month_consumption),
            "total_earned": total_earned,
            "total_consumed": abs(total_consumed),
            "is_admin": user.is_superuser
        }

    def _create_history_record(self, user_id: int, change_amount: int, balance_after: int,
                              reason: str, operation_type: str,
                              description: Optional[str] = None,
                              related_id: Optional[str] = None):
        """
        创建积分变动历史记录
        
        Args:
            user_id: 用户ID
            change_amount: 积分变动数量
            balance_after: 变动后余额
            reason: 变动原因
            operation_type: 操作类型
            description: 详细描述
            related_id: 关联ID
        """
        history_record = CreditHistory.create_record(
            user_id=user_id,
            change_amount=change_amount,
            balance_after=balance_after,
            reason=reason,
            operation_type=operation_type,
            description=description,
            related_id=related_id
        )
        
        self.db.add(history_record)

    def estimate_credits_for_text(self, text: str) -> int:
        """
        估算文本处理所需的积分
        
        Args:
            text: 文本内容
            
        Returns:
            int: 估算的积分数量
        """
        if not text:
            return 0
        
        length = len(text)
        # 基础积分计算：每1000个字符消耗10积分
        base_credits = max(5, (length // 1000 + 1) * 10)
        return base_credits

    def estimate_credits_for_file(self, file_size: int, file_type: str) -> int:
        """
        估算文件处理所需的积分
        
        Args:
            file_size: 文件大小（字节）
            file_type: 文件类型
            
        Returns:
            int: 估算的积分数量
        """
        if file_size <= 0:
            return 0
        
        size_in_mb = file_size / (1024 * 1024)
        
        # 不同文件类型的处理复杂度不同
        multiplier = 1
        if 'pdf' in file_type.lower():
            multiplier = 2
        elif 'word' in file_type.lower() or 'docx' in file_type.lower():
            multiplier = 1.5
        
        # 基础积分：每MB消耗20积分
        base_credits = max(10, int(size_in_mb * 20 * multiplier))
        return base_credits


def get_credit_service(db: Session) -> CreditService:
    """
    获取积分服务实例
    
    Args:
        db: 数据库会话
        
    Returns:
        CreditService: 积分服务实例
    """
    return CreditService(db)