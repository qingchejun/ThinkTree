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
  isLoading: true,
  login: async (userData) => {},
  logout: () => {},
  refreshUser: async () => {},
  showDailyRewardToast: null,
  credits: 0
})

// 认证提供者组件
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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

  // 获取用户信息 - 使用HttpOnly Cookie
  const fetchUserProfile = async (options = {}) => {
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
        credentials: 'include' // 自动携带HttpOnly Cookie
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
        // Cookie无效，清除状态（Cookie由后端管理，前端无需操作）
        if (response.status === 401) {
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

  // 登录函数 - Cookie认证方式
  const login = async (userData) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('开始处理登录，用户数据:', userData)
      }
      
      // 直接设置用户数据（Cookie由后端在登录响应时设置）
      if (userData) {
        setUser(userData)
        
        // 检查是否有每日奖励提示
        if (userData.daily_reward_granted) {
          setShowDailyRewardToast(true)
          setTimeout(() => setShowDailyRewardToast(false), 3000)
        }
        
        return { success: true }
      } else {
        console.error('用户数据无效')
        return { success: false, error: '用户数据无效' }
      }
    } catch (error) {
      console.error('登录处理失败:', error)
      return { success: false, error: '登录处理失败' }
    }
  }

  // 退出登录函数 - Cookie认证方式
  const logout = async (router = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚪 用户退出登录')
    }
    
    try {
      // 调用后端登出接口，清除HttpOnly Cookie
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('调用登出接口失败:', error)
      // 即使接口调用失败，也继续清除本地状态
    }
    
    // 清除本地状态
    setUser(null)
    
    // 重置认证标志，防止重新初始化
    setAuthInitialized(false)
    setAuthCheckInProgress(false)
    
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

      // 检查HttpOnly Cookie中的认证状态
      try {
        console.log('🍪 使用HttpOnly Cookie检查登录状态');
        
        // 调用用户信息接口验证认证状态
        const userData = await fetchUserProfile({ 
          skipTimeout: true, 
          requestId: 'auth_init' 
        });
        
        if (userData) {
          console.log('✅ 检测到有效登录状态:', userData);
          setUser(userData);
        } else {
          console.log('❌ 未检测到有效登录状态');
          setUser(null);
        }
      } catch (error) {
        console.error('💥 登录状态检查失败:', error);
        setUser(null);
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

  // 注意：不再需要localStorage监听，Cookie由浏览器自动管理
  // HttpOnly Cookie无法被JavaScript访问，多标签页同步通过服务器状态实现

  // 提供给子组件的值
  const contextValue = {
    user,
    isLoading,
    loading: isLoading,
    isClient,
    login,
    logout,
    refreshUser,
    showDailyRewardToast,
    setShowDailyRewardToast,
    // 辅助状态 - HttpOnly Cookie认证，只要有用户信息即视为已认证
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
      isLoading,
      authInitialized,
      authCheckInProgress,
      isAuthenticated: !!user,
      isAdmin: !!user && user.is_superuser,
      userEmail: user?.email,
      credits: user?.credits || 0
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