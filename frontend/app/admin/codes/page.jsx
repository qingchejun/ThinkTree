'use client';
import React, { useState, useContext, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AuthContext from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Toast from '@/components/common/Toast';

const AdminCodesPageComponent = () => {
  const { user, token, loading } = useContext(AuthContext);
  const router = useRouter();
  
  // 表单状态
  const [formData, setFormData] = useState({
    quantity: 1,
    credits_amount: 1000,
    expires_in_days: 30
  });
  
  // UI状态
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [toast, setToast] = useState(null);
  
  // 兑换码列表状态
  const [codesList, setCodesList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCodes, setTotalCodes] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // 客户端检查状态
  const [isClient, setIsClient] = useState(false);

  // 检查是否在客户端
  useEffect(() => {
    setIsClient(true);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // 加载兑换码列表
  const loadCodesList = async (page = 1, filter = statusFilter) => {
    if (!token) return;
    
    setListLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/redemption-codes?page=${page}&per_page=20&status_filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCodesList(data.codes);
        setCurrentPage(data.page);
        setTotalPages(data.total_pages);
        setTotalCodes(data.total);
      } else {
        showToast(data.detail || '加载兑换码列表失败', 'error');
      }
    } catch (error) {
      console.error('加载兑换码列表失败:', error);
      showToast('网络错误，请稍后重试', 'error');
    } finally {
      setListLoading(false);
    }
  };

  // 页面加载时获取兑换码列表
  React.useEffect(() => {
    if (user && user.is_superuser && token) {
      loadCodesList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // 状态筛选改变时重新加载
  const handleStatusFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
    loadCodesList(1, newFilter);
  };

  // 权限检查
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
    router.push('/');
    return null;
  }

  if (!user.is_superuser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">访问被拒绝</h2>
              <p className="text-text-secondary mb-4">您需要管理员权限才能访问此页面</p>
              <Button onClick={() => router.push('/dashboard')}>
                返回主页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 生成兑换码
  const handleGenerateCodes = async (e) => {
    e.preventDefault();
    
    if (!token) {
      showToast('请先登录', 'error');
      return;
    }

    // 表单验证
    if (formData.quantity < 1 || formData.quantity > 100) {
      showToast('生成数量必须在1-100之间', 'error');
      return;
    }

    if (formData.credits_amount < 1 || formData.credits_amount > 10000) {
      showToast('积分面额必须在1-10000之间', 'error');
      return;
    }

    if (formData.expires_in_days < 1 || formData.expires_in_days > 365) {
      showToast('有效期必须在1-365天之间', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/redemption-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedCodes(data.codes);
        showToast(`成功生成${data.total_generated}个兑换码`, 'success');
        
        // 重置表单
        setFormData({
          quantity: 1,
          credits_amount: 1000,
          expires_in_days: 30
        });
        
        // 刷新兑换码列表
        loadCodesList(currentPage, statusFilter);
      } else {
        showToast(data.detail || data.message || '生成兑换码失败', 'error');
      }
    } catch (error) {
      console.error('生成兑换码请求失败:', error);
      showToast('网络错误，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 复制兑换码到剪贴板
  const copyToClipboard = async (text) => {
    if (typeof window === 'undefined' || !isClient) {
      showToast('复制功能仅在客户端可用', 'error');
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板', 'success');
      } else if (typeof document !== 'undefined') {
        // 降级方案：使用传统的复制方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('已复制到剪贴板', 'success');
      } else {
        showToast('复制功能不可用', 'error');
      }
    } catch (error) {
      console.error('复制失败:', error);
      showToast('复制失败', 'error');
    }
  };

  // 复制所有兑换码
  const copyAllCodes = async () => {
    if (generatedCodes.length === 0) return;
    
    const codesText = generatedCodes.join('\n');
    await copyToClipboard(codesText);
  };

  return (
    <div className="min-h-screen bg-background-secondary">

      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 左侧：生成表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">⚙️</span>
                生成兑换码
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateCodes} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    生成数量
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    一次最多生成100个兑换码
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    积分面额
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    value={formData.credits_amount}
                    onChange={(e) => setFormData({...formData, credits_amount: parseInt(e.target.value) || 1000})}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    每个兑换码的积分价值（1-10000）
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    有效期（天）
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.expires_in_days}
                    onChange={(e) => setFormData({...formData, expires_in_days: parseInt(e.target.value) || 30})}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    兑换码的有效期天数（1-365天）
                  </p>
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? '生成中...' : `生成 ${formData.quantity} 个兑换码`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 右侧：生成结果 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="mr-2">📋</span>
                  生成结果
                </CardTitle>
                {generatedCodes.length > 0 && (
                  <Button
                    onClick={copyAllCodes}
                    variant="outline"
                    size="sm"
                  >
                    复制全部
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedCodes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎫</div>
                  <p className="text-text-secondary text-lg mb-2">暂无生成的兑换码</p>
                  <p className="text-text-tertiary text-sm">
                    填写左侧表单并点击生成按钮开始创建兑换码
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-text-secondary mb-4">
                    共生成 {generatedCodes.length} 个兑换码，每个价值 {formData.credits_amount} 积分
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {generatedCodes.map((code, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-border-primary"
                      >
                        <span className="font-mono text-sm text-text-primary font-medium">
                          {code}
                        </span>
                        <Button
                          onClick={() => copyToClipboard(code)}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          复制
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 提示：兑换码已生成并保存到数据库，用户可以在设置页面的「用量计费」中使用这些兑换码获取积分。
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 兑换码管理列表 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="mr-2">🗂️</span>
                  兑换码管理
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="px-3 py-1 border border-border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="ALL">全部状态</option>
                    <option value="ACTIVE">可用</option>
                    <option value="REDEEMED">已使用</option>
                    <option value="EXPIRED">已过期</option>
                  </select>
                  <Button
                    onClick={() => loadCodesList(currentPage, statusFilter)}
                    variant="outline"
                    size="sm"
                    disabled={listLoading}
                  >
                    {listLoading ? '刷新中...' : '刷新'}
                  </Button>
                </div>
              </div>
              <p className="text-text-secondary text-sm mt-2">
                共 {totalCodes} 个兑换码
              </p>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-text-secondary">加载中...</p>
                </div>
              ) : codesList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-text-secondary text-lg mb-2">暂无兑换码</p>
                  <p className="text-text-tertiary text-sm">
                    还没有生成任何兑换码，使用上方表单开始创建
                  </p>
                </div>
              ) : (
                <div>
                  {/* 兑换码列表 */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-primary">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">兑换码</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">面额</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">状态</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">创建时间</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">过期时间</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">兑换用户</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">兑换时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codesList.map((code) => (
                          <tr key={code.id} className="border-b border-border-secondary hover:bg-background-secondary">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-sm font-medium text-text-primary">
                                  {code.code}
                                </span>
                                <Button
                                  onClick={() => copyToClipboard(code.code)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs px-2 py-1"
                                >
                                  复制
                                </Button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-text-primary">
                              {code.credits_amount.toLocaleString()} 积分
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                code.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                code.status === 'REDEEMED' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {code.status === 'ACTIVE' ? '可用' :
                                 code.status === 'REDEEMED' ? '已使用' : '已过期'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">
                              {new Date(code.created_at).toLocaleString('zh-CN')}
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">
                              {new Date(code.expires_at).toLocaleString('zh-CN')}
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">
                              {code.redeemed_by_email || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">
                              {code.redeemed_at ? new Date(code.redeemed_at).toLocaleString('zh-CN') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-text-secondary">
                        第 {currentPage} 页，共 {totalPages} 页
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => {
                            const newPage = currentPage - 1;
                            setCurrentPage(newPage);
                            loadCodesList(newPage, statusFilter);
                          }}
                          disabled={currentPage <= 1 || listLoading}
                          variant="outline"
                          size="sm"
                        >
                          上一页
                        </Button>
                        <Button
                          onClick={() => {
                            const newPage = currentPage + 1;
                            setCurrentPage(newPage);
                            loadCodesList(newPage, statusFilter);
                          }}
                          disabled={currentPage >= totalPages || listLoading}
                          variant="outline"
                          size="sm"
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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

// 使用 dynamic import 禁用 SSR 来完全避免 location 错误
const AdminCodesPage = dynamic(() => Promise.resolve(AdminCodesPageComponent), {
  ssr: false,
  loading: () => (
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
  )
});

export default AdminCodesPage;