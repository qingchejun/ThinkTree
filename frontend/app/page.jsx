/**
 * 根页面 (/) - ThinkSo v3.2.3-stable
 * 可通过邀请链接注册，稳定版
 * 根据用户登录状态智能显示营销页面或跳转到工作台
 */
import React, { Suspense } from 'react';
import HomeContent from '../components/HomeContent';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-900 border-t-transparent"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}