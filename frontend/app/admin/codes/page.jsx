'use client';
import { useState, useContext } from 'react';
import AuthContext from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Toast from '@/components/common/Toast';

const AdminCodesPage = () => {
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
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
    router.push('/login');
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
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板', 'success');
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
      <Header 
        title="🎫 兑换码管理"
        subtitle="管理员专属：批量生成积分兑换码"
      />
      
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
                      💡 提示：兑换码已生成并保存到数据库，用户可以在设置页面的「用量与计费」中使用这些兑换码获取积分。
                    </p>
                  </div>
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

export default AdminCodesPage;