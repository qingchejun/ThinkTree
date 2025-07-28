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


class UserResponse(BaseModel):
    """用户响应模型"""
    id: int
    email: str
    display_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: str
    credits: int = 100
    invitation_quota: int = 10


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
        created_at=user.created_at.isoformat(),
        credits=user.credits,
        invitation_quota=user.invitation_quota
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


class UserProfileResponse(BaseModel):
    """用户详细资料响应模型 - 包含邀请码使用统计"""
    id: int
    email: str
    display_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: str
    credits: int = 100
    invitation_quota: int = 10
    invitation_used: int = 0  # 已使用的邀请码数量
    invitation_remaining: int = 10  # 剩余邀请码配额


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    获取当前用户信息 - 包含积分余额和邀请码配额信息
    """
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
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_superuser=current_user.is_superuser,
        created_at=current_user.created_at.isoformat(),
        credits=current_user.credits,
        invitation_quota=current_user.invitation_quota,
        invitation_used=invitation_used,
        invitation_remaining=invitation_remaining
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
    try:
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
            
            current_user.display_name = request.display_name.strip()
            changes.append(f"显示名称: {old_display_name} -> {current_user.display_name}")
        
        # 如果没有任何更改
        if not changes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="没有提供任何更新数据"
            )
        
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
        
        # 构造更新后的用户信息
        updated_user = UserProfileResponse(
            id=current_user.id,
            email=current_user.email,
            display_name=current_user.display_name,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            is_superuser=current_user.is_superuser,
            created_at=current_user.created_at.isoformat(),
            credits=current_user.credits,
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


# 调试端点已移除 - 邮件服务已正常工作


# 用户状态调试端点已移除 - 可通过管理员后台查看


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