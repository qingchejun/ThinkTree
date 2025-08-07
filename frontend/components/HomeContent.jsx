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
      openLoginModal();
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

  // 移除自动跳转逻辑 - 让已登录用户也能访问首页
  // useEffect(() => {
  //   if (!isLoading && user) {
  //     router.push('/dashboard');
  //   }
  // }, [user, isLoading, router]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent"></div>
      </div>
    );
  }

  // 显示营销页面（未登录和已登录用户都可以访问）
  return (
    <LandingPage 
      invitationCode={invitationCode}
      autoRegister={autoRegister}
      errorMessage={errorMessage}
      onLoginClick={openLoginModal}
    />
  );
}