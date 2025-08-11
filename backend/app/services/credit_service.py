"""
积分服务 - 处理用户积分相关的业务逻辑
"""

from sqlalchemy.orm import Session
from datetime import date, datetime
from app.models import User, UserCredits, CreditTransaction, TransactionType


class CreditService:
    """积分服务类"""
    
    @staticmethod
    def create_initial_credits(db: Session, user: User) -> UserCredits:
        """
        为新用户创建初始积分记录
        
        Args:
            db: 数据库会话
            user: 用户对象
            
        Returns:
            UserCredits: 创建的积分记录
        """
        try:
            # 根据用户角色确定初始积分
            if user.is_superuser:
                # 管理员用户
                balance = 999999
                description = "管理员初始积分"
                transaction_type = TransactionType.INITIAL_GRANT
            else:
                # 普通用户
                balance = 1000
                description = "新用户注册奖励"
                transaction_type = TransactionType.INITIAL_GRANT
            
            # 创建用户积分记录
            user_credits = UserCredits(
                user_id=user.id,
                balance=balance,
                last_daily_reward_date=None  # 明确设置为None，表示从未领取过每日奖励
            )
            db.add(user_credits)
            
            # 创建交易记录
            transaction = CreditTransaction(
                user_id=user.id,
                type=transaction_type,
                amount=balance,
                description=description
            )
            db.add(transaction)
            
            # 提交事务
            db.commit()
            db.refresh(user_credits)
            
            return user_credits
            
        except Exception as e:
            db.rollback()
            raise Exception(f"创建初始积分失败: {str(e)}")
    
    @staticmethod
    def get_user_credits(db: Session, user_id: int) -> UserCredits:
        """
        获取用户积分信息
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            
        Returns:
            UserCredits: 用户积分记录，如果不存在则返回None
        """
        try:
            return db.query(UserCredits).filter(UserCredits.user_id == user_id).first()
        except Exception as e:
            # 如果查询失败（例如字段缺失），记录错误但返回None
            print(f"⚠️ 获取用户积分时出错: {e}")
            return None
    
    @staticmethod
    def get_user_transactions(db: Session, user_id: int, page: int = 1, limit: int = 20) -> tuple:
        """
        获取用户的积分交易记录（支持分页）
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            page: 页码（从1开始）
            limit: 每页记录数限制
            
        Returns:
            tuple: (交易记录列表, 总记录数, 总页数)
        """
        # 计算偏移量
        offset = (page - 1) * limit
        
        # 查询总记录数
        total_count = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id
        ).count()
        
        # 计算总页数
        total_pages = (total_count + limit - 1) // limit
        
        # 查询当前页的记录
        transactions = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id
        ).order_by(
            CreditTransaction.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return transactions, total_count, total_pages
    
    @staticmethod
    def deduct_credits(db: Session, user_id: int, amount: int, description: str) -> tuple:
        """
        扣除用户积分
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            amount: 扣除数量（正数）
            description: 扣除描述
            
        Returns:
            tuple: (是否成功, 错误信息或None, 剩余积分)
        """
        try:
            # 获取用户积分记录（加锁）
            user_credits = db.query(UserCredits).filter(
                UserCredits.user_id == user_id
            ).with_for_update().first()
            
            if not user_credits:
                return False, "用户积分记录不存在", 0
            
            # 检查余额是否充足
            if user_credits.balance < amount:
                return False, f"积分不足，当前余额: {user_credits.balance}，需要: {amount}", user_credits.balance
            
            # 扣除积分
            user_credits.balance -= amount
            
            # 创建交易记录
            transaction = CreditTransaction(
                user_id=user_id,
                type=TransactionType.DEDUCTION,
                amount=amount,
                description=description
            )
            db.add(transaction)
            
            # 提交事务
            db.commit()
            db.refresh(user_credits)
            
            return True, None, user_credits.balance
            
        except Exception as e:
            db.rollback()
            return False, f"扣除积分失败: {str(e)}", 0
    
    @staticmethod 
    def refund_credits(db: Session, user_id: int, amount: int, description: str) -> tuple:
        """
        退还用户积分
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            amount: 退还数量（正数）
            description: 退还描述
            
        Returns:
            tuple: (是否成功, 错误信息或None, 当前积分)
        """
        try:
            # 获取用户积分记录
            user_credits = db.query(UserCredits).filter(
                UserCredits.user_id == user_id
            ).first()
            
            if not user_credits:
                return False, "用户积分记录不存在", 0
            
            # 增加积分
            user_credits.balance += amount
            
            # 创建交易记录
            # 根据描述判断常见来源，设置更贴近的类型
            tx_type = TransactionType.REFUND
            lower_desc = (description or '').lower()
            if '邀请' in description:
                tx_type = TransactionType.REFUND
            transaction = CreditTransaction(
                user_id=user_id,
                type=tx_type,
                amount=amount,
                description=description
            )
            db.add(transaction)
            
            # 提交事务
            db.commit()
            db.refresh(user_credits)
            
            return True, None, user_credits.balance
            
        except Exception as e:
            db.rollback()
            return False, f"退还积分失败: {str(e)}", 0
    
    @staticmethod
    def grant_daily_reward_if_eligible(db: Session, user_id: int) -> bool:
        """
        检查用户今日是否已领取奖励，如未领取则发放每日奖励
        
        核心逻辑：
        1. 获取当前UTC日期
        2. 检查用户的 last_daily_reward_date
        3. 如果为空或小于今天，则发放奖励并更新日期
        4. 返回是否成功发放了奖励
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            
        Returns:
            bool: True=成功发放了奖励, False=今天已领取或发放失败
        """
        try:
            # 获取当前UTC日期
            current_date = date.today()
            
            # 获取用户积分记录（加锁确保原子性）
            user_credits = db.query(UserCredits).filter(
                UserCredits.user_id == user_id
            ).with_for_update().first()
            
            if not user_credits:
                print(f"⚠️ 用户 {user_id} 的积分记录不存在")
                return False
            
            # 检查用户今天是否已经领取过奖励
            if (hasattr(user_credits, 'last_daily_reward_date') and 
                user_credits.last_daily_reward_date is not None and 
                user_credits.last_daily_reward_date >= current_date):
                # 今天已经领取过，不重复发放
                return False
            
            # 执行奖励发放事务
            daily_reward_amount = 10
            
            # 增加积分
            user_credits.balance += daily_reward_amount
            
            # 更新最后奖励日期
            user_credits.last_daily_reward_date = current_date
            
            # 创建交易记录
            transaction = CreditTransaction(
                user_id=user_id,
                type=TransactionType.DAILY_REWARD,
                amount=daily_reward_amount,
                description="每日登录奖励"
            )
            db.add(transaction)
            
            # 提交事务
            db.commit()
            db.refresh(user_credits)
            
            print(f"✅ 用户 {user_id} 获得每日奖励 {daily_reward_amount} 积分，当前余额: {user_credits.balance}")
            return True
            
        except Exception as e:
            db.rollback()
            print(f"❌ 为用户 {user_id} 发放每日奖励失败: {str(e)}")
            return False