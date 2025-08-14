'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, LayoutDashboard, Clock, Trash2, ChevronLeft, ChevronRight, Home } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    {
      href: '/dashboard',
      icon: <Home className="w-5 h-5 text-brand-600" />,
      label: '返回首页',
      available: true,
      isHomeLink: true,
    },
    {
      href: '/mindmaps',
      icon: <LayoutDashboard className="w-5 h-5 text-core-600" />,
      label: '全部',
      available: true,
    },
    {
      href: '/mindmaps/favorites',
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      label: '收藏',
      available: true,
    },
    {
      href: '/mindmaps/recent',
      icon: <Clock className="w-5 h-5 text-core-600" />,
      label: '最近打开',
      available: true,
    },
    {
      href: '/mindmaps/trash',
      icon: <Trash2 className="w-5 h-5 text-error-600" />,
      label: '回收站',
      available: true,
    },
  ];

  return (
    <aside className={`relative bg-brand-100 p-4 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button 
        onClick={toggleSidebar} 
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-brand-200 hover:bg-brand-300 rounded-full p-1 z-10"
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
      <h2 className={`text-lg font-semibold text-brand-800 mb-6 ${isCollapsed ? 'hidden' : 'block'}`}>
        我的导图
      </h2>
      <nav className="space-y-2">
        {navItems.map((item, index) => {
          if (item.available) {
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-brand-200 text-brand-900 font-semibold'
                      : 'text-brand-600 hover:bg-brand-200'
                  } ${isCollapsed ? 'justify-center' : ''}`}>
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
                {/* 在返回首页后添加分隔线 */}
                {item.isHomeLink && !isCollapsed && (
                  <div className="my-4 border-b border-brand-300"></div>
                )}
              </div>
            )
          } else {
            return (
              <div key={item.href}>
                <div
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-not-allowed opacity-50 ${isCollapsed ? 'justify-center' : ''}`}
                  title="功能开发中">
                  {item.icon}
                  {!isCollapsed && (
                    <span className="text-brand-400">
                      {item.label}
                      <span className="text-xs ml-1">(开发中)</span>
                    </span>
                  )}
                </div>
                {/* 在返回首页后添加分隔线 */}
                {item.isHomeLink && !isCollapsed && (
                  <div className="my-4 border-b border-brand-300"></div>
                )}
              </div>
            )
          }
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;