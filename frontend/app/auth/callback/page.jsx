/**
 * OAuth 回调处理页面 - ThinkSo v3.2.2
 * 
 * 🎯 功能说明：
 * 处理 Google OAuth 认证完成后的回调，获取 JWT token 并完成前端登录
 * 
 * 🔧 主要功能：
 * 1. 从 URL 参数中获取 JWT token
 * 2. 将 token 保存到 AuthContext
 * 3. 重定向到应用主页面
 * 4. 处理登录错误情况
 * 
 * 📝 使用场景：
 * - Google OAuth 认证完成后的回调处理
 * - 自动登录并跳转到仪表板
 */
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('正在验证您的身份，请稍候...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const dailyReward = searchParams.get('daily_reward');
        const error = searchParams.get('error');
        
        // 如果有错误信息，显示错误并重定向
        if (error) {
          setStatus('error');
          setMessage(`登录失败: ${error}`);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }
        
        // 如果没有 token，重定向到登录页
        if (!token) {
          setStatus('error');
          setMessage('未收到认证信息，即将返回登录页面...');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }
        
        // 使用 AuthContext 的 login 方法处理 token
        const loginResult = await login(token);
        
        if (loginResult.success) {
          setStatus('success');
          
          // 根据是否有每日奖励显示不同的消息
          if (dailyReward === 'true') {
            setMessage('登录成功！🎉 每日登录奖励 +10 积分！正在跳转...');
          } else {
            setMessage('登录成功！正在跳转到工作台...');
          }
          
          // 延迟跳转以显示成功消息
          setTimeout(() => {
            router.push('/dashboard');
          }, dailyReward === 'true' ? 2500 : 1500);
        } else {
          setStatus('error');
          setMessage(loginResult.error || '登录处理失败，请重试');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
        
      } catch (error) {
        console.error('OAuth 回调处理失败:', error);
        setStatus('error');
        setMessage('登录过程中发生错误，请重试');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };
    
    handleCallback();
  }, [searchParams, router, login]);
  
  // 渲染不同状态的 UI
  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">验证中</h2>
            <p className="text-gray-600">{message}</p>
          </>
        );
      
      case 'success':
        return (
          <>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-6">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">登录成功</h2>
            <p className="text-gray-600">{message}</p>
          </>
        );
      
      case 'error':
        return (
          <>
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-6">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">登录失败</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回登录页面
            </button>
          </>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
            <path fill="#111827" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z"/>
          </svg>
          <span className="text-2xl font-bold text-gray-900">ThinkSo</span>
        </div>
        
        {/* 动态内容 */}
        {renderContent()}
      </div>
    </div>
  );
}