'use client';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const RedemptionCodeForm = ({ onRedemptionSuccess, onRedemptionError }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      onRedemptionError('请输入兑换码');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        onRedemptionError('请先登录');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/codes/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCode(''); // 清空输入框
        onRedemptionSuccess(data.message, data.credits_gained, data.current_balance);
      } else {
        onRedemptionError(data.detail || data.message || '兑换失败');
      }
    } catch (error) {
      console.error('兑换码请求失败:', error);
      onRedemptionError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-border-secondary">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <span className="mr-2">🎫</span>
          兑换积分码
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              兑换码
            </label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="请输入兑换码"
              disabled={isLoading}
              className="font-mono"
              maxLength={50}
            />
            <p className="text-xs text-text-tertiary mt-1">
              输入您获得的兑换码来获取积分
            </p>
          </div>
          
          <Button 
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full"
          >
            {isLoading ? '兑换中...' : '立即兑换'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RedemptionCodeForm;