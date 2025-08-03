'use client';
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthContext from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isLoading, isAdmin } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // 用户未登录，重定向到登录页
        if (typeof window !== 'undefined') {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        } else {
          router.push('/');
        }
        return;
      }
      
      if (!isAdmin) {
        // 用户已登录但不是管理员，重定向到首页
        router.push('/');
        return;
      }
    }
  }, [user, isLoading, isAdmin, router]);

  // 加载中显示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">验证管理员权限...</h3>
          <p className="text-gray-600">请稍候</p>
        </div>
      </div>
    );
  }

  // 用户未登录或不是管理员
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">访问被拒绝</h3>
          <p className="text-gray-600 mb-4">您没有权限访问管理员后台</p>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 权限验证通过，渲染子组件
  return children;
};

export default AdminRoute;