/**
 * 根页面 (/) - ThinkSo v3.2.2
 * 根据用户登录状态智能显示营销页面或跳转到工作台
 */
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../components/LandingPage';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 获取URL参数
  const invitationCode = searchParams.get('invitation_code');
  const autoRegister = searchParams.get('auto_register') === 'true';

  // 清理URL参数（在显示弹窗后）
  useEffect(() => {
    if (!isLoading && !user && (invitationCode || autoRegister)) {
      // 延迟清理URL，确保参数已经被使用
      const timer = setTimeout(() => {
        router.replace('/', undefined, { shallow: true });
      }, 500);
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