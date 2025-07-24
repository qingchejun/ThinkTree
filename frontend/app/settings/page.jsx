'use client';
import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthContext from '../components/context/AuthContext';
import Header from '../components/common/Header';

const settingsNavItems = [
  {
    id: 'profile',
    name: '个人资料',
    icon: '👤',
    path: '/settings/profile'
  },
  {
    id: 'security',
    name: '账户与安全',
    icon: '🔒',
    path: '/settings/security'
  },
  {
    id: 'billing',
    name: '用量与计费',
    icon: '💳',
    path: '/settings/billing'
  },
  {
    id: 'invitations',
    name: '邀请好友',
    icon: '👥',
    path: '/settings/invitations'
  }
];

const SettingsPage = () => {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">个人资料</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  显示名称
                </label>
                <input
                  type="text"
                  placeholder="输入您的显示名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                保存更改
              </button>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">账户与安全</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">修改密码</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      当前密码
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    更新密码
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">用量与计费</h2>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">当前积分</h3>
                <p className="text-3xl font-bold text-blue-600">1,000</p>
                <p className="text-sm text-gray-600 mt-1">积分余额</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">使用统计</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">本月生成</p>
                    <p className="text-2xl font-bold">15</p>
                    <p className="text-sm text-gray-600">思维导图</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">本月消耗</p>
                    <p className="text-2xl font-bold">300</p>
                    <p className="text-sm text-gray-600">积分</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'invitations':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">邀请好友</h2>
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">邀请配额</h3>
                <p className="text-3xl font-bold text-green-600">8</p>
                <p className="text-sm text-gray-600 mt-1">剩余邀请码</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">生成邀请码</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  生成新的邀请码
                </button>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">我的邀请码</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                    <span className="font-mono text-sm">INVITE-ABC123</span>
                    <span className="text-sm text-green-600">已使用</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                    <span className="font-mono text-sm">INVITE-DEF456</span>
                    <span className="text-sm text-gray-500">未使用</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>功能开发中...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <Header 
        title="⚙️ 账户设置"
        subtitle="管理您的个人资料和账户偏好设置"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧导航栏 */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow">
              <nav className="p-4">
                <ul className="space-y-2">
                  {settingsNavItems.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;