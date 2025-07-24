'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import AuthContext from '../../../context/AuthContext';
import Header from '../../../components/common/Header';
import AdminRoute from '../../../components/common/AdminRoute';
import { ToastManager } from '../../../components/common/Toast';

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || '获取统计数据失败');
        }
      } catch (err) {
        console.error('获取统计数据失败:', err);
        setError(err.message);
        ToastManager.error(`获取统计数据失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  // 统计卡片组件
  const StatCard = ({ title, value, subtitle, icon, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-green-50 text-green-700 border-green-200",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
      red: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <div className={`${colorClasses[color]} border rounded-lg p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs opacity-60 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="text-2xl opacity-60">
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 头部导航 */}
        <Header 
          title="🛡️ 管理员后台"
          subtitle="系统统计和管理功能"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 快速导航 */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center"
              >
                <span className="mr-2">👥</span>
                用户管理
              </button>
              <button
                onClick={() => router.push('/admin/invitations')}
                className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center"
              >
                <span className="mr-2">🎫</span>
                邀请码管理
              </button>
            </div>
          </div>

          {/* 统计数据 */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载统计数据...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">加载失败</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                重新加载
              </button>
            </div>
          )}

          {stats && (
            <>
              {/* 主要统计指标 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="总用户数"
                  value={stats.total_users}
                  subtitle={`活跃用户: ${stats.active_users}`}
                  icon="👥"
                  color="blue"
                />
                <StatCard
                  title="验证用户"
                  value={stats.verified_users}
                  subtitle={`验证率: ${((stats.verified_users / stats.total_users) * 100).toFixed(1)}%`}
                  icon="✅"
                  color="green"
                />
                <StatCard
                  title="思维导图"
                  value={stats.total_mindmaps}
                  subtitle={`今日新增: ${stats.today_new_mindmaps}`}
                  icon="🌳"
                  color="purple"
                />
                <StatCard
                  title="邀请码"
                  value={stats.total_invitations}
                  subtitle={`已使用: ${stats.used_invitations}`}
                  icon="🎫"
                  color="yellow"
                />
              </div>

              {/* 今日活动 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 今日活动</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">新注册用户</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.today_new_users}</p>
                    </div>
                    <div className="text-blue-500 text-2xl">👤</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">新思维导图</p>
                      <p className="text-2xl font-bold text-purple-700">{stats.today_new_mindmaps}</p>
                    </div>
                    <div className="text-purple-500 text-2xl">🌳</div>
                  </div>
                </div>
              </div>

              {/* 系统信息 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ 系统信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">管理员账户</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">最后更新时间</span>
                    <span className="font-medium">
                      {new Date(stats.last_updated).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">邀请码使用率</span>
                    <span className="font-medium">
                      {((stats.used_invitations / stats.total_invitations) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">用户验证率</span>
                    <span className="font-medium">
                      {((stats.verified_users / stats.total_users) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminDashboard;