/**
 * 认证上下文 (AuthContext) - ThinkSo v2.1.0
 * 全局用户状态管理和认证逻辑
 */
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 创建认证上下文
export const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  login: async (token) => {},
  logout: () => {},
  refreshUser: async () => {},
  showDailyRewardToast: null,
  credits: 0
})

// 认证提供者组件
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDailyRewardToast, setShowDailyRewardToast] = useState(null)
  const [isClient, setIsClient] = useState(false)

  const router = useRouter()

  // 标记是否已完成首次认证检查
  const [authInitialized, setAuthInitialized] = useState(false);
  // 防止并发认证检查
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false);

  // 首次挂载时设置isClient
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 获取用户信息
  const fetchUserProfile = async (authToken, options = {}) => {
    const { skipTimeout = false, timeoutMs = 12000, requestId = 'default' } = options
    
    console.log(`🌐 开始获取用户信息 [${requestId}]`)
    
    let controller = null
    let timeoutId = null
    
    try {
      // 只在不跳过超时时设置AbortController
      if (!skipTimeout) {
        controller = new AbortController()
        timeoutId = setTimeout(() => {
          if (controller && !controller.signal.aborted) {
            if (process.env.NODE_ENV === 'development') {
              console.log('用户信息请求超时，主动中止')
            }
            controller.abort()
          }
        }, timeoutMs)
      }

      const fetchOptions = {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
      
      // 只有在设置了controller时才添加signal
      if (controller) {
        fetchOptions.signal = controller.signal
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, fetchOptions)

      // 清除超时
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      if (response.ok) {
        const userData = await response.json()
        console.log('✅ 获取用户信息成功:', userData)
        
        // 检查是否发放了每日奖励
        if (userData.daily_reward_granted) {
          console.log('🎉 检测到每日奖励发放')
          setShowDailyRewardToast(true)
          // 3秒后自动隐藏提示
          setTimeout(() => setShowDailyRewardToast(false), 3000)
        }
        
        return userData
      } else {
        console.error('❌ 获取用户信息失败:', response.status, response.statusText)
        // 令牌无效，清除存储的数据和状态
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          setToken(null)
          setUser(null)
        }
        return null
      }
    } catch (error) {
      // 静默处理AbortError，避免控制台噪音
      if (error.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.log('用户信息请求被中止')
        }
        return null
      }
      
      console.error('获取用户信息失败:', error)
      
      // 其他网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('无法连接到服务器')
      }
      
      return null
    } finally {
      // 清理资源
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      console.log(`🏁 fetchUserProfile完成 [${requestId}]`)
    }
  }

  // 登录函数
  const login = async (accessToken) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('开始处理登录, token:', accessToken?.substring(0, 20) + '...')
      }
      
      // 存储到 localStorage 和状态
      localStorage.setItem('access_token', accessToken);
      setToken(accessToken)
      
      // 获取用户信息 - 使用唯一ID避免重复请求，跳过超时控制避免AbortController冲突
      const userData = await fetchUserProfile(accessToken, { 
        skipTimeout: true, 
        requestId: `login_${Date.now()}` 
      })
      
      if (userData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('设置用户数据:', userData)
        }
        setUser(userData)
        return { success: true }
      } else {
        console.error('获取用户信息失败') // 调试日志
        return { success: false, error: '获取用户信息失败' }
      }
    } catch (error) {
      console.error('登录处理失败:', error)
      return { success: false, error: '登录处理失败' }
    }
  }

  // 退出登录函数
  const logout = (router = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚪 用户退出登录')
    }
    
    // 清除状态
    setUser(null)
    setToken(null)
    
    // 重置认证标志，防止重新初始化
    setAuthInitialized(false)
    setAuthCheckInProgress(false)
    
    // 清除 localStorage 中的 token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
    
    // 清除 HttpOnly Cookie
    if (typeof window !== 'undefined') {
      document.cookie = "thinktree_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    }
    
    // 根据环境变量决定跳转地址
    if (typeof window !== 'undefined') {
      const redirectUrl = process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL || 
        (process.env.NODE_ENV === 'development' ? '/' : 'https://thinkso.io')
      
      // 在开发环境下，如果提供了router且跳转到本地路径，使用Next.js路由
      if (process.env.NODE_ENV === 'development' && router && redirectUrl === '/') {
        router.push('/')
      } else {
        window.location.href = redirectUrl
      }
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  // 统一的认证状态初始化
  useEffect(() => {
    const initializeAuth = async () => {
      // 防止重复执行和并发执行
      if (authInitialized || authCheckInProgress) return;
      setAuthInitialized(true);
      setAuthCheckInProgress(true);

      console.log('🔄 开始初始化认证状态');

      // 检查真实的登录状态
      try {
        console.log('🔍 检查真实登录状态');
        
        // 首先检查localStorage中的token
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          console.log('📦 在localStorage中找到token');
          setToken(storedToken);
          
          // 使用token获取用户信息
          const userData = await fetchUserProfile(storedToken, { 
            skipTimeout: true, 
            requestId: 'auth_init' 
          });
          
          if (userData) {
            console.log('✅ 通过localStorage token检测到有效登录状态:', userData);
            setUser(userData);
            return; // 成功获取用户信息，直接返回
          } else {
            console.log('🚫 localStorage token无效，清除并尝试Cookie');
            localStorage.removeItem('access_token');
            setToken(null);
          }
        }
        
        // 如果localStorage没有token或token无效，尝试HttpOnly Cookie
        console.log('🍪 尝试使用HttpOnly Cookie检查登录状态');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ 通过Cookie检测到有效登录状态:', userData);
          setUser(userData);
        } else {
          console.log('❌ 未检测到有效登录状态');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('💥 登录状态检查失败:', error);
        setUser(null);
        setToken(null);
      } finally {
        console.log('🏁 认证状态检查完成');
        setIsLoading(false);
        setAuthCheckInProgress(false);
      }
    };

    if (isClient) {
      initializeAuth();
    }
  }, [isClient, authInitialized, authCheckInProgress]);

  // 监听localStorage变化，确保多标签页同步
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        console.log('📡 检测到localStorage token变化:', e.newValue ? '有token' : '无token');
        
        if (!e.newValue && user) {
          // token被删除，清理用户状态
          console.log('🚪 token被删除，清理用户状态');
          setUser(null);
          setToken(null);
        } else if (e.newValue && !user) {
          // 有新token但当前无用户，重新验证
          console.log('🔄 检测到新token，重新验证用户');
          setAuthInitialized(false); // 触发重新初始化
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isClient, user]);

  // 提供给子组件的值
  const contextValue = {
    user,
    token,
    isLoading,
    loading: isLoading,
    isClient,
    login,
    logout,
    refreshUser,
    showDailyRewardToast,
    setShowDailyRewardToast,
    // 辅助状态 - 修复：支持HttpOnly Cookie认证，只要有用户信息即视为已认证
    isAuthenticated: !!user,
    isAdmin: !!user && user.is_superuser,
    // 用户积分 - 从用户对象中提取积分信息
    credits: user?.credits || 0
  }

  // 开发环境调试日志 - 只在客户端执行
  if (process.env.NODE_ENV === 'development' && isClient) {
    const currentTimestamp = new Date().toLocaleTimeString()
    console.log(`📊 [${currentTimestamp}] AuthContext状态更新:`, {
      hasUser: !!user,
      hasToken: !!token,
      isLoading,
      authInitialized,
      authCheckInProgress,
      isAuthenticated: !!user, // 修复：与上面的逻辑保持一致
      isAdmin: !!user && user.is_superuser,
      userEmail: user?.email,
      credits: user?.credits || 0,
      localStorageToken: typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : 'N/A'
    })
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// 自定义Hook - 简化使用AuthContext
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用')
  }
  
  return context
}

// 默认导出AuthContext (可选)
export default AuthContext