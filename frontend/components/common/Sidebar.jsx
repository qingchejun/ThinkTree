'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, LayoutDashboard, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    {
      href: '/mindmaps',
      icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />,
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
      icon: <Clock className="w-5 h-5 text-green-500" />,
      label: '最近打开',
      available: true,
    },
    {
      href: '/mindmaps/trash',
      icon: <Trash2 className="w-5 h-5 text-red-500" />,
      label: '回收站',
      available: true,
    },
  ];

  return (
    <aside className={`relative bg-gray-100 p-4 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button 
        onClick={toggleSidebar} 
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 rounded-full p-1 z-10"
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
      <h2 className={`text-lg font-semibold text-gray-800 mb-6 ${isCollapsed ? 'hidden' : 'block'}`}>
        我的导图
      </h2>
      <nav className="space-y-2">
        {navItems.map((item) => {
          if (item.available) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-gray-200 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-200'
                } ${isCollapsed ? 'justify-center' : ''}`}>
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          } else {
            return (
              <div
                key={item.href}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-not-allowed opacity-50 ${isCollapsed ? 'justify-center' : ''}`}
                title="功能开发中">
                {item.icon}
                {!isCollapsed && (
                  <span className="text-gray-400">
                    {item.label}
                    <span className="text-xs ml-1">(开发中)</span>
                  </span>
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