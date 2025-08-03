"""
积分系统增强测试脚本
测试新用户注册时的积分分配逻辑
"""

import os
import sys
from datetime import datetime
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import User, UserCredits, CreditTransaction, TransactionType
from app.services.credit_service import CreditService
from passlib.context import CryptContext


class CreditSystemTest:
    """积分系统测试类"""
    
    def __init__(self):
        self.engine = create_engine(settings.database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.test_users = []  # 存储测试创建的用户ID，用于清理
        
    def run_all_tests(self):
        """运行所有测试"""
        print("=" * 80)
        print("🧪 积分系统增强测试脚本")
        print("=" * 80)
        print(f"⏰ 测试开始时间: {datetime.now().isoformat()}")
        print()
        
        try:
            # 场景一：测试普通用户积分分配
            print("📋 场景一：测试普通用户积分分配")
            result1 = self.test_regular_user_credits()
            
            # 场景二：测试管理员用户积分分配
            print("\n📋 场景二：测试管理员用户积分分配")
            result2 = self.test_admin_user_credits()
            
            # 场景三：测试积分服务的其他功能
            print("\n📋 场景三：测试积分服务功能")
            result3 = self.test_credit_service_functions()
            
            # 总结测试结果
            print("\n" + "=" * 80)
            print("📊 测试结果总结")
            print("=" * 80)
            
            results = [result1, result2, result3]
            passed = sum(results)
            total = len(results)
            
            print(f"✅ 通过测试: {passed}/{total}")
            print(f"❌ 失败测试: {total - passed}/{total}")
            
            if passed == total:
                print("🎉 所有测试均通过！")
            else:
                print("⚠️  部分测试失败，请检查日志")
                
        except Exception as e:
            print(f"❌ 测试运行异常: {e}")
        finally:
            # 清理测试数据
            self.cleanup_test_data()
            print("\n🧹 测试数据清理完成")
            print("=" * 80)
    
    def test_regular_user_credits(self):
        """测试普通用户积分分配"""
        db = self.SessionLocal()
        
        try:
            print("  🔨 创建普通用户...")
            
            # 创建普通用户
            regular_user = User(
                email=f"testuser_{datetime.now().timestamp()}@test.com",
                password_hash=self.pwd_context.hash("test123"),
                display_name="测试普通用户",
                is_active=True,
                is_verified=True,
                is_superuser=False
            )
            
            db.add(regular_user)
            db.commit()
            db.refresh(regular_user)
            self.test_users.append(regular_user.id)
            
            print(f"  ✅ 普通用户创建成功: {regular_user.email} (ID: {regular_user.id})")
            
            # 为用户创建积分记录
            print("  🔨 创建积分记录...")
            credits = CreditService.create_initial_credits(db, regular_user)
            
            print(f"  ✅ 积分记录创建成功")
            
            # 验证积分余额
            print("  🔍 验证积分余额...")
            if credits.balance == 1000:
                print(f"  ✅ 普通用户积分验证通过: {credits.balance} 积分")
            else:
                print(f"  ❌ 普通用户积分验证失败: 期望 1000，实际 {credits.balance}")
                return False
            
            # 验证交易记录
            print("  🔍 验证交易记录...")
            transactions = CreditService.get_user_transactions(db, regular_user.id)
            
            if len(transactions) == 1:
                transaction = transactions[0]
                if (transaction.type == TransactionType.INITIAL_GRANT and 
                    transaction.amount == 1000 and
                    "新用户注册奖励" in transaction.description):
                    print(f"  ✅ 交易记录验证通过: {transaction.type.value}, {transaction.amount} 积分")
                else:
                    print(f"  ❌ 交易记录验证失败: {transaction.type.value}, {transaction.amount}")
                    return False
            else:
                print(f"  ❌ 交易记录数量错误: 期望 1，实际 {len(transactions)}")
                return False
            
            print("  🎉 普通用户测试完全通过！")
            return True
            
        except Exception as e:
            print(f"  ❌ 普通用户测试失败: {e}")
            return False
        finally:
            db.close()
    
    def test_admin_user_credits(self):
        """测试管理员用户积分分配"""
        db = self.SessionLocal()
        
        try:
            print("  🔨 创建管理员用户...")
            
            # 创建管理员用户
            admin_user = User(
                email=f"testadmin_{datetime.now().timestamp()}@test.com",
                password_hash=self.pwd_context.hash("test123"),
                display_name="测试管理员",
                is_active=True,
                is_verified=True,
                is_superuser=True  # 这是关键
            )
            
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            self.test_users.append(admin_user.id)
            
            print(f"  ✅ 管理员用户创建成功: {admin_user.email} (ID: {admin_user.id})")
            
            # 为用户创建积分记录
            print("  🔨 创建积分记录...")
            credits = CreditService.create_initial_credits(db, admin_user)
            
            print(f"  ✅ 积分记录创建成功")
            
            # 验证积分余额
            print("  🔍 验证积分余额...")
            if credits.balance == 999999:
                print(f"  ✅ 管理员积分验证通过: {credits.balance} 积分")
            else:
                print(f"  ❌ 管理员积分验证失败: 期望 999999，实际 {credits.balance}")
                return False
            
            # 验证交易记录
            print("  🔍 验证交易记录...")
            transactions = CreditService.get_user_transactions(db, admin_user.id)
            
            if len(transactions) == 1:
                transaction = transactions[0]
                if (transaction.type == TransactionType.INITIAL_GRANT and 
                    transaction.amount == 999999 and
                    "管理员初始积分" in transaction.description):
                    print(f"  ✅ 交易记录验证通过: {transaction.type.value}, {transaction.amount} 积分")
                else:
                    print(f"  ❌ 交易记录验证失败: {transaction.type.value}, {transaction.amount}")
                    return False
            else:
                print(f"  ❌ 交易记录数量错误: 期望 1，实际 {len(transactions)}")
                return False
            
            print("  🎉 管理员用户测试完全通过！")
            return True
            
        except Exception as e:
            print(f"  ❌ 管理员用户测试失败: {e}")
            return False
        finally:
            db.close()
    
    def test_credit_service_functions(self):
        """测试积分服务的其他功能"""
        db = self.SessionLocal()
        
        try:
            print("  🔨 创建测试用户用于积分操作...")
            
            # 创建测试用户
            test_user = User(
                email=f"credittest_{datetime.now().timestamp()}@test.com",
                password_hash=self.pwd_context.hash("test123"),
                display_name="积分测试用户",
                is_active=True,
                is_verified=True,
                is_superuser=False
            )
            
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            self.test_users.append(test_user.id)
            
            # 创建初始积分
            initial_credits = CreditService.create_initial_credits(db, test_user)
            print(f"  ✅ 初始积分: {initial_credits.balance}")
            
            # 测试积分扣除功能
            print("  🔍 测试积分扣除功能...")
            success, error, remaining = CreditService.deduct_credits(
                db, test_user.id, 500, "测试扣除"
            )
            
            if success and remaining == 500:
                print(f"  ✅ 积分扣除测试通过: 剩余 {remaining} 积分")
            else:
                print(f"  ❌ 积分扣除测试失败: success={success}, error={error}, remaining={remaining}")
                return False
            
            # 测试积分不足情况
            print("  🔍 测试积分不足情况...")
            success, error, remaining = CreditService.deduct_credits(
                db, test_user.id, 1000, "测试不足扣除"
            )
            
            if not success and "积分不足" in error:
                print(f"  ✅ 积分不足测试通过: {error}")
            else:
                print(f"  ❌ 积分不足测试失败: success={success}, error={error}")
                return False
            
            # 测试积分退还功能
            print("  🔍 测试积分退还功能...")
            success, error, new_balance = CreditService.refund_credits(
                db, test_user.id, 200, "测试退还"
            )
            
            if success and new_balance == 700:
                print(f"  ✅ 积分退还测试通过: 当前余额 {new_balance} 积分")
            else:
                print(f"  ❌ 积分退还测试失败: success={success}, error={error}, balance={new_balance}")
                return False
            
            # 验证交易记录数量
            print("  🔍 验证交易记录...")
            transactions = CreditService.get_user_transactions(db, test_user.id)
            
            if len(transactions) == 3:  # 初始+扣除+退还
                print(f"  ✅ 交易记录数量正确: {len(transactions)} 条")
                for i, tx in enumerate(transactions, 1):
                    print(f"    {i}. {tx.type.value}: {tx.amount} 积分 - {tx.description}")
            else:
                print(f"  ❌ 交易记录数量错误: 期望 3，实际 {len(transactions)}")
                return False
            
            print("  🎉 积分服务功能测试完全通过！")
            return True
            
        except Exception as e:
            print(f"  ❌ 积分服务功能测试失败: {e}")
            return False
        finally:
            db.close()
    
    def cleanup_test_data(self):
        """清理测试数据"""
        if not self.test_users:
            return
            
        db = self.SessionLocal()
        
        try:
            print(f"\n🧹 清理 {len(self.test_users)} 个测试用户的数据...")
            
            for user_id in self.test_users:
                # 删除积分交易记录
                db.query(CreditTransaction).filter(
                    CreditTransaction.user_id == user_id
                ).delete()
                
                # 删除积分记录
                db.query(UserCredits).filter(
                    UserCredits.user_id == user_id
                ).delete()
                
                # 删除用户
                db.query(User).filter(User.id == user_id).delete()
            
            db.commit()
            print("✅ 测试数据清理成功")
            
        except Exception as e:
            print(f"❌ 清理测试数据失败: {e}")
            db.rollback()
        finally:
            db.close()


def main():
    """主函数"""
    test_runner = CreditSystemTest()
    test_runner.run_all_tests()


if __name__ == "__main__":
    main()