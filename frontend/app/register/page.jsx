import React, { Suspense } from 'react';
import RegisterForm from '../../components/RegisterForm';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">加载中...</h2>
          <p className="text-gray-600">正在处理您的请求</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}