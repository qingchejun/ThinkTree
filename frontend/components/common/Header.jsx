'use client';
import { useState, useContext, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthContext from '../../context/AuthContext';

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

  // 获取用户显示名称（使用邮箱前缀或完整邮箱）
  const getUserDisplayName = () => {
    if (!user?.email) return '用户';
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.length > 12 ? emailPrefix.substring(0, 12) + '...' : emailPrefix;
  };

  // 获取用户头像文字（邮箱首字母）
  const getUserAvatar = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
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
              <button
                onClick={() => router.push('/create')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                ➕ 创建思维导图
              </button>
            )}

            {/* 用户下拉菜单 */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-3 py-2 transition-colors"
                >
                  {/* 用户头像 */}
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {getUserAvatar()}
                  </div>
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
                      </div>

                      {/* 菜单项 */}
                      <button
                        onClick={() => navigateTo('/dashboard')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-3">📊</span>
                        我的思维导图
                      </button>

                      <button
                        onClick={() => navigateTo('/settings')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-3">⚙️</span>
                        账户设置
                      </button>

                      <button
                        onClick={() => navigateTo('/create')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-3">➕</span>
                        创建思维导图
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
                <button
                  onClick={() => router.push('/login')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  登录
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  注册
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;