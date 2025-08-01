'use client';
import { useState, useContext, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AuthContext from '../../context/AuthContext';
import { Button } from '../ui/Button';

const Header = ({ title, subtitle, showCreateButton = false }) => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const navigateTo = (path) => {
    router.push(path);
    setIsDropdownOpen(false);
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    return user?.display_name || user?.displayName || user?.name || user?.email || '用户';
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧标题区域 */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 mr-6"
            >
              🧠 ThinkSo
            </button>
            {title && (
              <div className="border-l border-gray-300 pl-6">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          {/* 右侧用户区域 */}
          <div className="flex items-center space-x-4">
            {/* 创建按钮 */}
            {showCreateButton && (
              <Button
                variant="secondary"
                onClick={() => router.push('/create')}
                className="inline-flex items-center"
              >
                ➕ 创建思维导图
              </Button>
            )}

            {/* 用户信息显示 - 仅登录用户可见 */}
            {user && (
              <div className="hidden sm:flex items-center space-x-3">
                
                {/* 积分余额 */}
                <div className="flex items-center bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full px-3 py-2">
                  <span className="text-amber-600 mr-2">💎</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {user.credits || 0} 积分
                  </span>
                </div>

                {/* 邀请码剩余 */}
                {user.invitation_remaining !== undefined && (
                  <div className="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-3 py-2">
                    <span className="text-green-600 mr-2">👥</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {user.invitation_remaining} 邀请码
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 用户下拉菜单 */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-3 py-2 transition-colors"
                >
                  {/* 用户头像 */}
                  <Image 
                    width={32} 
                    height={32} 
                    className="w-8 h-8 rounded-full object-cover" 
                    src="/default-avatar.png" 
                    alt="用户头像" 
                  />
                  {/* 用户名称 */}
                  <span className="hidden sm:block">{getUserDisplayName()}</span>
                  {/* 下拉箭头 */}
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 下拉菜单 */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      {/* 用户信息 */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        {/* 用户状态信息 */}
                        <div className="flex items-center space-x-2 mt-2">
                          {/* 积分信息 */}
                          <div className="flex items-center bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full px-3 py-1">
                            <span className="text-amber-600 mr-2 text-xs">💎</span>
                            <span className="text-xs font-semibold text-gray-700">
                              {user.credits || 0} 积分
                            </span>
                          </div>
                          {/* 邀请码信息 */}
                          {user.invitation_remaining !== undefined && (
                            <div className="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-3 py-1">
                              <span className="text-green-600 mr-2 text-xs">👥</span>
                              <span className="text-xs font-semibold text-gray-700">
                                {user.invitation_remaining} 邀请码
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 菜单项 */}
                      <button
                        onClick={() => navigateTo('/mindmaps')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-3">📊</span>
                        我的思维导图
                      </button>

                      <button
                        onClick={() => navigateTo('/create')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-3">➕</span>
                        创建思维导图
                      </button>

                      {/* 分隔线 */}
                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => navigateTo('/settings?tab=billing')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-3">💳</span>
                        用量与计费
                      </button>

                      <button
                        onClick={() => navigateTo('/settings?tab=invitations')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-3">👥</span>
                        邀请好友
                      </button>

                      <button
                        onClick={() => navigateTo('/settings')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-3">⚙️</span>
                        账户设置
                      </button>

                      {/* 管理员入口 */}
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => navigateTo('/admin/dashboard')}
                            className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center font-medium"
                          >
                            <span className="mr-3">🛡️</span>
                            管理员后台
                          </button>
                          <button
                            onClick={() => navigateTo('/admin/codes')}
                            className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center"
                          >
                            <span className="mr-3">💎</span>
                            兑换码管理
                          </button>
                        </>
                      )}

                      {/* 分隔线 */}
                      <div className="border-t border-gray-100 my-1"></div>

                      {/* 退出登录 */}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <span className="mr-3">🚪</span>
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 未登录状态 */
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                >
                  登录
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push('/register')}
                >
                  注册
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;