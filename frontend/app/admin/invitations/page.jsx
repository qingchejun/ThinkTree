'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import AuthContext from '../../../context/AuthContext';
import Header from '../../../components/common/Header';
import AdminRoute from '../../../components/common/AdminRoute';
// 移除ToastManager，使用内联提示样式

const AdminInvitations = () => {
  const { token } = useContext(AuthContext);
  const router = useRouter();
  
  // 状态管理
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 错误消息状态
  const [successMessage, setSuccessMessage] = useState(null); // 成功消息状态
  const [error, setError] = useState(null);
  
  // 分页和筛选
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvitations, setTotalInvitations] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  
  // 创建邀请码状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCount, setCreateCount] = useState(5);
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // 获取邀请码列表
  const fetchInvitations = async (page = 1, status = '') => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20'
      });
      
      if (status) params.append('status_filter', status);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/invitations?${params.toString()}`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
        setCurrentPage(data.page);
        setTotalPages(data.total_pages);
        setTotalInvitations(data.total);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取邀请码列表失败');
      }
    } catch (err) {
      console.error('获取邀请码列表失败:', err);
      setError(err.message);
      setError(`获取邀请码列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 创建邀请码
  const createInvitations = async () => {
    try {
      setCreating(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/invitations`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            count: createCount,
            description: createDescription || undefined
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowCreateModal(false);
        setCreateCount(5);
        setCreateDescription('');
        // 重新获取邀请码列表
        fetchInvitations(1, statusFilter);
        setCurrentPage(1);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '创建邀请码失败');
      }
    } catch (err) {
      console.error('创建邀请码失败:', err);
      setError(`创建邀请码失败: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  // 状态筛选处理
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchInvitations(1, status);
  };

  // 分页处理
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchInvitations(page, statusFilter);
  };

  // 复制邀请码
  const copyInvitationCode = (code) => {
    const inviteUrl = `${window.location.origin}/register?invitation_code=${code}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setSuccessMessage('邀请链接已复制到剪贴板');
      setTimeout(() => setSuccessMessage(null), 2000);
    }).catch(() => {
      setError('复制失败，请手动复制');
    });
  };

  // 初始加载
  useEffect(() => {
    fetchInvitations();
  }, [token]);

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 状态标签组件
  const StatusBadge = ({ isUsed }) => {
    if (isUsed) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">已使用</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">未使用</span>;
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 头部导航 */}
        <Header 
          title="🎫 邀请码管理"
          subtitle="管理系统邀请码"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 操作栏 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* 状态筛选 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusFilter('')}
                  className={`px-3 py-2 text-sm rounded-md ${
                    statusFilter === '' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => handleStatusFilter('unused')}
                  className={`px-3 py-2 text-sm rounded-md ${
                    statusFilter === 'unused' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  未使用
                </button>
                <button
                  onClick={() => handleStatusFilter('used')}
                  className={`px-3 py-2 text-sm rounded-md ${
                    statusFilter === 'used' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  已使用
                </button>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                >
                  ➕ 生成邀请码
                </button>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  ← 返回仪表板
                </button>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                共有 <span className="font-semibold">{totalInvitations}</span> 个邀请码
                {statusFilter === 'used' && ' · 已使用'}
                {statusFilter === 'unused' && ' · 未使用'}
              </p>
            </div>
          </div>

          {/* 邀请码列表 */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载邀请码列表...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">加载失败</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => fetchInvitations(currentPage, statusFilter)}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                重新加载
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 邀请码表格 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          邀请码
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          描述
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          创建者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          使用者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          创建时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invitations.map((invitation) => (
                        <tr key={invitation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invitation.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {invitation.code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invitation.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge isUsed={invitation.is_used} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invitation.created_by}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invitation.used_by || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invitation.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!invitation.is_used && (
                              <button
                                onClick={() => copyInvitationCode(invitation.code)}
                                className="px-3 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                              >
                                复制链接
                              </button>
                            )}
                            {invitation.is_used && (
                              <span className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                已使用
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    显示第 {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalInvitations)} 条，共 {totalInvitations} 条
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + index;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm rounded-md ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 创建邀请码模态框 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">🎫 生成邀请码</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      生成数量
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={createCount}
                      onChange={(e) => setCreateCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      disabled={creating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">可生成 1-100 个邀请码</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      描述（可选）
                    </label>
                    <input
                      type="text"
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      disabled={creating}
                      placeholder="例如：给新用户的邀请码"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={createInvitations}
                    disabled={creating}
                    className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creating ? '生成中...' : `生成 ${createCount} 个邀请码`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
};

export default AdminInvitations;