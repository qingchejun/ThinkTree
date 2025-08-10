'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import LandingPage from './LandingPage';

export default function HomeContent() {
  const { user, isLoading } = useAuth();
  const { openLoginModal } = useModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invitationCode, setInvitationCode] = useState('');
  const [autoRegister, setAutoRegister] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 从 useSearchParams Hook 获取URL参数（这会正确处理客户端导航）
  useEffect(() => {
    const codeFromUrl = searchParams.get('invitation_code') || '';
    const autoRegisterFromUrl = searchParams.get('auto_register') === 'true';
    const autoLoginFromUrl = searchParams.get('auth') === 'login';
    const errorFromUrl = searchParams.get('error') || '';
    
    setInvitationCode(codeFromUrl);
    setAutoRegister(autoRegisterFromUrl);
    setAutoLogin(autoLoginFromUrl);
    setErrorMessage(errorFromUrl);
  }, [searchParams]);

  // 自动打开登录弹窗（当检测到 auth=login 参数时）
  useEffect(() => {
    if (!isLoading && !user && autoLogin) {
      openLoginModal({ initialInvitationCode: invitationCode });
    }
  }, [autoLogin, isLoading, user, openLoginModal]);

  // 清理URL参数（在弹窗打开后延迟清理）
  useEffect(() => {
    if (!isLoading && !user && (invitationCode || autoRegister || autoLogin || errorMessage)) {
      // 延迟清理URL，确保LandingPage组件有足够时间处理参数并打开弹窗
      const timer = setTimeout(() => {
        router.replace('/', undefined, { shallow: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [invitationCode, autoRegister, autoLogin, errorMessage, isLoading, user, router]);

  // 智能跳转逻辑 - 已登录用户访问根路径时跳转到dashboard
  useEffect(() => {
    // 只有在有有效用户数据且不是通过特殊参数访问时才跳转
    const isValidUser = user && typeof user === 'object' && (user.email || user.id) && !user.message;
    
    if (!isLoading && isValidUser) {
      // 如果URL中没有特殊参数（如邀请码、登录参数等），则跳转
      if (!invitationCode && !autoRegister && !autoLogin && !errorMessage) {
        console.log('✅ 检测到有效用户，跳转到dashboard:', user);
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, invitationCode, autoRegister, autoLogin, errorMessage, router]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent"></div>
      </div>
    );
  }

  // 用户状态验证
  const isValidUser = user && typeof user === 'object' && (user.email || user.id) && !user.message;

  // 已登录用户：根据是否有特殊参数决定显示内容
  if (isValidUser) {
    // 如果有特殊参数（邀请码、错误信息等），显示首页以处理这些参数
    if (invitationCode || autoRegister || autoLogin || errorMessage) {
      return (
      <LandingPage 
          invitationCode={invitationCode}
          autoRegister={autoRegister}
          errorMessage={errorMessage}
          onLoginClick={openLoginModal}
        />
      );
    }
    
    // 没有特殊参数时，显示跳转加载状态
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">正在跳转到工作台...</p>
        </div>
      </div>
    );
  }

  // 未登录用户：显示营销页面
  return (
    <LandingPage 
      invitationCode={invitationCode}
      autoRegister={autoRegister}
      errorMessage={errorMessage}
      onLoginClick={(opts) => openLoginModal({ initialInvitationCode: invitationCode })}
    />
  );
}