'use client';

import '../styles/globals.css'
import React from 'react';
import { usePathname } from 'next/navigation'; // 引入 usePathname
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { AuthProvider } from '../context/AuthContext'
import { ModalProvider, useModal } from '../context/ModalContext';
import { ToastContainer } from '../components/common/Toast'
import { DailyRewardToast } from '../components/common/DailyRewardToast'
import { Inter } from 'next/font/google'
import Navbar from '../components/common/Navbar'

// 初始化 Inter 字体
const inter = Inter({ subsets: ['latin'] })

// 新的 Wrapper 组件，用于根据路由判断是否显示 Navbar
function LayoutWrapper({ children }) {
  return (
    <>
      <Navbar />
      <main>
        {children}
      </main>
      <ToastContainer />
      <DailyRewardToast />
    </>
  );
}

export default function RootLayout({ children }) {
  // reCAPTCHA Site Key - 从环境变量获取
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} antialiased`}>
        {recaptchaSiteKey ? (
          <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
            <AuthProvider>
              <ModalProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
              </ModalProvider>
            </AuthProvider>
          </GoogleReCaptchaProvider>
        ) : (
          <AuthProvider>
            <ModalProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </ModalProvider>
          </AuthProvider>
        )}
      </body>
    </html>
  )
}