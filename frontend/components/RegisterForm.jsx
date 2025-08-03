'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationCode = searchParams.get('invitation_code');

  useEffect(() => {
    // 构建重定向URL，包含邀请码和自动打开注册弹窗的标识
    const params = new URLSearchParams();
    if (invitationCode) {
      params.set('invitation_code', invitationCode);
    }
    params.set('auto_register', 'true'); // 标识需要自动打开注册弹窗

    // 重定向到首页，并传递参数
    const redirectUrl = `/?${params.toString()}`;
    router.replace(redirectUrl);
  }, [router, invitationCode]);

  // 显示加载状态
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">准备注册</h2>
        <p className="text-gray-600">
          {invitationCode 
            ? `正在为您准备注册页面，邀请码：${invitationCode}` 
            : '正在跳转到注册页面...'
          }
        </p>
      </div>
    </div>
  );
}