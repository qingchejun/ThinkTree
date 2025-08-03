/**
 * 根页面 (/) - ThinkSo v3.2.2
 * 根据用户登录状态智能显示营销页面或跳转到工作台
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../components/LandingPage';

export default function HomePage({ searchParams }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [invitationCode, setInvitationCode] = useState('');
  const [autoRegister, setAutoRegister] = useState(false);
  
  // 从 searchParams prop 获取URL参数
  useEffect(() => {
    const codeFromUrl = searchParams?.invitation_code || '';
    const autoRegisterFromUrl = searchParams?.auto_register === 'true';
    
    setInvitationCode(codeFromUrl);
    setAutoRegister(autoRegisterFromUrl);
  }, [searchParams]);

  // 清理URL参数（在弹窗打开后延迟清理）
  useEffect(() => {
    if (!isLoading && !user && (invitationCode || autoRegister)) {
      // 更长的延迟，确保LandingPage组件有足够时间处理参数并打开弹窗
      const timer = setTimeout(() => {
        router.replace('/', undefined, { shallow: true });
      }, 2000); // 增加到2秒，确保弹窗有足够时间打开
      return () => clearTimeout(timer);
    }
  }, [invitationCode, autoRegister, isLoading, user, router]);

  // 如果用户已登录，跳转到工作台
  useEffect(() => {
    if (!isLoading && user) {
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