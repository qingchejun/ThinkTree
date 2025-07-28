'use client';
import { useState, useContext, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthContext from '@/context/AuthContext';
import Header from '@/components/common/Header';
import { getProfile, updateProfile, generateInvitationCode, getUserInvitations, updatePassword } from '@/lib/api';
import Toast from '@/components/common/Toast';
import PasswordInput from '@/components/common/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

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
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-text-secondary">加载中...</p>
            </div>
          </CardContent>
        </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>个人资料</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    邮箱地址
                  </label>
                  <Input
                    type="email"
                    value={profileData?.email || user?.email || ''}
                    disabled
                    className="bg-background-secondary text-text-tertiary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    显示名称
                  </label>
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="输入您的显示名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    注册时间
                  </label>
                  <Input
                    type="text"
                    value={profileData ? new Date(profileData.created_at).toLocaleString() : '加载中...'}
                    disabled
                    className="bg-background-secondary text-text-tertiary"
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? '保存中...' : '保存更改'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'security':
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
          <Card>
            <CardHeader>
              <CardTitle>账户与安全</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">修改密码</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        当前密码
                      </label>
                      <PasswordInput
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        placeholder="请输入当前密码"
                        className="border border-border-primary bg-transparent px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        新密码
                      </label>
                      <PasswordInput
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        placeholder="请输入新密码（至少8位）"
                        className="border border-border-primary bg-transparent px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        确认新密码
                      </label>
                      <PasswordInput
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        placeholder="请再次输入新密码"
                        className="border border-border-primary bg-transparent px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      />
                    </div>
                    <Button 
                      onClick={handlePasswordUpdate}
                      disabled={isLoading}
                    >
                      {isLoading ? '更新中...' : '更新密码'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'billing':
        return (
          <Card>
            <CardHeader>
              <CardTitle>用量与计费</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">积分系统</h3>
                  <p className="text-lg text-gray-600">
                    积分系统正在重新设计中...
                  </p>
                  <p className="text-sm text-gray-500 mt-1">敬请期待新版本</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">使用统计</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-background-secondary">
                      <CardContent className="pt-6">
                        <p className="text-sm text-text-secondary">账户状态</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {profileData && profileData.is_verified ? '已验证' : '未验证'}
                        </p>
                        <p className="text-sm text-text-tertiary">邮箱验证</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-background-secondary">
                      <CardContent className="pt-6">
                        <p className="text-sm text-text-secondary">用户类型</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {profileData && profileData.is_superuser ? '管理员' : '普通用户'}
                        </p>
                        <p className="text-sm text-text-tertiary">权限级别</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

        return (
          <Card>
            <CardHeader>
              <CardTitle>邀请好友</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-medium text-green-900 mb-2">邀请配额</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {profileData ? profileData.invitation_remaining : '加载中...'}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    剩余邀请码 (总配额: {profileData ? profileData.invitation_quota : '...'})
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-background-secondary">
                    <CardContent className="pt-6">
                      <p className="text-sm text-text-secondary">已生成</p>
                      <p className="text-2xl font-bold text-text-primary">
                        {profileData ? profileData.invitation_used : '...'}
                      </p>
                      <p className="text-sm text-text-tertiary">邀请码</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-background-secondary">
                    <CardContent className="pt-6">
                      <p className="text-sm text-text-secondary">总配额</p>
                      <p className="text-2xl font-bold text-text-primary">
                        {profileData ? profileData.invitation_quota : '...'}
                      </p>
                      <p className="text-sm text-text-tertiary">邀请码</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">生成邀请码</h3>
                  <Button 
                    onClick={handleGenerateInvitation}
                    disabled={isLoading || (profileData && profileData.invitation_remaining <= 0)}
                    variant="secondary"
                  >
                    {isLoading ? '生成中...' : '生成新的邀请码'}
                  </Button>
                  {profileData && profileData.invitation_remaining <= 0 && (
                    <p className="text-sm text-red-600 mt-2">已达到邀请码生成上限</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">我的邀请码</h3>
                  {invitations.length > 0 ? (
                    <div className="space-y-2">
                      {invitations.map((invitation, index) => (
                        <Card key={index} className="border border-border-secondary">
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm text-text-primary">{invitation.code}</span>
                              <span className={`text-sm ${invitation.is_used ? 'text-green-600' : 'text-text-tertiary'}`}>
                                {invitation.is_used ? '已使用' : '未使用'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-tertiary text-sm">暂无邀请码</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-text-secondary">功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* 头部导航 */}
      <Header 
        title="⚙️ 账户设置"
        subtitle="管理您的个人资料和账户偏好设置"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧导航栏 */}
          <div className="lg:w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <nav>
                  <ul className="space-y-2">
                    {settingsNavItems.map((item) => (
                      <li key={item.id}>
                        <Button
                          onClick={() => setActiveTab(item.id)}
                          variant="ghost"
                          className={`w-full justify-start ${
                            activeTab === item.id
                              ? 'bg-background-secondary text-brand-primary'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <span className="mr-3 text-lg">{item.icon}</span>
                          {item.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </CardContent>
            </Card>
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
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-text-secondary">加载中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
};

export default SettingsPage;