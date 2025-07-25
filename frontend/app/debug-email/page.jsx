'use client';
import { useState } from 'react';
import Header from '../../components/common/Header';

export default function EmailDebugPage() {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('gingcheun@gmail.com');
  const [testName, setTestName] = useState('测试用户');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://thinktree-backend.onrender.com';

  const testDirectEmail = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      console.log('🔍 开始直接邮件测试', { testEmail, testName });
      
      const response = await fetch(`${API_BASE}/api/auth/debug-email-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          name: testName,
          link: 'https://example.com/reset?token=debug123'
        })
      });
      
      const data = await response.json();
      console.log('🔍 直接邮件测试响应', data);
      
      setTestResults({
        type: 'direct',
        success: data.success,
        data: data,
        timestamp: new Date().toLocaleString()
      });
      
    } catch (error) {
      console.error('🔍 直接邮件测试异常', error);
      setTestResults({
        type: 'direct',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPasswordReset = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      console.log('🔍 开始忘记密码流程测试', { testEmail });
      
      const response = await fetch(`${API_BASE}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail
        })
      });
      
      const data = await response.json();
      console.log('🔍 忘记密码响应数据', data);
      
      setTestResults({
        type: 'password-reset',
        success: response.ok && data.success,
        status: response.status,
        data: data,
        timestamp: new Date().toLocaleString()
      });
      
    } catch (error) {
      console.error('🔍 忘记密码流程异常', error);
      setTestResults({
        type: 'password-reset', 
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAPIHealth = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      
      setTestResults({
        type: 'health',
        success: response.ok,
        status: response.status,
        data: data,
        timestamp: new Date().toLocaleString()
      });
      
    } catch (error) {
      setTestResults({
        type: 'health',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (!testResults) return null;

    const { type, success, data, error, status, timestamp } = testResults;

    return (
      <div className={`mt-6 p-4 rounded-lg border-l-4 ${
        success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
      }`}>
        <div className="flex items-center mb-2">
          <span className={`text-2xl mr-2 ${success ? 'text-green-600' : 'text-red-600'}`}>
            {success ? '✅' : '❌'}
          </span>
          <h3 className="text-lg font-semibold">
            {type === 'direct' && '直接邮件测试'}
            {type === 'password-reset' && '忘记密码流程测试'}
            {type === 'health' && 'API健康检查'}
          </h3>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          测试时间: {timestamp}
        </div>

        {status && (
          <div className="mb-2">
            <span className="font-medium">状态码:</span> {status}
          </div>
        )}

        {error && (
          <div className="mb-4">
            <span className="font-medium text-red-600">错误:</span> {error}
          </div>
        )}

        {data && (
          <div className="space-y-2">
            <div className="font-medium">响应数据:</div>
            
            {type === 'direct' && data.mail_config && (
              <div className="bg-white p-3 rounded border">
                <div className="font-medium mb-2">📧 邮件配置:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>服务器: {data.mail_config.server}</div>
                  <div>端口: {data.mail_config.port}</div>
                  <div>发件人: {data.mail_config.from}</div>
                  <div>用户名: {data.mail_config.username}</div>
                  <div>密码设置: {data.mail_config.password_set ? '✅ 已设置' : '❌ 未设置'}</div>
                  <div>TLS: {data.mail_config.tls ? '✅ 启用' : '❌ 禁用'}</div>
                  <div>SSL: {data.mail_config.ssl ? '✅ 启用' : '❌ 禁用'}</div>
                </div>
              </div>
            )}

            <div className="bg-gray-100 p-3 rounded">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {success && type === 'direct' && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
            💡 邮件发送成功！请检查邮箱 <strong>{testEmail}</strong>（包括垃圾邮件文件夹）。
          </div>
        )}

        {success && type === 'password-reset' && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
            💡 忘记密码流程成功！请检查邮箱 <strong>{testEmail}</strong>（包括垃圾邮件文件夹）。
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="🔧 邮件服务调试工具"
        subtitle="诊断和测试邮件发送功能"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API状态检查 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🌐 API服务状态</h2>
          <p className="text-gray-600 mb-4">首先检查后端API服务是否正常运行</p>
          <button
            onClick={checkAPIHealth}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? '检查中...' : '🔍 检查API状态'}
          </button>
        </div>

        {/* 邮件配置输入 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📧 测试配置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                收件人邮箱
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入测试邮箱地址"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入测试用户名"
              />
            </div>
          </div>
        </div>

        {/* 测试按钮 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 测试功能</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">📧 直接邮件发送测试</h3>
              <p className="text-sm text-gray-600 mb-3">
                直接调用调试端点测试邮件发送功能，绕过业务逻辑
              </p>
              <button
                onClick={testDirectEmail}
                disabled={isLoading || !testEmail}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '测试中...' : '🚀 直接测试邮件发送'}
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">🔑 完整忘记密码流程</h3>
              <p className="text-sm text-gray-600 mb-3">
                测试真实的忘记密码API流程，包含用户验证和业务逻辑
              </p>
              <button
                onClick={testPasswordReset}
                disabled={isLoading || !testEmail}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '测试中...' : '🔄 测试忘记密码流程'}
              </button>
            </div>
          </div>
        </div>

        {/* 测试结果 */}
        {renderResults()}

        {/* 说明信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">🔍 调试说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>直接邮件测试</strong> - 测试邮件服务的基础配置和发送功能</li>
            <li>• <strong>忘记密码流程</strong> - 测试完整的用户重置密码业务流程</li>
            <li>• <strong>API状态检查</strong> - 确认后端服务是否正常运行</li>
            <li>• 所有测试都会显示详细的配置信息和错误详情</li>
            <li>• 查看浏览器开发者工具Console获取更多调试信息</li>
            <li>• 后端日志包含更详细的SMTP连接和发送过程信息</li>
          </ul>
        </div>
      </div>
    </div>
  );
}