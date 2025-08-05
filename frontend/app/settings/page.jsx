'use client';
import { useState, useContext, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthContext from '@/context/AuthContext';

import { getProfile, updateProfile, generateInvitationCode, getUserInvitations, getCreditHistory } from '@/lib/api';
import Toast from '@/components/common/Toast';
import RedemptionCodeForm from '@/components/common/RedemptionCodeForm';
import RedemptionHistory from '@/components/common/RedemptionHistory';
import AvatarSelector, { getCurrentAvatar } from '@/components/common/AvatarSelector';
import AvatarDisplay from '@/components/common/AvatarDisplay';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Label } from "@/components/ui/Label";
import { User, CreditCard, Gift } from 'lucide-react';
// 占位：无密码体系，复用 Input 以避免未定义引用
const PasswordInput = Input;
// 停用旧密码相关API占位，防止未定义错误
const updatePassword = async () => ({ success: false, message: '已停用' });
import Image from 'next/image';



// 分离出使用 useSearchParams 的组件
const settingsNavItems = [
  { id: 'profile', name: '个人资料', icon: User, iconColor: 'text-blue-500' },
  { id: 'billing', name: '用量计费', icon: CreditCard, iconColor: 'text-green-500' },
  { id: 'invitations', name: '邀请好友', icon: Gift, iconColor: 'text-orange-500' },
];

const SettingsContent = () => {
  const { user, token, loading, refreshUser, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';
  const [profileData, setProfileData] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('default');
  const [tempAvatar, setTempAvatar] = useState('default'); // 临时头像选择
  const [isClient, setIsClient] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 积分历史相关状态
  const [creditHistory, setCreditHistory] = useState([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditPagination, setCreditPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_prev: false
  });
  const [currentBalance, setCurrentBalance] = useState(0);
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 初始化客户端状态
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化用户头像
  useEffect(() => {
    if (!isClient) return;
    const savedAvatar = getCurrentAvatar();
    setCurrentAvatar(savedAvatar);
    setTempAvatar(savedAvatar);
  }, [isClient]);

  // 处理头像选择（仅临时选择，不立即生效）
  const handleAvatarSelect = (avatarOption) => {
    setTempAvatar(avatarOption.id);
    // 不立即showToast，等保存时再提示
  };
  
  // 兑换码成功处理
  const handleRedemptionSuccess = (message, creditsGained, newBalance) => {
    showToast(message, 'success');
    setCurrentBalance(newBalance);
    // 重新加载积分历史以显示新的兑换记录
    loadCreditHistory();
  };
  
  // 兑换码失败处理
  const handleRedemptionError = (message) => {
    showToast(message, 'error');
  };
  
  // 格式化交易类型显示文本
  const formatTransactionType = (type) => {
    const typeMap = {
      'INITIAL_GRANT': '初始赠送',
      'MANUAL_GRANT': '手动发放',
      'DEDUCTION': '消费扣除',
      'REFUND': '失败退款',
      'DAILY_REWARD': '每日登录奖励'
    };
    return typeMap[type] || type;
  };
  
  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };
  
  // 获取交易金额的显示样式
  const getAmountStyle = (type) => {
    switch (type) {
      case 'DEDUCTION':
        return 'text-red-600 font-medium';
      case 'INITIAL_GRANT':
      case 'MANUAL_GRANT':
      case 'REFUND':
      case 'DAILY_REWARD':
        return 'text-green-600 font-medium';
      default:
        return 'text-text-primary font-medium';
    }
  };
  
  // 获取交易金额的显示文本（带正负号）
  const getAmountText = (type, amount) => {
    if (type === 'DEDUCTION') {
      return `-${amount}`;
    } else {
      return `+${amount}`;
    }
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
  
  // 加载积分历史数据
  const loadCreditHistory = async (page = 1, loadMore = false) => {
    if (!token) return;
    
    try {
      setCreditLoading(true);
      const response = await getCreditHistory(token, page, 20);
      
      if (response.success) {
        if (loadMore) {
          // 加载更多：追加到现有数据
          setCreditHistory(prev => [...prev, ...response.data]);
        } else {
          // 初始加载：替换所有数据
          setCreditHistory(response.data);
        }
        setCreditPagination(response.pagination);
        setCurrentBalance(response.current_balance);
      }
    } catch (error) {
      console.error('加载积分历史失败:', error);
      showToast('加载积分历史失败', 'error');
    } finally {
      setCreditLoading(false);
    }
  };



  useEffect(() => {
    if (loading) {
      return; // Wait until the auth state is resolved
    }

    if (!isAuthenticated) {
      router.push('/?auth=login');
      return;
    }

    // If authenticated, proceed to load data.
    if (process.env.NODE_ENV === 'development' && user?.id === 'mock-user-id') {
      console.log('开发模式：使用模拟数据，跳过API加载');
      return;
    }
    
    if (user && token) {
        loadProfileData();
        loadInvitations();
        loadCreditHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md mx-4 p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleGenerateInvitation = async () => {
    try {
      setIsLoading(true);
      const response = await generateInvitationCode(token, '用户设置页面生成');
      if (response.success) {
        showToast('邀请码生成成功！');
        loadInvitations(); // 重新加载邀请码列表
        loadProfileData(); // 重新加载资料以更新剩余配额
      } else {
        showToast(response.message || '生成邀请码失败', 'error');
      }
    } catch (error) {
      console.error('生成邀请码失败:', error);
      let errorMessage = '生成邀请码失败，请稍后重试';
      
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

  // 保存个人资料
    const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const response = await updateProfile({ display_name: displayName }, token);
      
      // 保存头像选择到本地存储
      if (tempAvatar !== currentAvatar && isClient) {
        localStorage.setItem('userAvatar', tempAvatar);
        setCurrentAvatar(tempAvatar);
      }
      
      // 更新全局用户状态 - 刷新用户信息以确保所有组件获得最新数据
      await refreshUser();
      
      // 触发头像变更事件，通知其他组件更新头像显示
      if (tempAvatar !== currentAvatar && isClient) {
        // 派发自定义事件，通知其他组件头像已更改
        window.dispatchEvent(new CustomEvent('avatarChanged', { 
          detail: { newAvatar: tempAvatar } 
        }));
      }
      
      showToast('个人资料更新成功！');
      // 移除loadProfileData调用，因为refreshUser已经更新了全局状态
    } catch (error) {
      console.error('更新个人资料失败:', error);
      showToast('更新失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };






  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={(value) => router.push(`/settings?tab=${value}`)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* 左侧导航 */}
            <aside className="md:col-span-1">
              <div className="flex flex-col space-y-1 bg-white rounded-xl border border-gray-200 p-2 h-fit">
                {settingsNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/settings?tab=${item.id}`)}
                    className={`w-full flex items-center justify-start px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === item.id 
                        ? 'bg-black text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-3 w-4 h-4 ${
                      activeTab === item.id ? 'text-white' : item.iconColor
                    }`} />
                    {item.name}
                  </button>
                ))}
              </div>
            </aside>

            {/* 右侧内容区 */}
            <main className="md:col-span-3">
                <TabsContent value="profile">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">个人资料</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <Label>头像</Label>
                        <div className="flex items-center space-x-4 mt-2">
                          <AvatarDisplay 
                            avatarId={tempAvatar}
                            size={80}
                            className="border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setIsAvatarSelectorOpen(true)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            更换头像
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">邮箱地址</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData?.email || user?.email || ''}
                          disabled
                          className="bg-gray-50 text-gray-500 mt-2 border-gray-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="displayName">显示名称</Label>
                        <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="输入您的显示名称"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="registrationDate">注册时间</Label>
                        <Input
                          id="registrationDate"
                          type="text"
                          value={profileData ? new Date(profileData.created_at).toLocaleString() : '加载中...'}
                          disabled
                          className="bg-gray-50 text-gray-500 mt-2 border-gray-200"
                        />
                      </div>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="px-6 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? '保存中...' : '保存更改'}
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="invitations">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">邀请好友</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">邀请配额</h3>
                        <p className="text-3xl font-bold text-gray-900">
                          {profileData ? profileData.invitation_remaining : '加载中...'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          剩余邀请码 (总配额: {profileData ? profileData.invitation_quota : '...'})
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                          <p className="text-sm text-gray-600">已生成</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {profileData ? profileData.invitation_used : '...'}
                          </p>
                          <p className="text-sm text-gray-500">邀请码</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                          <p className="text-sm text-gray-600">总配额</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {profileData ? profileData.invitation_quota : '...'}
                          </p>
                          <p className="text-sm text-gray-500">邀请码</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">生成邀请码</h3>
                        <button 
                          onClick={handleGenerateInvitation}
                          disabled={isLoading || (profileData && profileData.invitation_remaining <= 0)}
                          className="px-6 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? '生成中...' : '生成新的邀请码'}
                        </button>
                        {profileData && profileData.invitation_remaining <= 0 && (
                          <p className="text-sm text-red-600 mt-2">已达到邀请码生成上限</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">我的邀请码</h3>
                        {invitations.length > 0 ? (
                          <div className="space-y-2">
                            {invitations.map((invitation, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="font-mono text-sm text-gray-900">{invitation.code}</span>
                                    <button
                                      onClick={() => {
                                        const inviteLink = `https://thinkso.io/register?invitation_code=${invitation.code}`;
                                        navigator.clipboard.writeText(inviteLink).then(() => {
                                          showToast('邀请链接已复制到剪贴板！', 'success');
                                        }).catch(() => {
                                          showToast('复制失败，请手动复制', 'error');
                                        });
                                      }}
                                      className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 hover:text-gray-800 transition-colors"
                                      title="复制邀请链接"
                                    >
                                      复制链接
                                    </button>
                                  </div>
                                  <span className={`text-sm px-2 py-1 rounded-full ${
                                    invitation.is_used 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {invitation.is_used ? '已使用' : '未使用'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">暂无邀请码</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
                <TabsContent value="billing">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">用量计费</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">当前积分余额</h3>
                          <p className="text-3xl font-bold text-gray-900">
                            {currentBalance}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">积分</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <RedemptionCodeForm 
                            onRedemptionSuccess={handleRedemptionSuccess}
                            onRedemptionError={handleRedemptionError}
                          />
                          <RedemptionHistory />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">积分历史</h3>
                          {creditLoading && !creditHistory.length ? (
                            <p className="text-gray-600">加载中...</p>
                          ) : creditHistory.length > 0 ? (
                            <div className="space-y-3">
                              {creditHistory.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <div>
                                    <p className="font-semibold text-gray-900">{formatTransactionType(item.transaction_type)}</p>
                                    <p className="text-sm text-gray-600">{formatDate(item.created_at)}</p>
                                  </div>
                                  <p className={getAmountStyle(item.transaction_type)}>{getAmountText(item.transaction_type, item.amount)}</p>
                                </div>
                              ))}
                              {creditPagination.has_next && (
                                <button 
                                  onClick={() => loadCreditHistory(creditPagination.current_page + 1, true)} 
                                  disabled={creditLoading}
                                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {creditLoading ? '加载中...' : '加载更多'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-600">暂无积分历史记录。</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </main>
          </div>
        </Tabs>
      </div>
      
      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* 头像选择器 */}
      <AvatarSelector
        isOpen={isAvatarSelectorOpen}
        onClose={() => setIsAvatarSelectorOpen(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={tempAvatar}
      />
    </div>
  );
};

// 主页面组件，使用 Suspense 包装
const SettingsPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md mx-4 p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
};

export default SettingsPage;