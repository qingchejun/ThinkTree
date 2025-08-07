'use client';
import { useState, useEffect, useContext } from 'react';
import AuthContext from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const RedemptionHistory = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRedemptionHistory = async () => {
    try {
      if (!user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/codes/history`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('加载兑换历史失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRedemptionHistory();
    } else {
      setHistory([]);
      setIsLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  if (isLoading) {
    return (
      <Card className="border border-border-secondary">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <span className="mr-2">📋</span>
            兑换历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-primary border-t-transparent mx-auto mb-2"></div>
            <p className="text-text-secondary text-sm">加载中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border-secondary">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <span className="mr-2">📋</span>
          兑换历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🎫</div>
            <p className="text-text-secondary text-sm mb-1">暂无兑换记录</p>
            <p className="text-text-tertiary text-xs">使用兑换码后，记录将显示在这里</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-border-primary"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-text-primary bg-green-100 px-2 py-1 rounded">
                      {item.code}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      +{item.credits_amount}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    {formatDate(item.redeemed_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RedemptionHistory;