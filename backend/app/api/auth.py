"""
用户认证 API 路由
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..core.database import get_db
from ..models.user import User
from ..models.invitation import InvitationCode
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


@router.post("/admin-verify")
async def admin_verify_direct(db: Session = Depends(get_db)):
    """
    直接验证管理员账户并设置管理员权限（仅用于初始化）
    """
    # 查找管理员用户
    admin_user = db.query(User).filter(User.email == "admin@thinktree.com").first()
    
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


class UserResponse(BaseModel):
    """用户响应模型"""
    id: int
    email: str
    display_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: str


class TokenResponse(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str
    user: UserResponse


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
    score: int


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


@router.post("/register", response_model=RegisterResponse)
@limiter.limit("10/minute")
async def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    """
    用户注册 - 需要邀请码，注册后发送验证邮件
    """
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
        
        # 标记邀请码为已使用
        use_invitation_code(db, user_data.invitation_code, new_user.id)
        
        # 发送验证邮件
        email_sent = await email_service.send_verification_email(
            email=new_user.email,
            user_name=new_user.display_name
        )
        
        if not email_sent:
            # 邮件发送失败，但用户已创建，给出提示
            return RegisterResponse(
                success=True,
                message="注册成功，但验证邮件发送失败。请联系客服获取帮助。",
                user_id=new_user.id,
                email=new_user.email
            )
        
        return RegisterResponse(
            success=True,
            message="注册成功！请检查邮箱并点击验证链接完成账户激活。",
            user_id=new_user.id,
            email=new_user.email
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
    
    # 构造响应
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,  # 添加缺失的字段
        created_at=user.created_at.isoformat()
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_superuser=current_user.is_superuser,
        created_at=current_user.created_at.isoformat()
    )


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
                created_at=user.created_at.isoformat()
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
            created_at=user.created_at.isoformat()
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
    请求密码重置 - 发送重置链接到用户邮箱
    """
    try:
        # 查找用户
        user = db.query(User).filter(User.email == reset_request.email).first()
        
        # 防止邮箱枚举攻击：无论邮箱是否存在都返回成功
        if not user:
            return PasswordResetResponse(
                success=True,
                message="如果该邮箱已注册，您将收到密码重置链接。请检查您的邮箱（包括垃圾邮件文件夹）。"
            )
        
        # 检查用户是否已验证邮箱
        if not user.is_verified:
            return PasswordResetResponse(
                success=True,
                message="如果该邮箱已注册，您将收到密码重置链接。请检查您的邮箱（包括垃圾邮件文件夹）。"
            )
        
        # 检查用户是否激活
        if not user.is_active:
            return PasswordResetResponse(
                success=True,
                message="如果该邮箱已注册，您将收到密码重置链接。请检查您的邮箱（包括垃圾邮件文件夹）。"
            )
        
        # 生成密码重置令牌（15分钟有效期）
        from datetime import timedelta
        reset_token = create_access_token(
            data={"sub": str(user.id), "type": "password_reset"},
            expires_delta=timedelta(minutes=15)
        )
        
        # 构建重置链接
        reset_link = f"https://thinktree-frontend.onrender.com/reset-password?token={reset_token}"
        
        # 发送密码重置邮件
        try:
            email_sent = await email_service.send_password_reset_email(
                email=user.email,
                user_name=user.display_name or user.email.split('@')[0],
                reset_link=reset_link
            )
            
            if not email_sent:
                print(f"密码重置邮件发送失败 - 邮件服务返回False")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="邮件发送失败，请稍后重试"
                )
        except HTTPException:
            raise
        except Exception as e:
            print(f"发送密码重置邮件失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="邮件发送失败，请稍后重试"
            )
        
        return PasswordResetResponse(
            success=True,
            message="如果该邮箱已注册，您将收到密码重置链接。请检查您的邮箱（包括垃圾邮件文件夹）。"
        )
        
    except HTTPException:
        raise
    except Exception as e:
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