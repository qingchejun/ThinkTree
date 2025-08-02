"""
用户认证 API 路由
"""

import random
import string
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request as StarletteRequest

from ..core.database import get_db
from ..core.config import settings
from ..models.user import User
from ..models.invitation import InvitationCode
from ..models.login_token import LoginToken
from ..services.credit_service import CreditService
from ..utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_user_id_from_token,
    validate_email,
    validate_password,
    get_password_strength
)
from ..utils.email_service import email_service
from ..utils.invitation_utils import validate_invitation_code, use_invitation_code
from ..utils.recaptcha import verify_recaptcha_with_action, is_recaptcha_enabled

router = APIRouter()
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)


# ... (existing admin endpoints remain unchanged)
@router.post("/admin-verify")
async def admin_verify_direct(request: dict, db: Session = Depends(get_db)):
    """
    直接验证管理员账户并设置管理员权限（仅用于初始化）
    """
    # 获取要设置为管理员的邮箱
    email = request.get("email", "admin@thinktree.com")
    
    # 查找管理员用户
    admin_user = db.query(User).filter(User.email == email).first()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="管理员账户不存在"
        )
    
    # 检查当前状态
    was_verified = admin_user.is_verified
    was_superuser = admin_user.is_superuser
    
    # 设置为管理员并验证
    admin_user.is_verified = True
    admin_user.is_superuser = True
    admin_user.is_active = True
    db.commit()
    
    status_messages = []
    if not was_verified:
        status_messages.append("账户已验证")
    if not was_superuser:
        status_messages.append("已设置为管理员")
    
    if status_messages:
        message = f"管理员账户更新成功: {', '.join(status_messages)}"
    else:
        message = "管理员账户已经是完整的管理员状态"
    
    return {
        "success": True, 
        "message": message,
        "is_superuser": admin_user.is_superuser,
        "is_verified": admin_user.is_verified,
        "is_active": admin_user.is_active
    }


@router.post("/admin-reset-password")
async def admin_reset_password_direct(request: dict, db: Session = Depends(get_db)):
    """
    直接重置管理员密码（仅用于管理员账户恢复）
    """
    new_password = request.get("new_password")
    if not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供新密码"
        )
    
    # 密码强度验证
    is_valid, error_message = validate_password(new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # 查找管理员用户
    admin_user = db.query(User).filter(User.email == "admin@thinktree.com").first()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="管理员账户不存在"
        )
    
    # 重置密码
    admin_user.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {
        "success": True,
        "message": "管理员密码重置成功",
        "email": admin_user.email
    }



# Pydantic 模型用于请求验证
class UserRegister(BaseModel):
    """用户注册请求模型"""
    email: EmailStr
    password: str
    invitation_code: str
    display_name: Optional[str] = None
    recaptcha_token: Optional[str] = None


class UserLogin(BaseModel):
    """用户登录请求模型"""
    email: EmailStr
    password: str


class InitiateLoginRequest(BaseModel):
    """发起登录请求模型"""
    email: EmailStr

class InitiateLoginResponse(BaseModel):
    """发起登录响应模型"""
    success: bool
    message: str

class VerifyCodeRequest(BaseModel):
    """验证码验证请求模型"""
    email: EmailStr
    code: str

class UserResponse(BaseModel):
    """用户响应模型"""
    id: int
    email: str
    display_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: str
    credits: int = 100  # 临时保留
    invitation_quota: int = 10  # 临时保留


class TokenResponse(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str
    user: UserResponse
    daily_reward_granted: Optional[bool] = False  # 是否发放了每日奖励


class VerifyEmailRequest(BaseModel):
    """邮箱验证请求模型"""
    token: str


class VerifyEmailResponse(BaseModel):
    """邮箱验证响应模型"""
    success: bool
    message: str
    user: Optional[UserResponse] = None


class PasswordResetRequest(BaseModel):
    """密码重置请求模型"""
    email: EmailStr


class PasswordResetExecute(BaseModel):
    """密码重置执行模型"""
    token: str
    new_password: str


class PasswordResetResponse(BaseModel):
    """密码重置响应模型"""
    success: bool
    message: str


class PasswordStrengthRequest(BaseModel):
    """密码强度检查请求模型"""
    password: str


class PasswordStrengthResponse(BaseModel):
    """密码强度检查响应模型"""
    length: bool
    has_uppercase: bool
    has_lowercase: bool
    has_numbers: bool
    has_special: bool
    is_valid: bool
    strength_level: str


class CreditTransactionResponse(BaseModel):
    """积分交易记录响应模型"""
    id: int
    type: str
    amount: int
    description: str
    created_at: str
    
    @classmethod
    def from_transaction(cls, transaction):
        """从CreditTransaction对象创建响应模型"""
        return cls(
            id=transaction.id,
            type=transaction.type.value,
            amount=transaction.amount,
            description=transaction.description,
            created_at=transaction.created_at.isoformat()
        )


class CreditHistoryResponse(BaseModel):
    """积分历史响应模型"""
    success: bool
    data: List[CreditTransactionResponse]
    pagination: dict
    current_balance: int


class PasswordUpdateRequest(BaseModel):
    """密码更新请求模型"""
    current_password: str
    new_password: str
    confirm_password: str


class PasswordUpdateResponse(BaseModel):
    """密码更新响应模型"""
    success: bool
    message: str


class UserProfileUpdateRequest(BaseModel):
    """用户资料更新请求模型"""
    display_name: Optional[str] = None
    
    class Config:
        # 允许额外字段，防止前端传递未知字段时报错
        extra = "ignore"


class UserProfileUpdateResponse(BaseModel):
    """用户资料更新响应模型"""
    success: bool
    message: str
    user: "UserProfileResponse"


# 依赖注入：获取当前用户
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    从 JWT 令牌获取当前用户
    """
    token = credentials.credentials
    user_id = get_user_id_from_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的访问令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户账户已被禁用",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


class RegisterResponse(BaseModel):
    """注册响应模型"""
    success: bool
    message: str
    user_id: Optional[int] = None
    email: str
    daily_reward_granted: Optional[bool] = False  # 是否发放了每日奖励


@router.post("/register", response_model=RegisterResponse)
@limiter.limit("10/minute")
async def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    """
    用户注册 - 需要邀请码，注册后发送验证邮件
    """
    # ... (existing register endpoint remains unchanged)
    # reCAPTCHA验证 (如果启用)
    if is_recaptcha_enabled():
        is_valid, error_msg, score = await verify_recaptcha_with_action(
            user_data.recaptcha_token, 
            "register"
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"人机验证失败: {error_msg}"
            )
    
    # 邮箱格式验证（Pydantic EmailStr 已处理）
    if not validate_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱格式无效"
        )
    
    # 密码强度验证
    is_valid, error_message = validate_password(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # 验证邀请码
    is_code_valid, code_error, invitation = validate_invitation_code(db, user_data.invitation_code)
    if not is_code_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"邀请码无效: {code_error}"
        )
    
    # 检查邮箱是否已存在
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )
    
    try:
        # 创建新用户 (未验证状态)
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            display_name=user_data.display_name,
            is_active=True,
            is_verified=False  # 需要邮箱验证
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # 为新用户创建初始积分记录
        try:
            CreditService.create_initial_credits(db, new_user)
        except Exception as credit_error:
            # 积分创建失败不影响用户注册，但要记录日志
            print(f"为用户 {new_user.email} 创建初始积分失败: {credit_error}")
        
        # 为新用户发放首次每日奖励
        daily_reward_granted = False
        try:
            daily_reward_granted = CreditService.grant_daily_reward_if_eligible(db, new_user.id)
            if daily_reward_granted:
                print(f"新用户 {new_user.email} 获得首次每日奖励10积分")
        except Exception as reward_error:
            # 奖励发放失败不影响用户注册，但要记录日志
            print(f"为新用户 {new_user.email} 发放每日奖励失败: {reward_error}")
            daily_reward_granted = False
        
        # 标记邀请码为已使用
        use_invitation_code(db, user_data.invitation_code, new_user.id)
        
        # 发送验证邮件
        email_sent = await email_service.send_verification_email(
            email=new_user.email,
            user_name=new_user.display_name
        )
        
        if not email_sent:
            # 邮件发送失败，但用户已创建，给出提示
            message = "注册成功，但验证邮件发送失败。请联系客服获取帮助。"
            if daily_reward_granted:
                message += " 每日登录奖励 +10 积分！🎉"
            return RegisterResponse(
                success=True,
                message=message,
                user_id=new_user.id,
                email=new_user.email,
                daily_reward_granted=daily_reward_granted
            )
        
        message = "注册成功！请检查邮箱并点击验证链接完成账户激活。"
        if daily_reward_granted:
            message += " 每日登录奖励 +10 积分！🎉"
        
        return RegisterResponse(
            success=True,
            message=message,
            user_id=new_user.id,
            email=new_user.email,
            daily_reward_granted=daily_reward_granted
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    """
    用户登录
    """
    # ... (existing login endpoint remains unchanged)
    # 查找用户
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    # 验证密码
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    # 检查用户状态
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户账户已被禁用"
        )
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # 检查并发放每日奖励
    daily_reward_granted = False
    try:
        from app.services.credit_service import CreditService
        
        # 检查并发放每日奖励
        daily_reward_granted = CreditService.grant_daily_reward_if_eligible(db, user.id)
        
        # 获取当前积分余额
        user_credits_record = CreditService.get_user_credits(db, user.id)
        credits_balance = user_credits_record.balance if user_credits_record else 0
        
    except Exception as e:
        # 如果每日奖励或积分查询失败，使用默认值0，不影响登录
        print(f"登录时处理每日奖励失败: {str(e)}")
        credits_balance = 0
        daily_reward_granted = False
    
    # 构造响应
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
        created_at=user.created_at.isoformat(),
        credits=credits_balance,
        invitation_quota=user.invitation_quota
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
        daily_reward_granted=daily_reward_granted
    )


# ===================================================================
# ==================== 邮箱验证码登录 (新功能) =======================
# ===================================================================
async def _send_login_code_email(email: str, code: str, magic_token: str = None):
    """
    发送登录验证码邮件的辅助函数
    """
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">ThinkSo 登录验证</h2>
        <p>您好！</p>
        <p>您正在使用邮箱登录 ThinkSo。您的验证码是：</p>
        <div style="text-align: center; font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
            {code}
        </div>
        <p>此验证码 <strong>10 分钟内</strong> 有效。请勿将此验证码泄露给他人。</p>
        <p>如果您没有请求登录，请忽略此邮件。</p>
        <hr>
        <p style="text-align: center; font-size: 12px; color: #888;">ThinkSo 团队</p>
    </div>
    """
    
    # 如果有魔法链接令牌，添加魔法链接
    if magic_token:
        magic_link_url = f"{settings.frontend_url}/auth/magic-link?token={magic_token}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #333;">ThinkSo 登录验证</h2>
            <p>您好！</p>
            <p>您正在使用邮箱登录 ThinkSo。您的验证码是：</p>
            <div style="text-align: center; font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                {code}
            </div>
            <p>此验证码 <strong>10 分钟内</strong> 有效。请勿将此验证码泄露给他人。</p>
            <p>您也可以点击下面的链接直接登录：</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="{magic_link_url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">登录到 ThinkSo</a>
            </div>
            <p>如果您没有请求登录，请忽略此邮件。</p>
            <hr>
            <p style="text-align: center; font-size: 12px; color: #888;">ThinkSo 团队</p>
        </div>
        """
    
    message = {
        "subject": f"您的 ThinkSo 登录验证码是 {code}",
        "recipients": [email],
        "body": html_content,
        "subtype": "html"
    }
    
    from ..utils.email_service import email_service
    await email_service.fm.send_message(message)

@router.post("/initiate-login", response_model=InitiateLoginResponse)
@limiter.limit("5/minute")
async def initiate_login(request: Request, data: InitiateLoginRequest, db: Session = Depends(get_db)):
    """
    发起邮箱验证码登录流程，发送验证码邮件。
    """
    # 1. 生成6位随机数字验证码
    code = "".join(random.choices(string.digits, k=6))
    
    # 2. 生成唯一的魔法链接令牌
    magic_token = str(uuid.uuid4())
    
    # 3. 对验证码进行哈希处理
    code_hash = get_password_hash(code)
    
    # 4. 设置过期时间（10分钟后）
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # 5. 创建并存储登录令牌记录
    login_token = LoginToken(
        email=data.email,
        code_hash=code_hash,
        magic_token=magic_token,
        expires_at=expires_at
    )
    db.add(login_token)
    db.commit()
    
    # 6. 发送邮件
    try:
        print(f"准备向 {data.email} 发送验证码邮件")
        await _send_login_code_email(data.email, code, magic_token)
        print(f"验证码邮件发送成功到 {data.email}")
    except Exception as e:
        # 即便邮件发送失败，为了不暴露邮箱是否存在，也返回成功
        # 但在服务器端记录严重错误
        print(f"CRITICAL: Failed to send login code email to {data.email}: {e}")
        import traceback
        print(f"邮件发送异常详情: {traceback.format_exc()}")

    return InitiateLoginResponse(success=True, message="如果您的邮箱已注册，验证码已发送。")


@router.post("/verify-code", response_model=TokenResponse)
@limiter.limit("10/minute")
async def verify_code(request: Request, data: VerifyCodeRequest, db: Session = Depends(get_db)):
    """
    使用邮箱和验证码完成登录。
    """
    now = datetime.now(timezone.utc)

    # a. 在login_tokens表中查找匹配的、最新的、未使用的、未过期的记录
    login_token = db.query(LoginToken).filter(
        LoginToken.email == data.email,
        LoginToken.used_at.is_(None),
        LoginToken.expires_at > now
    ).order_by(desc(LoginToken.created_at)).first()

    if not login_token:
        raise HTTPException(status_code=400, detail="验证码无效或已过期")

    # b. 验证用户提交的code与数据库中的code_hash是否匹配
    if not verify_password(data.code, login_token.code_hash):
        # 为防止暴力破解，即使验证码错误，也将此token标记为已使用
        login_token.used_at = now
        db.commit()
        raise HTTPException(status_code=400, detail="验证码错误")

    # c. 验证通过
    # i. 将该token标记为已使用
    login_token.used_at = now
    
    # ii. 在users表中查找或创建新用户
    user = db.query(User).filter(User.email == data.email).first()
    daily_reward_granted = False

    if not user:
        # 创建新用户
        new_user = User(
            email=data.email,
            is_active=True,
            is_verified=True, # 通过邮箱验证码登录的用户，邮箱视为已验证
            display_name=data.email.split('@')[0]
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
        
        # 为新用户创建积分和每日奖励
        try:
            CreditService.create_initial_credits(db, user)
            daily_reward_granted = CreditService.grant_daily_reward_if_eligible(db, user.id)
        except Exception as e:
            print(f"Failed to create credits for new user {user.email}: {e}")
            # 不影响登录流程
    else:
        # 如果是现有用户，检查并发放每日奖励
        try:
            daily_reward_granted = CreditService.grant_daily_reward_if_eligible(db, user.id)
        except Exception as e:
            print(f"Failed to grant daily reward for user {user.email}: {e}")

    db.commit()
    
    # iii. 生成JWT登录凭证并返回
    access_token = create_access_token(data={"sub": str(user.id)})
    
    user_credits_record = CreditService.get_user_credits(db, user.id)
    credits_balance = user_credits_record.balance if user_credits_record else 0

    user_response = UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
        created_at=user.created_at.isoformat(),
        credits=credits_balance,
        invitation_quota=user.invitation_quota
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
        daily_reward_granted=daily_reward_granted
    )

# ===================================================================
# ======================== 现有路由 (部分) ==========================
# ===================================================================

class UserProfileResponse(BaseModel):
    """用户详细资料响应模型 - 包含积分余额和邀请码使用统计"""
    id: int
    email: str
    display_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: str
    credits: int = 0  # 用户积分余额（来自UserCredits表）
    invitation_quota: int = 10  # 邀请码配额
    invitation_used: int = 0  # 已使用的邀请码数量
    invitation_remaining: int = 10  # 剩余邀请码配额
    daily_reward_granted: Optional[bool] = False  # 是否发放了每日奖励


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    获取当前用户信息 - 包含邀请码配额信息
    """
    # ... (existing profile endpoint remains unchanged)
    # 计算已使用的邀请码数量
    invitation_used = 0
    try:
        invitation_used = db.query(InvitationCode).filter(
            InvitationCode.generated_by_user_id == current_user.id
        ).count()
    except Exception as e:
        # 如果查询失败（表不存在等），使用默认值0
        invitation_used = 0
    
    # 计算剩余邀请配额
    invitation_remaining = max(0, current_user.invitation_quota - invitation_used)
    
    # 【关键】检查并发放每日奖励 - 确保用户任何活动都能触发
    daily_reward_granted = False
    try:
        from app.services.credit_service import CreditService
        # 检查并发放每日奖励
        daily_reward_granted = CreditService.grant_daily_reward_if_eligible(db, current_user.id)
        
        # 获取用户积分余额
        user_credits_record = CreditService.get_user_credits(db, current_user.id)
        credits_balance = user_credits_record.balance if user_credits_record else 0
    except Exception as e:
        # 如果积分查询失败，使用默认值0，不影响用户信息获取
        print(f"获取用户 {current_user.id} 积分或处理每日奖励失败: {e}")
        credits_balance = 0
        daily_reward_granted = False
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_superuser=current_user.is_superuser,
        created_at=current_user.created_at.isoformat(),
        credits=credits_balance,
        invitation_quota=current_user.invitation_quota,
        invitation_used=invitation_used,
        invitation_remaining=invitation_remaining,
        daily_reward_granted=daily_reward_granted
    )


@router.put("/profile", response_model=UserProfileUpdateResponse)
async def update_profile(
    request: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新用户资料信息
    """
    # ... (existing update_profile endpoint remains unchanged)
    try:
        # 调试日志：记录接收到的请求数据
        print(f"🔍 收到用户资料更新请求: {request.dict()}")
        print(f"🔍 当前用户: {current_user.email}, display_name: {current_user.display_name}")
        # 记录修改前的值
        old_display_name = current_user.display_name
        changes = []
        
        # 更新显示名称
        if request.display_name is not None:
            # 验证显示名称长度
            if len(request.display_name.strip()) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="显示名称不能为空"
                )
            
            if len(request.display_name) > 50:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="显示名称不能超过50个字符"
                )
            
            new_display_name = request.display_name.strip()
            if new_display_name != old_display_name:
                current_user.display_name = new_display_name
                changes.append(f"显示名称: {old_display_name} -> {current_user.display_name}")
        
        # 如果没有任何更改，也允许请求成功（可能是头像更换等前端操作）
        if not changes:
            changes.append("保持现有设置")
        
        # 保存更改
        db.commit()
        db.refresh(current_user)
        
        # 重新计算邀请码统计
        invitation_used = 0
        try:
            invitation_used = db.query(InvitationCode).filter(
                InvitationCode.generated_by_user_id == current_user.id
            ).count()
        except Exception:
            invitation_used = 0
        
        invitation_remaining = max(0, current_user.invitation_quota - invitation_used)
        
        # 获取用户积分余额
        try:
            user_credits_record = CreditService.get_user_credits(db, current_user.id)
            credits_balance = user_credits_record.balance if user_credits_record else 0
        except Exception as e:
            print(f"获取用户积分失败: {e}")
            credits_balance = 0
        
        # 构造更新后的用户信息
        updated_user = UserProfileResponse(
            id=current_user.id,
            email=current_user.email,
            display_name=current_user.display_name,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            is_superuser=current_user.is_superuser,
            created_at=current_user.created_at.isoformat(),
            credits=credits_balance,
            invitation_quota=current_user.invitation_quota,
            invitation_used=invitation_used,
            invitation_remaining=invitation_remaining
        )
        
        return UserProfileUpdateResponse(
            success=True,
            message=f"用户资料更新成功: {', '.join(changes)}",
            user=updated_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新用户资料失败: {str(e)}"
        )


# ... (The rest of the file remains the same)
@router.get("/verify-token")
async def verify_token(current_user: User = Depends(get_current_user)):
    """
    验证访问令牌有效性
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email
    }


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    验证邮箱地址
    """
    try:
        # 验证令牌并获取邮箱
        email = email_service.verify_verification_token(request.token)
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="验证令牌无效或已过期"
            )
        
        # 查找用户
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 检查是否已经验证过
        if user.is_verified:
            user_response = UserResponse(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                is_superuser=user.is_superuser,
                created_at=user.created_at.isoformat(),
                credits=user.credits,
                invitation_quota=user.invitation_quota
            )
            
            return VerifyEmailResponse(
                success=True,
                message="邮箱已经验证过了",
                user=user_response
            )
        
        # 标记为已验证
        user.is_verified = True
        db.commit()
        db.refresh(user)
        
        # 发送欢迎邮件
        try:
            await email_service.send_welcome_email(
                email=user.email,
                user_name=user.display_name
            )
        except Exception as e:
            print(f"发送欢迎邮件失败: {str(e)}")
            # 不因为欢迎邮件失败而影响验证结果
        
        # 构造响应
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_superuser=user.is_superuser,
            created_at=user.created_at.isoformat(),
            credits=user.credits,
            invitation_quota=user.invitation_quota
        )
        
        return VerifyEmailResponse(
            success=True,
            message="邮箱验证成功！欢迎加入 ThinkSo！",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"邮箱验证失败: {str(e)}"
        )


@router.post("/request-password-reset", response_model=PasswordResetResponse)
@limiter.limit("10/minute")
async def request_password_reset(
    request: Request,
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    请求密码重置 - 发送重置链接到用户邮箱 (WITH DEBUG LOGGING)
    """
    import traceback
    import logging
    
    # 配置详细日志
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    
    try:
        logger.info(f"🔍 DEBUG: 开始处理密码重置请求 - 邮箱: {reset_request.email}")
        
        # 查找用户
        logger.info(f"🔍 DEBUG: 正在查询数据库中的用户...")
        user = db.query(User).filter(User.email == reset_request.email).first()
        
        # 防止邮箱枚举攻击：无论邮箱是否存在都返回成功
        if not user:
            logger.info(f"🔍 DEBUG: 用户不存在，返回通用成功消息 (防枚举)")
            return PasswordResetResponse(
                success=True,
                message="如果该邮箱已注册，您将收到密码重置链接。请检查您的邮箱（包括垃圾邮件文件夹）。"
            )
        
        logger.info(f"🔍 DEBUG: 找到用户 - ID: {user.id}, 验证状态: {user.is_verified}, 激活状态: {user.is_active}")
        
        # 检查用户是否已验证邮箱
        if not user.is_verified:
            logger.info(f"🔍 DEBUG: 用户未验证邮箱，返回通用成功消息")
            return PasswordResetResponse(
                success=True,
                message="如果该邮箱已注册，您将收到密码重置链接。请检查您的邮箱（包括垃圾邮件文件夹）。"
            )
        
        # 检查用户是否激活
        if not user.is_active:
            logger.info(f"🔍 DEBUG: 用户未激活，返回通用成功消息")
            return PasswordResetResponse(
                success=True,
                message="如果该邮箱已注册，您将收到密码重置链接。请检查您的邮箱（包括垃圾邮件文件夹）。"
            )
        
        # 生成密码重置令牌（15分钟有效期）
        logger.info(f"🔍 DEBUG: 正在生成密码重置令牌...")
        from datetime import timedelta, datetime
        try:
            reset_token = create_access_token(
                data={"sub": str(user.id), "type": "password_reset"},
                expires_delta=timedelta(minutes=15)
            )
            logger.info(f"🔍 DEBUG: JWT令牌生成成功，长度: {len(reset_token)}")
        except Exception as token_error:
            logger.error(f"❌ DEBUG: JWT令牌生成失败: {str(token_error)}")
            logger.error(f"❌ DEBUG: JWT令牌生成异常详情: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"令牌生成失败: {str(token_error)}"
            )
        
        # 构建重置链接
        reset_link = f"https://thinkso.io/reset-password?token={reset_token}"
        logger.info(f"🔍 DEBUG: 重置链接构建完成: {reset_link[:50]}...")
        
        # 发送密码重置邮件
        logger.info(f"🔍 DEBUG: 开始发送密码重置邮件...")
        logger.info(f"🔍 DEBUG: 邮件服务实例类型: {type(email_service)}")
        
        try:
            logger.info(f"🔍 DEBUG: 调用邮件服务 send_password_reset_email...")
            email_sent = await email_service.send_password_reset_email(
                email=user.email,
                user_name=user.display_name or user.email.split('@')[0],
                reset_link=reset_link
            )
            logger.info(f"🔍 DEBUG: 邮件服务返回结果: {email_sent}")
            
            if email_sent:
                logger.info(f"✅ DEBUG: 密码重置邮件发送成功到: {user.email}")
            else:
                # 邮件发送失败，但不阻止用户，记录详细信息供手动处理
                logger.error(f"❌ DEBUG: 邮件发送失败，记录重置请求供手动处理")
                logger.error(f"📝 MANUAL RESET NEEDED: 用户 {user.email} (ID: {user.id}) 请求密码重置")
                logger.error(f"📝 RESET LINK: {reset_link}")
                logger.error(f"📝 TIMESTAMP: {datetime.now().isoformat()}")
                
                # 暂时返回成功，避免用户看到错误（邮件问题是后端配置问题）
                logger.info(f"💡 DEBUG: 返回成功响应，避免暴露内部配置问题")
                
        except HTTPException as http_exc:
            logger.error(f"❌ DEBUG: HTTP异常: {http_exc.detail}")
            raise
        except Exception as email_error:
            logger.error(f"❌ DEBUG: 邮件发送异常: {str(email_error)}")
            logger.error(f"❌ DEBUG: 邮件发送异常详情: {traceback.format_exc()}")
            
            # 记录手动处理信息
            logger.error(f"📝 MANUAL RESET NEEDED: 用户 {user.email} (ID: {user.id}) 请求密码重置")
            logger.error(f"📝 RESET LINK: {reset_link}")
            logger.error(f"📝 TIMESTAMP: {datetime.now().isoformat()}")
            logger.error(f"📝 ERROR: {str(email_error)}")
            
            # 暂时返回成功，避免暴露内部错误
            logger.info(f"💡 DEBUG: 返回成功响应，避免暴露内部配置问题")
        
        logger.info(f"✅ DEBUG: 密码重置请求处理完成")
        return PasswordResetResponse(
            success=True,
            message="如果该邮箱已注册，您将收到密码重置链接。请检查您的邮箱（包括垃圾邮件文件夹）。"
        )
        
    except HTTPException as http_exc:
        logger.error(f"❌ DEBUG: HTTP异常被重新抛出: {http_exc.detail}")
        raise
    except Exception as e:
        logger.error(f"❌ DEBUG: 顶层异常捕获: {str(e)}")
        logger.error(f"❌ DEBUG: 顶层异常详情: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"请求处理失败: {str(e)}"
        )


@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    request: PasswordResetExecute,
    db: Session = Depends(get_db)
):
    """
    执行密码重置 - 使用重置令牌更新用户密码
    """
    try:
        # 验证令牌
        from ..utils.security import verify_token
        payload = verify_token(request.token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="重置链接无效或已过期"
            )
        
        # 检查令牌类型
        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="重置链接无效"
            )
        
        # 获取用户ID
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="重置链接无效"
            )
        
        try:
            user_id = int(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="重置链接无效"
            )
        
        # 查找用户
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户不存在"
            )
        
        # 检查用户状态
        if not user.is_active or not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="账户状态异常"
            )
        
        # 密码强度验证
        is_valid, error_message = validate_password(request.new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # 更新密码
        user.password_hash = get_password_hash(request.new_password)
        db.commit()
        
        return PasswordResetResponse(
            success=True,
            message="密码重置成功！您现在可以使用新密码登录了。"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"密码重置失败: {str(e)}"
        )


@router.post("/check-password-strength", response_model=PasswordStrengthResponse)
async def check_password_strength(request: PasswordStrengthRequest):
    """
    检查密码强度 - 供前端实时验证使用
    """
    strength_info = get_password_strength(request.password)
    
    return PasswordStrengthResponse(
        length=strength_info["length"],
        has_uppercase=strength_info["has_uppercase"],
        has_lowercase=strength_info["has_lowercase"],
        has_numbers=strength_info["has_numbers"],
        has_special=strength_info["has_special"],
        is_valid=strength_info["is_valid"],
        strength_level=strength_info["strength_level"],
        score=strength_info["score"]
    )


@router.post("/admin/verify-early-user")
async def verify_early_user(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    管理员功能：手动验证早期注册用户（邮箱验证功能之前的用户）
    需要提供邮箱地址
    """
    email = request.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供邮箱地址"
        )
    
    # 查找用户
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 检查是否已经验证
    if user.is_verified:
        return {
            "success": True,
            "message": f"用户 {email} 已经是验证状态",
            "was_already_verified": True
        }
    
    # 手动设置为已验证
    user.is_verified = True
    db.commit()
    
    return {
        "success": True,
        "message": f"用户 {email} 已手动设置为验证状态",
        "was_already_verified": False
    }


@router.put("/password", response_model=PasswordUpdateResponse)
async def update_password(
    request: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新用户密码
    """
    # 验证新密码和确认密码是否一致
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码和确认密码不一致"
        )
    
    # 验证当前密码是否正确
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码不正确"
        )
    
    # 验证新密码强度
    is_valid, error_message = validate_password(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # 检查新密码是否与当前密码相同
    if verify_password(request.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码不能与当前密码相同"
        )
    
    try:
        # 更新密码
        new_password_hash = get_password_hash(request.new_password)
        current_user.password_hash = new_password_hash
        db.commit()
        
        return PasswordUpdateResponse(
            success=True,
            message="密码更新成功"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"密码更新失败: {str(e)}"
        )


@router.get("/credits/history", response_model=CreditHistoryResponse)
async def get_credits_history(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取用户积分交易历史记录（支持分页）
    
    Args:
        page: 页码（从1开始，默认第1页）
        limit: 每页记录数（默认20条，最大100条）
        current_user: 当前登录用户
        db: 数据库会话
    
    Returns:
        CreditHistoryResponse: 包含交易记录、分页信息和当前余额的响应
    """
    try:
        # 参数验证
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="页码必须大于0"
            )
        
        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="每页记录数必须在1-100之间"
            )
        
        # 获取用户当前积分余额
        user_credits = CreditService.get_user_credits(db, current_user.id)
        current_balance = user_credits.balance if user_credits else 0
        
        # 获取分页的交易记录
        transactions, total_count, total_pages = CreditService.get_user_transactions(
            db, current_user.id, page, limit
        )
        
        # 转换为响应模型
        transaction_responses = [
            CreditTransactionResponse.from_transaction(trans) 
            for trans in transactions
        ]
        
        # 构建分页信息
        pagination = {
            "current_page": page,
            "total_pages": total_pages,
            "total_count": total_count,
            "page_size": limit,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
        
        return CreditHistoryResponse(
            success=True,
            data=transaction_responses,
            pagination=pagination,
            current_balance=current_balance
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取积分历史失败: {str(e)}"
        )


@router.get("/config-status")
async def get_config_status():
    """
    获取系统配置状态（调试用）
    """
    from app.utils.recaptcha import is_recaptcha_enabled
    
    return {
        "recaptcha_enabled": is_recaptcha_enabled(),
        "password_endpoint_available": True,
        "timestamp": "2024-07-26"
    }

# 更新前向引用
UserProfileUpdateResponse.model_rebuild()


# ===================================================================
# ======================= Google OAuth 路由 =========================
# ===================================================================

@router.get("/google")
async def login_via_google(request: StarletteRequest):
    """
    Google OAuth 登录 - 第一步：重定向到 Google 授权页面
    """
    try:
        from ..core.oauth import get_google_oauth_client
        from ..core.config import settings
        from fastapi.responses import RedirectResponse
        
        # 检查 Google OAuth 配置
        if not settings.google_client_id or not settings.google_client_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth 服务暂不可用: 缺少配置信息"
            )
        
        google_client = get_google_oauth_client()
        
        # 构建回调 URL
        callback_url = str(request.url_for('google_callback'))
        
        # 获取授权 URL
        auth_url = await google_client.get_authorization_url(callback_url)
        
        # 重定向到 Google 授权页面
        return RedirectResponse(url=auth_url)
        
    except ValueError as ve:
        # OAuth 配置错误
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Google OAuth 配置错误: {str(ve)}"
        )
    except Exception as e:
        # 其他错误
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google OAuth 初始化失败: {str(e)}"
        )


@router.get("/google/callback", name="google_callback")
async def google_callback(request: StarletteRequest, db: Session = Depends(get_db)):
    """
    Google OAuth 回调处理 - 第二步：处理 Google 返回的授权码并完成登录
    """
    try:
        from ..core.oauth import get_google_oauth_client
        from ..services.credit_service import CreditService
        
        # 获取授权码
        code = request.query_params.get('code')
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少授权码"
            )
        
        google_client = get_google_oauth_client()
        
        # 构建回调 URL（必须与第一步中的完全一致）
        callback_url = str(request.url_for('google_callback'))
        
        # 1. 用授权码换取访问令牌
        token_data = await google_client.exchange_code_for_token(code, callback_url)
        access_token = token_data.get('access_token')
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="获取访问令牌失败"
            )
        
        # 2. 从 Google 获取用户信息
        user_info = await google_client.get_user_info(access_token)
        
        google_id = user_info.get('sub')  # Google 用户 ID
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0] if email else 'User')
        avatar_url = user_info.get('picture')
        
        if not google_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="从 Google 获取用户信息失败"
            )
        
        # 3. 在数据库中查找或创建用户
        db_user = db.query(User).filter(User.google_id == google_id).first()
        
        if not db_user:
            # 检查是否已存在相同邮箱的用户（可能是传统注册用户）
            existing_user = db.query(User).filter(User.email == email).first()
            
            if existing_user:
                # 关联现有用户账户到 Google
                existing_user.google_id = google_id
                if not existing_user.is_verified:
                    existing_user.is_verified = True  # Google 用户默认已验证邮箱
                if not existing_user.display_name:
                    existing_user.display_name = name
                if not existing_user.avatar_url and avatar_url:
                    existing_user.avatar_url = avatar_url
                
                db.commit()
                db.refresh(existing_user)
                db_user = existing_user
            else:
                # 创建新的 Google 用户
                new_user = User(
                    email=email,
                    display_name=name,
                    google_id=google_id,
                    avatar_url=avatar_url,
                    is_active=True,
                    is_verified=True,  # Google 用户默认已验证邮箱
                    password_hash=None  # Google 用户不需要密码
                )
                
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                db_user = new_user
                
                # 为新用户创建初始积分记录
                try:
                    CreditService.create_initial_credits(db, new_user)
                except Exception as credit_error:
                    print(f"为 Google 用户 {new_user.email} 创建初始积分失败: {credit_error}")
        
        # 4. 检查并发放每日奖励（仅对登录用户）
        daily_reward_granted = False
        try:
            daily_reward_granted = CreditService.grant_daily_reward_if_eligible(db, db_user.id)
        except Exception as reward_error:
            print(f"为 Google 用户 {db_user.email} 发放每日奖励失败: {reward_error}")
        
        # 5. 为该用户创建 JWT 访问令牌
        jwt_token = create_access_token(data={"sub": str(db_user.id)})
        
        # 6. 重定向回前端，并在 URL 参数中带上 JWT
        frontend_callback_url = f"https://thinkso.io/auth/callback?token={jwt_token}"
        
        if daily_reward_granted:
            frontend_callback_url += "&daily_reward=true"
        
        return RedirectResponse(url=frontend_callback_url)
        
    except HTTPException:
        raise
    except Exception as e:
        # 发生错误时重定向到登录页面并显示错误信息
        error_message = f"Google 登录失败: {str(e)}"
        login_url = f"https://thinkso.io/login?error={error_message}"
        return RedirectResponse(url=login_url)


class GoogleUserInfo(BaseModel):
    """Google 用户信息响应模型（调试用）"""
    google_id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    is_new_user: bool

class OAuthStatusResponse(BaseModel):
    """OAuth状态响应模型"""
    service: str
    status: str
    message: str
    client_configured: bool

class MigrationResponse(BaseModel):
    """数据库迁移响应模型"""
    success: bool
    message: str
    output: Optional[str] = None


@router.get("/google/status", response_model=OAuthStatusResponse)
async def check_google_oauth_status():
    """
    检查 Google OAuth 配置状态（调试用）
    """
    try:
        from ..core.oauth import get_google_oauth_client
        from ..core.config import settings
        
        client_configured = bool(settings.google_client_id and settings.google_client_secret)
        
        if not client_configured:
            return OAuthStatusResponse(
                service="Google OAuth",
                status="未配置",
                message="缺少GOOGLE_CLIENT_ID或GOOGLE_CLIENT_SECRET环境变量",
                client_configured=False
            )
        
        # 尝试创建客户端
        google_client = get_google_oauth_client()
        
        return OAuthStatusResponse(
            service="Google OAuth",
            status="已配置",
            message=f"客户端ID: {settings.google_client_id[:10]}...",
            client_configured=True
        )
        
    except Exception as e:
        return OAuthStatusResponse(
            service="Google OAuth",
            status="错误",
            message=str(e),
            client_configured=False
        )

@router.post("/migrate", response_model=MigrationResponse)
async def run_database_migration():
    """
    手动运行数据库迁移（紧急修复用）
    """
    import subprocess
    import os
    
    try:
        # 获取项目根目录
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        # 运行Alembic迁移
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            capture_output=True,
            text=True,
            cwd=backend_dir,
            timeout=120
        )
        
        if result.returncode == 0:
            return MigrationResponse(
                success=True,
                message="数据库迁移成功完成",
                output=result.stdout
            )
        else:
            return MigrationResponse(
                success=False,
                message=f"数据库迁移失败: {result.stderr}",
                output=result.stdout
            )
            
    except subprocess.TimeoutExpired:
        return MigrationResponse(
            success=False,
            message="迁移执行超时",
            output=None
        )
    except Exception as e:
        return MigrationResponse(
            success=False,
            message=f"迁移执行异常: {str(e)}",
            output=None
        )

@router.post("/fix-google-id", response_model=MigrationResponse)
async def fix_google_id_column(db: Session = Depends(get_db)):
    """
    直接修复google_id字段（紧急修复用）
    """
    try:
        # 直接使用SQL添加google_id字段
        sql_commands = [
            # 检查字段是否存在
            """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='google_id'
            """,
            # 如果不存在则添加字段
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100)",
            # 添加唯一索引
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)",
            # 将password_hash改为可空
            "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"
        ]
        
        results = []
        
        for sql in sql_commands:
            try:
                if "SELECT" in sql:
                    result = db.execute(text(sql))
                    columns = [row[0] for row in result.fetchall()]
                    if 'google_id' in columns:
                        results.append("✅ google_id字段已存在")
                        continue
                    else:
                        results.append("⚠️ google_id字段不存在，准备添加")
                else:
                    db.execute(text(sql))
                    results.append(f"✅ 执行成功: {sql[:50]}...")
            except Exception as e:
                if "already exists" in str(e) or "duplicate" in str(e).lower():
                    results.append(f"✅ 已存在: {sql[:50]}...")
                else:
                    results.append(f"❌ 失败: {sql[:50]}... - {str(e)}")
        
        db.commit()
        
        return MigrationResponse(
            success=True,
            message="Google ID字段修复完成",
            output="\n".join(results)
        )
        
    except Exception as e:
        db.rollback()
        return MigrationResponse(
            success=False,
            message=f"修复失败: {str(e)}",
            output=None
        )


@router.get("/magic-link")
async def magic_link_login(token: str, db: Session = Depends(get_db)):
    """
    魔法链接登录 - 通过邮件中的链接直接登录
    """
    now = datetime.now(timezone.utc)

    # 根据 URL 中的 token 值，在 login_tokens 表中查找匹配的 magic_token 记录
    login_token = db.query(LoginToken).filter(
        LoginToken.magic_token == token,
        LoginToken.used_at.is_(None),
        LoginToken.expires_at > now
    ).first()

    if not login_token:
        # 重定向到登录页面并显示错误
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=invalid_token")

    # 将该 token 标记为已使用
    login_token.used_at = now
    
    # 在users表中查找或创建新用户
    user = db.query(User).filter(User.email == login_token.email).first()
    daily_reward_granted = False

    if not user:
        # 创建新用户
        new_user = User(
            email=login_token.email,
            is_active=True,
            is_verified=True, # 通过邮箱验证码登录的用户，邮箱视为已验证
            display_name=login_token.email.split('@')[0]
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
        
        # 为新用户创建积分和每日奖励
        try:
            CreditService.create_initial_credits(db, user)
            daily_reward_granted = CreditService.grant_daily_reward_if_eligible(db, user.id)
        except Exception as e:
            print(f"Failed to create credits for new user {user.email}: {e}")
            # 不影响登录流程
    else:
        # 如果是现有用户，检查并发放每日奖励
        try:
            daily_reward_granted = CreditService.grant_daily_reward_if_eligible(db, user.id)
        except Exception as e:
            print(f"Failed to grant daily reward for user {user.email}: {e}")

    db.commit()
    
    # 为该用户创建 JWT 访问令牌
    jwt_token = create_access_token(data={"sub": str(user.id)})
    
    # 重定向回前端，并在 URL 参数中带上 JWT
    frontend_callback_url = f"{settings.frontend_url}/auth/callback?token={jwt_token}"
    
    if daily_reward_granted:
        frontend_callback_url += "&daily_reward=true"
    
    return RedirectResponse(url=frontend_callback_url)


@router.get("/google/test-info")
async def test_google_user_info(current_user: User = Depends(get_current_user)):
    """
    测试端点：获取当前用户的 Google 相关信息（调试用）
    """
    return GoogleUserInfo(
        google_id=current_user.google_id or "未关联",
        email=current_user.email,
        name=current_user.display_name or "未设置",
        avatar_url=current_user.avatar_url,
        is_new_user=current_user.google_id is not None and current_user.password_hash is None
    )
