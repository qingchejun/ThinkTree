'use client';

import '../styles/globals.css'
import React from 'react';
import { usePathname } from 'next/navigation'; // 引入 usePathname
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { AuthProvider } from '../context/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ModalProvider, useModal } from '../context/ModalContext';
import { ToastContainer } from '../components/common/Toast'
import { DailyRewardToast } from '../components/common/DailyRewardToast'
import { Inter } from 'next/font/google'
import Navbar from '../components/common/Navbar'

// 初始化 Inter 字体
const inter = Inter({ subsets: ['latin'] })

// 新的 Wrapper 组件，用于根据路由判断是否显示 Navbar
function LayoutWrapper({ children, hideNavbar = false }) {
  return (
    <>
      {!hideNavbar && <Navbar />}
      <main>
        {children}
      </main>
      <ToastContainer />
      <DailyRewardToast />
    </>
  );
}

export default function RootLayout({ children }) {
  const queryClient = new QueryClient()
  // reCAPTCHA Site Key - 从环境变量获取
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const pathname = usePathname();
  const hideNavbar = pathname?.startsWith('/share')
  
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23111827' d='M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z'/%3E%3C/svg%3E" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
        <meta name="description" content="AI 驱动的思维导图生成工具，支持文档、文本、链接转换" />
        <title>ThinkSo - AI 思维导图生成工具</title>
      </head>
      <body className={`${inter.className} antialiased`}>
        {recaptchaSiteKey ? (
          <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <ModalProvider>
                  <LayoutWrapper hideNavbar={hideNavbar}>{children}</LayoutWrapper>
                </ModalProvider>
              </AuthProvider>
            </QueryClientProvider>
          </GoogleReCaptchaProvider>
        ) : (
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ModalProvider>
                <LayoutWrapper hideNavbar={hideNavbar}>{children}</LayoutWrapper>
              </ModalProvider>
            </AuthProvider>
          </QueryClientProvider>
        )}
      </body>
    </html>
  )
}