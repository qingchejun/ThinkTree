/**
 * 登录浮窗组件 (LoginModal) - ThinkSo v3.2.2
 * 
 * 🎯 功能说明：
 * 新版登录浮窗，支持Google OAuth和邮箱验证码两种登录方式
 * 在着陆页上以浮窗形式显示，提供更流畅的用户体验
 * 
 * 🔧 主要功能：
 * 1. Google OAuth登录 - 一键使用Google账号登录
 * 2. 邮箱验证码登录 - 输入邮箱接收6位验证码登录
 * 3. 响应式设计 - 适配移动端和桌面端
 * 4. 状态管理 - 处理初始视图和验证码视图切换
 * 
 * 🎨 界面状态：
 * - initial: 显示Google登录按钮和邮箱输入框
 * - verify: 显示6位验证码输入界面
 * 
 * 📝 使用场景：
 * - 用户在着陆页点击登录/注册按钮
 * - 提供无跳转的流畅登录体验
 * - 支持多种登录方式满足不同用户需求
 */
'use client';

import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import AuthContext from '../context/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
  const [view, setView] = useState('initial'); // 'initial' | 'verify'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(new Array(6).fill(""));
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const router = useRouter();

  // 处理邮件发送请求
  const handleInitiateLogin = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('请输入您的邮箱地址');
      return;
    }
    setIsEmailLoading(true);
    setError('');

    try {
      // TODO: 调用后端API发送验证码
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        setView('verify'); // 切换到验证码输入视图
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '发送验证码失败，请稍后重试');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      setError('网络错误，请检查连接后重试');
    } finally {
      setIsEmailLoading(false);
    }
  };

  // 处理验证码输入
  const handleCodeChange = (element, index) => {
    if (isNaN(element.value)) return false;
    
    let newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);

    // 自动跳到下一个输入框
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }

    // 当6位验证码都输入后，自动提交
    if (newCode.every(digit => digit !== "")) {
      handleVerifyCode(newCode.join(""));
    }
  };

  // 处理验证码提交
  const handleVerifyCode = async (fullCode) => {
    setIsEmailLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 使用返回的JWT token进行登录
        const loginResult = await login(data.access_token);
        
        if (loginResult.success) {
          onClose(); // 关闭浮窗
          router.push('/dashboard'); // 跳转到仪表板
        } else {
          setError('登录失败，请稍后重试');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '验证码不正确，请重试');
      }
    } catch (error) {
      console.error('验证失败:', error);
      setError('网络错误，请稍后重试');
    }
    
    setIsEmailLoading(false);
    setCode(new Array(6).fill("")); // 清空验证码
  };

  // 处理Google登录
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      // 重定向到后端的Google OAuth认证端点
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
    } catch (error) {
      console.error('Google登录失败:', error);
      setError('Google登录失败，请稍后重试');
      setIsGoogleLoading(false);
    }
  };

  // 返回初始视图
  const handleGoBack = () => {
    setEmail('');
    setCode(new Array(6).fill(""));
    setError('');
    setView('initial');
  };

  // 处理浮窗关闭
  const handleClose = () => {
    handleGoBack();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4" onClick={e => e.stopPropagation()}>
        {/* 初始视图：谷歌登录和邮箱输入 */}
        {view === 'initial' && (
          <div className="flex flex-col items-center">
            {/* Logo和标题 */}
            <div className="flex items-center space-x-2 mb-8">
              <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path fill="#111827" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z"/>
              </svg>
              <span className="text-2xl font-bold text-gray-900">ThinkSo</span>
            </div>
            
            {/* Google登录按钮 */}
            <button 
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.61,44,29.909,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              {isGoogleLoading ? '登录中...' : 'Continue with Google'}
            </button>
            
            {/* 分隔线 */}
            <div className="my-6 w-full flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">Or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            {/* 邮箱输入表单 */}
            <form onSubmit={handleInitiateLogin} className="w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition"
                disabled={isEmailLoading}
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <button
                type="submit"
                disabled={isEmailLoading}
                className="w-full mt-4 py-3 px-4 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isEmailLoading ? '发送中...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* 验证码视图 */}
        {view === 'verify' && (
          <div className="flex flex-col items-center text-center">
            {/* 邮箱图标 */}
            <div className="w-16 h-16 mb-6 flex items-center justify-center">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">检查您的邮箱</h2>
            <p className="text-gray-600 mb-8">
              我们向 <span className="font-semibold text-gray-800">{email}</span> 发送了一个6位数的验证码。
            </p>
            
            {/* 验证码输入框 */}
            <div className="flex justify-center space-x-2 mb-8">
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={e => handleCodeChange(e.target, index)}
                  onFocus={e => e.target.select()}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition"
                  disabled={isEmailLoading}
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            {/* 继续按钮 */}
            <button
              onClick={() => handleVerifyCode(code.join(""))}
              disabled={isEmailLoading || code.join("").length < 6}
              className="w-full py-3 px-4 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 mb-4"
            >
              {isEmailLoading ? '验证中...' : 'Continue →'}
            </button>

            {/* 返回按钮 */}
            <button 
              onClick={handleGoBack} 
              className="text-sm text-gray-600 hover:text-black transition-colors"
              disabled={isEmailLoading}
            >
              ← 返回
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;