'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LandingPage from './LandingPage';

export default function HomeContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invitationCode, setInvitationCode] = useState('');
  const [autoRegister, setAutoRegister] = useState(false);
  
  // 从 useSearchParams Hook 获取URL参数（这会正确处理客户端导航）
  useEffect(() => {
    const codeFromUrl = searchParams.get('invitation_code') || '';
    const autoRegisterFromUrl = searchParams.get('auto_register') === 'true';
    
    console.log('🔍 HomeContent - 检测到URL参数:', {
      invitation_code: codeFromUrl,
      auto_register: autoRegisterFromUrl,
      searchParams: Object.fromEntries(searchParams.entries())
    });
    
    setInvitationCode(codeFromUrl);
    setAutoRegister(autoRegisterFromUrl);
  }, [searchParams]);

  // 清理URL参数（在弹窗打开后延迟清理）
  useEffect(() => {
    if (!isLoading && !user && (invitationCode || autoRegister)) {
      console.log('🧹 准备清理URL参数，延迟2秒');
      // 延迟清理URL，确保LandingPage组件有足够时间处理参数并打开弹窗
      const timer = setTimeout(() => {
        console.log('🧹 执行URL参数清理');
        router.replace('/', undefined, { shallow: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [invitationCode, autoRegister, isLoading, user, router]);

  // 如果用户已登录，跳转到工作台
  useEffect(() => {
    if (!isLoading && user) {
      console.log('👤 用户已登录，重定向到工作台');
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent"></div>
      </div>
    );
  }

  // 未登录用户显示营销页面
  if (!user) {
    console.log('🎯 渲染LandingPage，参数:', { invitationCode, autoRegister });
    return (
      <LandingPage 
        invitationCode={invitationCode}
        autoRegister={autoRegister}
      />
    );
  }

  // 已登录用户会被上面的 useEffect 重定向，这里返回加载状态
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent"></div>
    </div>
  );
}