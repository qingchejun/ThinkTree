'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import AuthContext from '../../../context/AuthContext';
import Header from '../../../components/common/Header';
import AdminRoute from '../../../components/common/AdminRoute';
import { ToastManager } from '../../../components/common/Toast';

const AdminUsers = () => {
  const { token } = useContext(AuthContext);
  const router = useRouter();
  
  // 状态管理
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 分页和筛选
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // 操作状态
  const [updatingUser, setUpdatingUser] = useState(null);

  // 获取用户列表
  const fetchUsers = async (page = 1, search = '', status = '') => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20'
      });
      
      if (search) params.append('search', search);
      if (status) params.append('status_filter', status);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params.toString()}`, 
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
        setUsers(data.users);
        setCurrentPage(data.page);
        setTotalPages(data.total_pages);
        setTotalUsers(data.total);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取用户列表失败');
      }
    } catch (err) {
      console.error('获取用户列表失败:', err);
      setError(err.message);
      ToastManager.error(`获取用户列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新用户状态
  const updateUser = async (userId, updates) => {
    try {
      setUpdatingUser(userId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, 
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates)
        }
      );

      if (response.ok) {
        const data = await response.json();
        ToastManager.success(data.message);
        // 重新获取用户列表
        fetchUsers(currentPage, searchTerm, statusFilter);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '更新用户失败');
      }
    } catch (err) {
      console.error('更新用户失败:', err);
      ToastManager.error(`更新用户失败: ${err.message}`);
    } finally {
      setUpdatingUser(null);
    }
  };

  // 删除用户（软删除）
  const deleteUser = async (userId, userEmail) => {
    if (!window.confirm(`确定要删除用户 "${userEmail}" 吗？此操作会将用户设为非活跃状态。`)) {
      return;
    }

    try {
      setUpdatingUser(userId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, 
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        ToastManager.success(data.message);
        // 重新获取用户列表
        fetchUsers(currentPage, searchTerm, statusFilter);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '删除用户失败');
      }
    } catch (err) {
      console.error('删除用户失败:', err);
      ToastManager.error(`删除用户失败: ${err.message}`);
    } finally {
      setUpdatingUser(null);
    }
  };

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm, statusFilter);
  };

  // 状态筛选处理
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchUsers(1, searchTerm, status);
  };

  // 分页处理
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page, searchTerm, statusFilter);
  };

  // 初始加载
  useEffect(() => {
    fetchUsers();
  }, [token]);

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 状态标签组件
  const StatusBadge = ({ isActive, isVerified, isSuperuser }) => {
    if (isSuperuser) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">管理员</span>;
    }
    if (!isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">已禁用</span>;
    }
    if (!isVerified) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">未验证</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">正常</span>;
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 头部导航 */}
        <Header 
          title="👥 用户管理"
          subtitle="管理系统中的所有用户"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 操作栏 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* 搜索 */}
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="按邮箱搜索用户..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    🔍
                  </button>
                </div>
              </form>

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
                  onClick={() => handleStatusFilter('active')}
                  className={`px-3 py-2 text-sm rounded-md ${
                    statusFilter === 'active' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  活跃
                </button>
                <button
                  onClick={() => handleStatusFilter('verified')}
                  className={`px-3 py-2 text-sm rounded-md ${
                    statusFilter === 'verified' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  已验证
                </button>
                <button
                  onClick={() => handleStatusFilter('inactive')}
                  className={`px-3 py-2 text-sm rounded-md ${
                    statusFilter === 'inactive' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  禁用
                </button>
              </div>

              {/* 返回按钮 */}
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                ← 返回仪表板
              </button>
            </div>

            {/* 统计信息 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                共找到 <span className="font-semibold">{totalUsers}</span> 个用户
                {searchTerm && ` · 搜索: "${searchTerm}"`}
                {statusFilter && ` · 筛选: ${
                  {active: '活跃', inactive: '禁用', verified: '已验证', unverified: '未验证'}[statusFilter]
                }`}
              </p>
            </div>
          </div>

          {/* 用户列表 */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载用户列表...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">加载失败</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => fetchUsers(currentPage, searchTerm, statusFilter)}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                重新加载
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 用户表格 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          思维导图
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          注册时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.display_name || '未设置'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge 
                              isActive={user.is_active}
                              isVerified={user.is_verified}
                              isSuperuser={user.is_superuser}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.mindmap_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {!user.is_superuser && (
                              <>
                                {/* 启用/禁用按钮 */}
                                <button
                                  onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                                  disabled={updatingUser === user.id}
                                  className={`px-3 py-1 rounded text-xs font-medium ${
                                    user.is_active
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  } ${updatingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {updatingUser === user.id ? '处理中...' : (user.is_active ? '禁用' : '启用')}
                                </button>

                                {/* 验证按钮 */}
                                {!user.is_verified && (
                                  <button
                                    onClick={() => updateUser(user.id, { is_verified: true })}
                                    disabled={updatingUser === user.id}
                                    className={`px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 ${
                                      updatingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    验证
                                  </button>
                                )}

                                {/* 删除按钮 */}
                                <button
                                  onClick={() => deleteUser(user.id, user.email)}
                                  disabled={updatingUser === user.id}
                                  className={`px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 ${
                                    updatingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  删除
                                </button>
                              </>
                            )}
                            {user.is_superuser && (
                              <span className="px-3 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                管理员
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
                    显示第 {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalUsers)} 条，共 {totalUsers} 条
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
      </div>
    </AdminRoute>
  );
};

export default AdminUsers;