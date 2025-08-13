'use client';
import { useState, useContext, useEffect, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthContext from '@/context/AuthContext';

import { getProfile, updateProfile, generateInvitationCode, getUserInvitations, getCreditHistory, getReferralLink, getReferralStats, getReferralHistory } from '@/lib/api';
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
import { User, CreditCard, Gift, Share2, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
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
  const { user, loading, refreshUser, isAuthenticated } = useContext(AuthContext);
  const toastApi = useToast();
  const isAdmin = !!user?.is_superuser;
  const router = useRouter();
  const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';
  const [profileData, setProfileData] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [referralLink, setReferralLink] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [referralHistory, setReferralHistory] = useState([]);
  // 邀请记录筛选
  const [refSearch, setRefSearch] = useState('');
  const [refRange, setRefRange] = useState('ALL'); // ALL|7|30
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('blob:default');
  const [tempAvatar, setTempAvatar] = useState('blob:default'); // 临时头像选择
  const [isClient, setIsClient] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 积分历史相关状态
  const [creditHistory, setCreditHistory] = useState([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState(null);
  const creditRetryRef = useRef(0);
  const creditInFlightRef = useRef(false);
  const [creditPagination, setCreditPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_prev: false
  });
  const [currentBalance, setCurrentBalance] = useState(0);
  // 计费筛选
  const [historyRange, setHistoryRange] = useState('ALL'); // ALL|7|30
  const [typeFilters, setTypeFilters] = useState(new Set()); // e.g., INVITE/REDEEM/DEDUCTION/REFUND/DAILY_REWARD
  // 禁用项 tooltip 控制
  const [disabledTipId, setDisabledTipId] = useState(null);
  const [disabledTipVisible, setDisabledTipVisible] = useState(false);
  const tooltipTimerRef = useRef(null);
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // 缩短显示时间：成功1200ms、信息1600ms、警告2000ms、错误4000ms
    const ms = type === 'success' ? 1200 : type === 'info' ? 1600 : type === 'warning' ? 2000 : 4000;
    setTimeout(() => setToast(null), ms);
  };

  // 初始化客户端状态
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化用户头像
  useEffect(() => {
    if (!isClient) return;
    const savedAvatar = getCurrentAvatar();
    const fallback = 'blob:default';
    setCurrentAvatar(savedAvatar || fallback);
    setTempAvatar(savedAvatar || fallback);
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

  // 共享：邀请链接复制/分享的就地微反馈
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkShared, setLinkShared] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrCanvasRef = useRef(null);
  const [qrBusy, setQrBusy] = useState(false);
  const handleCopyLink = async (referralLink) => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1200);
    } catch (e) {
      toastApi.error('复制失败，请手动复制');
    }
  };
  const handleShareLink = async (referralLink) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ThinkSo 邀请', text: '和我一起用 ThinkSo，领取积分', url: referralLink });
        setLinkShared(true);
        setTimeout(() => setLinkShared(false), 1200);
      } else {
        await navigator.clipboard.writeText(referralLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1200);
      }
    } catch (e) {
      // 用户取消不提示；其余错误提示
      if (e && e.name !== 'AbortError') toastApi.error('分享失败');
    }
  };

  // 生成二维码（展开时异步渲染）
  useEffect(() => {
    (async () => {
      if (!showQR) return; 
      if (!referralLink?.referral_link) return;
      if (!qrCanvasRef.current) return;
      try {
        setQrBusy(true);
        const QRCode = (await import('qrcode')).default;
        await QRCode.toCanvas(qrCanvasRef.current, referralLink.referral_link, { width: 184, margin: 2 });
      } catch (e) {
        toastApi.error('二维码生成失败');
      } finally {
        setQrBusy(false);
      }
    })();
  }, [showQR, referralLink]);

  const downloadQR = () => {
    try {
      const canvas = qrCanvasRef.current;
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'thinkso_invite.png';
      a.click();
    } catch {}
  };

  // 过滤邀请记录
  const filteredReferrals = useMemo(() => {
    const now = Date.now();
    const inRange = (ts) => {
      if (refRange === 'ALL') return true;
      const days = refRange === '7' ? 7 : 30;
      return (now - new Date(ts).getTime()) <= days * 24 * 60 * 60 * 1000;
    };
    const q = refSearch.trim().toLowerCase();
    const match = (e) => {
      if (!q) return true;
      const id = String(e.invitee_user_id || '').toLowerCase();
      const mail = String(e.invitee_email_masked || '').toLowerCase();
      return id.includes(q) || mail.includes(q);
    };
    return (referralHistory || []).filter(e => inRange(e.created_at) && match(e));
  }, [referralHistory, refRange, refSearch]);

  const exportReferralCSV = () => {
    const headers = ['invitee_user_id','invitee_email','created_at'];
    const lines = [headers.join(',')];
    filteredReferrals.forEach((e) => {
      lines.push([e.invitee_user_id, (e.invitee_email_masked||'').replace(/,/g,' '), new Date(e.created_at).toISOString()].join(','));
    });
    const blob = new Blob(["\ufeff" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 历史类型归一
  const getTypeKey = (item) => {
    const summary = (item.summary || '').toLowerCase();
    const t = (item.transaction_type || item.type || '').toUpperCase();
    if (summary.includes('邀请')) return 'INVITE';
    if (summary.includes('兑换码')) return 'REDEEM';
    if (summary.includes('退款')) return 'REFUND';
    if (summary.includes('每日')) return 'DAILY_REWARD';
    if (t === 'DEDUCTION' || summary.includes('扣除')) return 'DEDUCTION';
    return 'GRANT';
  };

  // 过滤后的历史
  const displayHistory = useMemo(() => {
    const now = Date.now();
    const inRange = (ts) => {
      if (historyRange === 'ALL') return true;
      const days = historyRange === '7' ? 7 : 30;
      return (now - new Date(ts).getTime()) <= days * 24 * 60 * 60 * 1000;
    };
    const typeOk = (it) => (typeFilters.size === 0 ? true : typeFilters.has(getTypeKey(it)));
    return (creditHistory || []).filter((it) => inRange(it.created_at) && typeOk(it));
  }, [creditHistory, historyRange, typeFilters]);

  const toggleType = (key) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // 今日变动计算
  const todaysDelta = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let sum = 0;
    (creditHistory || []).forEach((it) => {
      const d = new Date(it.created_at);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) {
        const type = (it.transaction_type || it.type);
        const amount = Number(it.amount || 0);
        sum += type === 'DEDUCTION' ? -amount : amount;
      }
    });
    return sum;
  }, [creditHistory]);

  // 计算迷你趋势图数据（基于 displayHistory 与当前 historyRange）
  const sparkData = useMemo(() => {
    const days = historyRange === '7' ? 7 : historyRange === '30' ? 30 : 7;
    // 构建最近 N 天的日期桶
    const buckets = Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1 - i));
      return { day: new Date(d), value: 0 };
    });
    const toKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const indexByKey = new Map(buckets.map((b, i) => [toKey(b.day), i]));
    displayHistory.forEach((it) => {
      const dt = new Date(it.created_at);
      dt.setHours(0, 0, 0, 0);
      const idx = indexByKey.get(toKey(dt));
      if (idx != null) {
        const type = (it.transaction_type || it.type);
        const amount = Number(it.amount || 0);
        const signed = type === 'DEDUCTION' ? -amount : amount;
        buckets[idx].value += signed;
      }
    });
    // 生成 polyline points
    const values = buckets.map((b) => b.value);
    const maxV = Math.max(1, ...values, 0);
    const minV = Math.min(0, ...values);
    const w = 180, h = 40, pad = 2;
    const scaleX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, days - 1);
    const scaleY = (v) => {
      if (maxV === minV) return h / 2;
      return h - pad - ((v - minV) * (h - pad * 2)) / (maxV - minV);
    };
    const points = values.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ');
    const last = values[values.length - 1] || 0;
    const trendUp = last >= 0;
    return { points, w, h, trendUp, last, days };
  }, [displayHistory, historyRange]);

  const exportCSV = () => {
    const headers = ['id','summary','type','amount','created_at'];
    const lines = [headers.join(',')];
    displayHistory.forEach((it) => {
      const row = [it.id, (it.summary || formatTransactionSummary(it)).replace(/,/g,' '), (it.transaction_type || it.type), it.amount, it.created_at];
      lines.push(row.join(','));
    });
    const blob = new Blob(["\ufeff" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credits_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // 格式化交易类型显示文本
  const formatTransactionType = (type) => {
    const typeMap = {
      INITIAL_GRANT: '新用户注册',
      MANUAL_GRANT: '手动发放',
      DEDUCTION: '消费扣除',
      REFUND: '退款/返还',
      DAILY_REWARD: '每日登录',
    };
    return typeMap[type] || type;
  };

  const formatTransactionSummary = (item) => {
    const desc = (item.description || '').toLowerCase();
    if (desc.includes('每日登录')) return '每日登录';
    if (desc.includes('邀请奖励')) return '邀请奖励';
    if (desc.includes('受邀注册奖励')) return '受邀注册奖励';
    if (desc.includes('兑换码')) return '兑换码奖励';
    // fallback to type name
    return formatTransactionType(item.type);
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
    if (!user) return;
    
    try {
      setIsLoading(true);
      const profile = await getProfile();
      setProfileData(profile);
      setDisplayName(profile.display_name || '');
    } catch (error) {
      console.error('加载用户资料失败:', error);
      showToast('加载用户资料失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载推荐数据
  const loadInvitations = async () => {
    if (!user) return;
    
    try {
      const [link, stats, history] = await Promise.all([
        getReferralLink().catch(() => null),
        getReferralStats().catch(() => null),
        getReferralHistory().catch(() => ({ items: [] })),
      ]);
      setReferralLink(link);
      setReferralStats(stats);
      setReferralHistory(history?.items || []);
      // 兼容旧邀请码（管理员一次性邀请码）
      const invitationsList = await getUserInvitations().catch(() => []);
      setInvitations(invitationsList || []);
    } catch (error) {
      console.error('加载邀请码失败:', error);
      // 如果API不存在，使用空数组作为默认值
      setInvitations([]);
    }
  };
  
  // 加载积分历史数据
  const loadCreditHistory = async (page = 1, loadMore = false) => {
    if (!user) return;
    if (creditInFlightRef.current) return;
    
    try {
      creditInFlightRef.current = true;
      setCreditLoading(true);
      setCreditError(null);
      const response = await getCreditHistory(page, 20);
      
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
      } else {
        setCreditError(response.message || '加载积分历史失败');
      }
    } catch (error) {
      console.error('加载积分历史失败:', error);
      setCreditError('网络异常，加载失败');
    } finally {
      setCreditLoading(false);
      creditInFlightRef.current = false;
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
    
    if (user) {
        loadProfileData();
        loadInvitations();
        loadCreditHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isAuthenticated, router]);

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
      const response = await generateInvitationCode('用户设置页面生成');
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
      const response = await updateProfile({ display_name: displayName });
      
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
        {/* 统一页头：标题/描述/操作组 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="mb-3 md:mb-0">
            <h1 className="text-2xl font-semibold text-gray-900">账户设置</h1>
            <p className="text-sm text-gray-500 mt-1">管理个人资料、用量计费与邀请奖励。</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600 hidden sm:block">当前积分：<span className="font-semibold text-gray-900">{currentBalance}</span></div>
            <button onClick={() => { loadProfileData(); loadInvitations(); loadCreditHistory(); }} className="inline-flex items-center px-3 py-1.5 text-xs border rounded-lg bg-white text-gray-700 hover:bg-gray-50">
              <RefreshCcw className="w-3.5 h-3.5 mr-1"/> 刷新资料
            </button>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => router.push(`/settings?tab=${value}`)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* 左侧导航 */}
            <aside className="md:col-span-1">
              <div className="flex flex-col space-y-1 bg-white rounded-xl border border-gray-200 p-2 h-fit">
                {settingsNavItems.map((item) => {
                  const isInvitations = item.id === 'invitations'
                  const isDisabled = isInvitations && !isAdmin
                  const isActive = activeTab === item.id
                  const baseClass = isDisabled
                    ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                    : isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  const iconClass = isDisabled ? 'text-gray-300' : (isActive ? 'text-white' : item.iconColor)
                  return (
                    <div key={item.id} className="relative">
                      <button
                        role="link"
                        tabIndex={0}
                        onClick={() => { if (!isDisabled) router.push(`/settings?tab=${item.id}#${item.id}`) }}
                        onKeyDown={(e) => { if (isDisabled) { if (e.key === 'Escape') { setDisabledTipVisible(false); setDisabledTipId(null); } return; } if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/settings?tab=${item.id}#${item.id}`) } }}
                        onMouseEnter={() => { if (!isDisabled) return; setDisabledTipId(item.id); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = setTimeout(() => setDisabledTipVisible(true), 200); }}
                        onMouseLeave={() => { if (!isDisabled) return; if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); setDisabledTipVisible(false); setDisabledTipId(null); }}
                        onFocus={() => { if (!isDisabled) return; setDisabledTipId(item.id); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = setTimeout(() => setDisabledTipVisible(true), 200); }}
                        onBlur={() => { if (!isDisabled) return; if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); setDisabledTipVisible(false); setDisabledTipId(null); }}
                        aria-disabled={isDisabled}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full flex items-center justify-start px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${baseClass}`}
                        aria-describedby={isDisabled && disabledTipVisible && disabledTipId === item.id ? `${item.id}-tip` : undefined}
                      >
                        <item.icon className={`mr-3 w-4 h-4 ${iconClass}`} aria-hidden={isDisabled ? true : undefined} />
                        {item.name}{isDisabled && '（开发中）'}
                      </button>
                      {isDisabled && disabledTipVisible && disabledTipId === item.id && (
                        <div id={`${item.id}-tip`} role="tooltip" className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs shadow-md">
                          暂未开放
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </aside>

            {/* 右侧内容区 */}
            <main className="md:col-span-3">
                <TabsContent value="profile">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                    <h3 id="profile" className="text-lg font-semibold text-gray-900">个人资料</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="hidden sm:inline">积分 <span className="font-semibold text-gray-900">{currentBalance}</span></span>
                      <button onClick={() => loadProfileData()} className="inline-flex items-center px-2.5 py-1 border rounded-lg bg-white text-gray-700 hover:bg-gray-50">
                        <RefreshCcw className="w-3.5 h-3.5 mr-1"/> 刷新
                      </button>
                    </div>
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
                    <h3 id="invitations" className="text-lg font-semibold text-gray-900">邀请好友</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* 新推荐卡片 */}
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">我的邀请链接</h3>
                          <p className="text-sm text-gray-600 mb-3">{referralLink?.rule_text || '你和好友各得 100 积分'}</p>
                          <div className="flex items-center gap-2">
                            <span className="flex-1 font-mono text-sm break-all text-gray-900 select-all">{referralLink?.referral_link || ''}</span>
                            <button
                              onClick={() => referralLink?.referral_link && handleCopyLink(referralLink.referral_link)}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${linkCopied ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200'}`}
                              disabled={!referralLink?.referral_link}
                              title={linkCopied ? '已复制' : '复制'}
                            >
                              {linkCopied ? (
                                <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                              )}
                            </button>
                            <button
                              onClick={() => referralLink?.referral_link && handleShareLink(referralLink.referral_link)}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${linkShared ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200'}`}
                              disabled={!referralLink?.referral_link}
                              title={linkShared ? '已分享' : '分享'}
                            >
                              <Share2 className={`w-4 h-4 ${linkShared ? 'text-blue-600' : 'text-gray-700'}`} />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">已邀请 {referralStats?.invited_count ?? referralLink?.invited_count ?? 0}/{referralStats?.limit ?? referralLink?.limit ?? 10}</div>
                          <div className="mt-3">
                            <button onClick={() => setShowQR(!showQR)} className="text-xs px-2 py-1 border rounded-lg text-gray-700 bg-white hover:bg-gray-50">{showQR ? '隐藏二维码' : '显示二维码'}</button>
                            {showQR && (
                              <div className="mt-3 p-3 border rounded-lg inline-flex flex-col items-center bg-white">
                                <canvas ref={qrCanvasRef} width={184} height={184} className="rounded"/>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-gray-500">扫码或保存图片</span>
                                  <button onClick={downloadQR} className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50">保存PNG</button>
                                </div>
                              </div>
                            )}
                          </div>
                      </div>


                      {user?.is_superuser && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">管理员一次性邀请码</h3>
                          <button 
                            onClick={handleGenerateInvitation}
                            disabled={isLoading}
                            className="px-6 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? '生成中...' : '生成一次性邀请码（管理员）'}
                          </button>
                      </div>
                      )}
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium text-gray-900">我的邀请记录</h3>
                          {isAdmin && referralHistory.length > 0 && (
                            <button onClick={exportReferralCSV} className="text-xs px-2.5 py-1.5 border rounded-lg bg-white text-gray-700 hover:bg-gray-50">导出 CSV</button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3 text-xs">
                          <Input value={refSearch} onChange={(e)=>setRefSearch(e.target.value)} placeholder="搜索邮箱或ID" className="h-8 w-56"/>
                          <span className="text-gray-500">时间:</span>
                          {['ALL','7','30'].map(v => (
                            <button key={v} onClick={()=>setRefRange(v)} className={`px-2 py-1 rounded-full border ${refRange===v?'bg-black text-white border-black':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{v==='ALL'?'全部':`${v}天`}</button>
                          ))}
                        </div>
                        {filteredReferrals.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-left text-gray-500">
                                  <th className="py-2 pr-4">受邀用户ID</th>
                                  <th className="py-2 pr-4">受邀邮箱</th>
                                  <th className="py-2 pr-4">时间</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredReferrals.map((e, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="py-2 pr-4">{e.invitee_user_id}</td>
                                    <td className="py-2 pr-4">{e.invitee_email_masked || '***'}</td>
                                    <td className="py-2 pr-4 text-gray-600">{new Date(e.created_at).toLocaleString('zh-CN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">
                            <p>暂无邀请记录</p>
                            {referralLink?.referral_link && (
                              <button onClick={()=>handleCopyLink(referralLink.referral_link)} className="mt-2 inline-flex items-center px-3 py-1.5 text-xs border rounded-lg bg-white text-gray-700 hover:bg-gray-50">复制我的邀请链接</button>
                            )}
                          </div>
                        )}
                      </div>
                      {user?.is_superuser && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">我的管理员邀请码（一次性）</h3>
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
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
                 <TabsContent value="billing">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <h3 id="billing" className="text-lg font-semibold text-gray-900">用量计费</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">当前积分余额</h3>
                          <p className="text-3xl font-bold text-gray-900">
                            {currentBalance}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">积分</p>
                          {/* 迷你趋势图 */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">最近{historyRange==='30'?'30':'7'}天趋势</span>
                              <span className={`text-xs ${sparkData.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>{sparkData.last >= 0 ? '+' : ''}{sparkData.last}</span>
                            </div>
                            <svg width={sparkData.w} height={sparkData.h} className="block">
                              <polyline fill="none" stroke={sparkData.trendUp ? '#10b981' : '#ef4444'} strokeWidth="2" points={sparkData.points} />
                            </svg>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div id="redeem" className="contents"></div>
                          <RedemptionCodeForm 
                            onRedemptionSuccess={handleRedemptionSuccess}
                            onRedemptionError={handleRedemptionError}
                          />
                          <RedemptionHistory />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">积分历史</h3>
                          <div className="flex items-center gap-2">
                              {isAdmin && (
                                <button onClick={exportCSV} className="inline-flex items-center px-2.5 py-1.5 text-xs border rounded-lg text-gray-700 bg-white hover:bg-gray-50">导出 CSV</button>
                              )}
                              <button onClick={() => { const now=Date.now(); if (now - creditRetryRef.current < 800) return; creditRetryRef.current = now; loadCreditHistory(1, false); }} className="inline-flex items-center px-2.5 py-1.5 text-xs border rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                                <RefreshCcw className="w-3.5 h-3.5 mr-1"/> 重新加载
                              </button>
                            </div>
                          </div>
                          {/* 筛选条 */}
                          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                            <span className="text-gray-500">时间:</span>
                            {['ALL','7','30'].map(v => (
                              <button key={v} onClick={() => setHistoryRange(v)} className={`px-2 py-1 rounded-full border ${historyRange===v?'bg-black text-white border-black':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{v==='ALL'?'全部':`${v}天`}</button>
                            ))}
                            <span className="ml-3 text-gray-500">类型:</span>
                            {['INVITE','REDEEM','DAILY_REWARD','DEDUCTION','REFUND','GRANT'].map(k => (
                              <button key={k} onClick={() => toggleType(k)} className={`px-2 py-1 rounded-full border ${typeFilters.has(k)?'bg-black text-white border-black':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{
                                {INVITE:'邀请',REDEEM:'兑换码',DAILY_REWARD:'每日登录',DEDUCTION:'扣除',REFUND:'退款',GRANT:'奖励'}[k]
                              }</button>
                            ))}
                            {/* 已选条件 chips 与清空快捷键 */}
                            <div
                              className="ml-auto flex items-center gap-2"
                              tabIndex={0}
                              onKeyDown={(e)=>{ if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') { setHistoryRange('ALL'); setTypeFilters(new Set()); } }}
                            >
                              {historyRange !== 'ALL' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  {historyRange==='7'?'7天':'30天'}
                                  <button onClick={()=> setHistoryRange('ALL')} className="hover:text-gray-900" aria-label="移除时间筛选">×</button>
                                </span>
                              )}
                              {Array.from(typeFilters).map(k => (
                                <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  {{INVITE:'邀请',REDEEM:'兑换码',DAILY_REWARD:'每日登录',DEDUCTION:'扣除',REFUND:'退款',GRANT:'奖励'}[k]}
                                  <button onClick={()=> { const next = new Set(typeFilters); next.delete(k); setTypeFilters(next); }} className="hover:text-gray-900" aria-label={`移除${k}筛选`}>×</button>
                                </span>
                              ))}
                              {(historyRange!=='ALL' || typeFilters.size>0) && (
                                <button onClick={()=> { setHistoryRange('ALL'); setTypeFilters(new Set()); }} className="text-gray-600 hover:text-gray-900">清空</button>
                              )}
                            </div>
                          </div>
                          {creditError && (
                            <div className="p-3 mb-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center justify-between" role="alert">
                              <span>{creditError}</span>
                              <button onClick={() => { const now=Date.now(); if (now - creditRetryRef.current < 800) return; creditRetryRef.current = now; loadCreditHistory(1, false); }} disabled={creditLoading} className="px-2 py-1 border rounded bg-white text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed">重试</button>
                            </div>
                          )}
                          {creditLoading && !creditHistory.length ? (
                            <div className="space-y-3">
                              {Array.from({length:8}).map((_,i)=> (
                                <div key={i} className="p-4 rounded-lg border border-gray-200 bg-gray-50 animate-pulse">
                                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"/>
                                  <div className="h-3 bg-gray-200 rounded w-1/4"/>
                                </div>
                              ))}
                            </div>
                          ) : creditHistory.length > 0 ? (
                            <div className="space-y-3">
                              {displayHistory.length === 0 ? (
                                <div className="text-center p-6 rounded-lg border border-gray-200 bg-white">
                                  <p className="text-sm text-gray-600">无符合当前筛选条件的记录</p>
                                  <button onClick={() => { setHistoryRange('ALL'); setTypeFilters(new Set()); }} className="mt-3 inline-flex items-center px-2.5 py-1.5 text-xs border rounded-lg bg-white text-gray-700 hover:bg-gray-50">清除筛选</button>
                                </div>
                              ) : null}
                              {displayHistory.map((item) => (
                                <div key={item.id} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{item.summary || formatTransactionSummary(item)}</p>
                                    <p className="text-sm text-gray-600">{formatDate(item.created_at)}</p>
                                  </div>
                                  <div className="ml-4 text-right">
                                    <p className={getAmountStyle(item.transaction_type || item.type)}>{getAmountText(item.transaction_type || item.type, item.amount)}</p>
                                  </div>
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
                            <div className="text-center p-8 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                              <svg className="w-10 h-10 mx-auto text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v6a5 5 0 0 1-4 4.9V22a1 1 0 1 1-2 0v-2H10v2a1 1 0 1 1-2 0v-2.1A5 5 0 0 1 4 15V9a3 3 0 0 1 3-3h1V5a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v1h4V5a2 2 0 0 0-2-2Z"/></svg>
                              <p className="mt-2 text-sm text-gray-600">还没有积分历史，试试以下操作</p>
                              <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                                <a href="#redeem" className="px-2.5 py-1.5 border rounded-lg bg-white text-gray-700 hover:bg-gray-50">输入兑换码</a>
                                {isAdmin ? (
                                  <a href="/settings?tab=invitations#invitations" className="px-2.5 py-1.5 border rounded-lg bg-white text-gray-700 hover:bg-gray-50">邀请好友</a>
                                ) : null}
                              </div>
                            </div>
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
        user={user}
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