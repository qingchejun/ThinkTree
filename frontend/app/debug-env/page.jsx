'use client';

export default function DebugEnvPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">环境变量调试</h1>
        <div className="space-y-2">
          <p><strong>API URL:</strong></p>
          <p className="text-sm text-gray-600 break-all bg-gray-100 p-2 rounded">
            {apiUrl || 'undefined'}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            如果API URL显示为undefined，说明环境变量配置有问题
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}