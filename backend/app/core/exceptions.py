"""
生产级全局异常处理系统
提供统一的错误响应格式和环境感知的日志记录
"""

import logging
import os
from typing import Union
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError, HTTPException as FastAPIHTTPException
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError

# 配置日志器
logger = logging.getLogger(__name__)

# 环境检测
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() in ["production", "prod"]


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    处理Pydantic请求验证错误 (422)
    统一格式化参数验证失败的错误响应
    """
    error_details = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        error_details.append(f"{field}: {error['msg']}")
    
    details = "; ".join(error_details)
    
    if not IS_PRODUCTION:
        logger.warning(f"参数验证失败 - URL: {request.url} - 详情: {details}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "请求参数验证失败",
            "details": details
        }
    )


async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    处理Starlette HTTP异常，特别关注404和405错误
    提供统一的路由级别错误响应
    """
    if exc.status_code == status.HTTP_404_NOT_FOUND:
        message = "请求的API端点不存在"
        details = f"路径 '{request.url.path}' 未找到对应的处理程序"
    elif exc.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
        message = "HTTP方法不被允许"
        details = f"路径 '{request.url.path}' 不支持 {request.method} 方法"
    else:
        message = "HTTP请求处理失败"
        details = exc.detail if hasattr(exc, 'detail') and exc.detail else "未知的HTTP错误"
    
    if not IS_PRODUCTION:
        logger.warning(f"HTTP异常 {exc.status_code} - URL: {request.url} - Method: {request.method}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": message,
            "details": details
        }
    )


async def fastapi_http_exception_handler(request: Request, exc: FastAPIHTTPException) -> JSONResponse:
    """
    处理FastAPI HTTP异常
    统一处理业务逻辑中主动抛出的HTTP错误
    """
    # 根据状态码提供更友好的默认消息
    status_messages = {
        400: "请求参数错误",
        401: "身份认证失败",
        403: "权限不足",
        409: "资源冲突",
        429: "请求频率过高",
        500: "服务器内部错误"
    }
    
    message = status_messages.get(exc.status_code, "请求处理失败")
    details = str(exc.detail) if exc.detail else "无详细信息"
    
    if not IS_PRODUCTION:
        logger.warning(f"业务异常 {exc.status_code} - URL: {request.url} - 详情: {details}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": message,
            "details": details
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    全局异常捕获器 (500)
    处理所有未被其他处理器捕获的异常，实现环境感知的日志记录
    """
    if IS_PRODUCTION:
        # 生产环境：仅记录简短错误信息，避免敏感信息泄露
        logger.error(f"服务器内部错误 - URL: {request.url} - 异常类型: {type(exc).__name__}")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "服务器内部错误",
                "details": "请联系技术支持或稍后重试"
            }
        )
    else:
        # 开发环境：记录完整堆栈跟踪信息
        logger.exception(f"服务器内部错误 - URL: {request.url} - 详细信息:")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "服务器内部错误",
                "details": f"{type(exc).__name__}: {str(exc)}"
            }
        )


def register_exception_handlers(app: FastAPI) -> None:
    """
    注册所有异常处理器到FastAPI应用实例
    确保异常处理器的正确加载顺序和覆盖范围
    """
    # 注册Pydantic验证错误处理器 (422)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # 注册Starlette HTTP异常处理器 (404, 405等)
    app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)
    
    # 注册FastAPI HTTP异常处理器 (业务逻辑异常)
    app.add_exception_handler(FastAPIHTTPException, fastapi_http_exception_handler)
    
    # 注册全局异常处理器 (500)
    app.add_exception_handler(Exception, general_exception_handler)
    
    logger.info("异常处理系统已成功注册")