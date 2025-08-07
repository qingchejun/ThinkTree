'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import { Gift, Zap, LayoutDashboard, CreditCard, Settings, LogOut, ListChecks } from 'lucide-react';
import { getCurrentAvatar } from './AvatarSelector';
import AvatarDisplay from './AvatarDisplay';

const Navbar = () => {
  const { user, logout, isAdmin, credits } = useAuth();
  const { openLoginModal } = useModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('default');
  const [isClient, setIsClient] = useState(false);
  const menuRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const hideOnRoutes = ['/auth/login', '/auth/register'];

  useEffect(() => {
    setIsClient(true);
    if (user) {
      setCurrentAvatar(getCurrentAvatar());
    }
  }, [user]);

  useEffect(() => {
    if (!isClient) return;
    
    const handleAvatarChange = (event) => {
      const { newAvatar } = event.detail;
      setCurrentAvatar(newAvatar);
    };

    window.addEventListener('avatarChanged', handleAvatarChange);
    return () => {
      window.removeEventListener('avatarChanged', handleAvatarChange);
    };
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClient]);

  const handleLogout = () => {
    logout(router);
    setIsMenuOpen(false);
  };

  if (hideOnRoutes.includes(pathname)) {
    return null;
  }

  // 🔍 更严格的用户状态判断 - 确保user对象有效且包含必要信息
  const isValidUser = user && typeof user === 'object' && (user.email || user.id) && !user.message;
  
  if (!isValidUser) {
    // 如果用户未登录或用户数据无效，显示简化的导航栏
    return (
      <header className="bg-white/95 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-200 flex-shrink-0">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
            <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path fill="#111827" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z"/></svg>
            <span className="text-2xl font-bold text-gray-900">ThinkSo</span>
          </Link>
          <button onClick={openLoginModal} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-black hover:bg-gray-800">
            登录
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/95 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-200 flex-shrink-0">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* 左侧：品牌logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
          <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path fill="#111827" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z"/></svg>
          <span className="text-2xl font-bold text-gray-900">ThinkSo</span>
        </Link>
        
        {/* 右侧：邀请好友 + 用户菜单 */}
        <div className="flex items-center space-x-6">
          <Link href="/settings" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm">
            <Gift className="w-4 h-4 text-orange-500" />
            <span>邀请好友</span>
          </Link>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 p-1 rounded-full transition-colors"
            >
              <Zap className="w-4 h-4 text-yellow-500 ml-2" />
              <span className="font-semibold text-gray-800 px-2">{credits}</span>
              <AvatarDisplay 
                avatarId={currentAvatar}
                size={32}
                className="border border-gray-200"
              />
            </button>
            
            {/* 用户下拉菜单 */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border">
                <div className="px-4 py-2 border-b">
                  <p className="font-semibold text-gray-800 truncate">{user?.display_name || user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : '用户')}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link href="/mindmaps" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><LayoutDashboard className="w-4 h-4 text-blue-500"/><span>我的导图</span></Link>
                <Link href="/settings?tab=billing" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><CreditCard className="w-4 h-4 text-green-500"/><span>用量计费</span></Link>
                <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Settings className="w-4 h-4 text-gray-500"/><span>账户设置</span></Link>
                <Link href="/settings?tab=invitations" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><ListChecks className="w-4 h-4 text-orange-500"/><span>邀请记录</span></Link>
                
                {/* 管理员菜单 - 仅管理员可见 */}
                {isAdmin && (
                  <>
                    <div className="border-t my-1"></div>
                    <Link href="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 15C16.59 15 15.1 14.65 13.81 14.04C13.53 14.32 13.28 14.63 13.09 14.97C14.08 15.29 15.06 15.5 16.02 15.57C17.17 15.64 18 16.56 18 17.71V18H6V17.71C6 16.56 6.83 15.64 7.98 15.57C9.96 15.4 11.81 14.8 13.09 14.03C13.28 13.37 13.53 12.68 13.81 11.96C15.1 11.35 16.59 11 18 11V15Z"/>
                      </svg>
                      <span>管理员后台</span>
                    </Link>
                  </>
                )}
                
                <div className="border-t my-1"></div>
                <button onClick={handleLogout} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4"/><span>退出登录</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;