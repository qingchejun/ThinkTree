'use client';
import { useState, useContext, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthContext from '@/context/AuthContext';
import Header from '@/components/common/Header';
import { getProfile, updateProfile, generateInvitationCode, getUserInvitations, updatePassword } from '@/lib/api';
import Toast from '@/components/common/Toast';

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

// 分离出使用 useSearchParams 的组件
const SettingsContent = () => {
  const { user, token, loading } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 加载用户详细资料
  const loadProfileData = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const profile = await getProfile(token);
      setProfileData(profile);
      setDisplayName(profile.display_name || '');
    } catch (error) {
      console.error('加载用户资料失败:', error);
      showToast('加载用户资料失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载邀请码数据
  const loadInvitations = async () => {
    if (!token) return;
    
    try {
      const invitationsList = await getUserInvitations(token);
      setInvitations(invitationsList || []);
    } catch (error) {
      console.error('加载邀请码失败:', error);
      // 如果API不存在，使用空数组作为默认值
      setInvitations([]);
    }
  };

  // 处理 URL 参数中的 tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'billing', 'invitations'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && token) {
      loadProfileData();
      loadInvitations();
    }
  }, [user, token, loading, router]);

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

  // 保存个人资料
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await updateProfile({ display_name: displayName }, token);
      showToast('个人资料更新成功！');
      loadProfileData(); // 重新加载数据
    } catch (error) {
      console.error('更新个人资料失败:', error);
      showToast('更新失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
                  value={profileData?.email || user?.email || ''}
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
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="输入您的显示名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  注册时间
                </label>
                <input
                  type="text"
                  value={profileData ? new Date(profileData.created_at).toLocaleString() : '加载中...'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <button 
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? '保存中...' : '保存更改'}
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
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入当前密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入新密码（至少8位）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <button 
                    onClick={handlePasswordUpdate}
                    disabled={isLoading}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading ? 'opacity-50' : ''}`}
                  >
                    {isLoading ? '更新中...' : '更新密码'}
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
                <p className="text-3xl font-bold text-blue-600">
                  {profileData ? profileData.credits.toLocaleString() : '加载中...'}
                </p>
                <p className="text-sm text-gray-600 mt-1">积分余额</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">使用统计</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">账户状态</p>
                    <p className="text-2xl font-bold">
                      {profileData && profileData.is_verified ? '已验证' : '未验证'}
                    </p>
                    <p className="text-sm text-gray-600">邮箱验证</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">用户类型</p>
                    <p className="text-2xl font-bold">
                      {profileData && profileData.is_superuser ? '管理员' : '普通用户'}
                    </p>
                    <p className="text-sm text-gray-600">权限级别</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'invitations':
        const handleGenerateInvitation = async () => {
          try {
            setIsLoading(true);
            const response = await generateInvitationCode(token, '用户设置页面生成');
            if (response.success) {
              showToast('邀请码生成成功！');
              loadInvitations(); // 重新加载邀请码列表
              loadProfileData(); // 重新加载资料以更新剩余配额
            } else {
              showToast('生成邀请码失败', 'error');
            }
          } catch (error) {
            console.error('生成邀请码失败:', error);
            let errorMessage = '生成邀请码失败，请稍后重试';
            
            // 检查是否是邮箱验证问题
            if (error.message && error.message.includes('验证邮箱')) {
              errorMessage = '请先验证您的邮箱，然后再生成邀请码';
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            showToast(errorMessage, 'error');
          } finally {
            setIsLoading(false);
          }
        };

        const handlePasswordUpdate = async (e) => {
          e.preventDefault();
          
          // 基本验证
          if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            showToast('请填写所有密码字段', 'error');
            return;
          }
          
          if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showToast('新密码和确认密码不一致', 'error');
            return;
          }
          
          if (passwordForm.newPassword.length < 8) {
            showToast('新密码长度不能少于8位', 'error');
            return;
          }
          
          try {
            setIsLoading(true);
            const response = await updatePassword(
              token, 
              passwordForm.currentPassword, 
              passwordForm.newPassword, 
              passwordForm.confirmPassword
            );
            
            if (response.success) {
              showToast('密码更新成功');
              // 清空表单
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
            } else {
              showToast(response.message || '密码更新失败', 'error');
            }
          } catch (error) {
            console.error('密码更新失败:', error);
            showToast(error.message || '密码更新失败，请稍后重试', 'error');
          } finally {
            setIsLoading(false);
          }
        };

        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">邀请好友</h2>
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">邀请配额</h3>
                <p className="text-3xl font-bold text-green-600">
                  {profileData ? profileData.invitation_remaining : '加载中...'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  剩余邀请码 (总配额: {profileData ? profileData.invitation_quota : '...'})
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">已生成</p>
                  <p className="text-2xl font-bold">
                    {profileData ? profileData.invitation_used : '...'}
                  </p>
                  <p className="text-sm text-gray-600">邀请码</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">总配额</p>
                  <p className="text-2xl font-bold">
                    {profileData ? profileData.invitation_quota : '...'}
                  </p>
                  <p className="text-sm text-gray-600">邀请码</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">生成邀请码</h3>
                <button 
                  onClick={handleGenerateInvitation}
                  disabled={isLoading || (profileData && profileData.invitation_remaining <= 0)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '生成中...' : '生成新的邀请码'}
                </button>
                {profileData && profileData.invitation_remaining <= 0 && (
                  <p className="text-sm text-red-600 mt-2">已达到邀请码生成上限</p>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">我的邀请码</h3>
                {invitations.length > 0 ? (
                  <div className="space-y-2">
                    {invitations.map((invitation, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                        <span className="font-mono text-sm">{invitation.code}</span>
                        <span className={`text-sm ${invitation.is_used ? 'text-green-600' : 'text-gray-500'}`}>
                          {invitation.is_used ? '已使用' : '未使用'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">暂无邀请码</p>
                )}
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
      
      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// 主页面组件，使用 Suspense 包装
const SettingsPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
};

export default SettingsPage;