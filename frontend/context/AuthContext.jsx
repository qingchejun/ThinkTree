/**
 * 认证上下文 (AuthContext) - ThinkSo v2.1.0
 * 全局用户状态管理和认证逻辑
 */
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 创建认证上下文
const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  login: async (token) => {},
  logout: () => {},
  refreshUser: async () => {},
  showDailyRewardToast: null
})

// 认证提供者组件
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDailyRewardToast, setShowDailyRewardToast] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // 防止重复请求的标志
  const [pendingRequests, setPendingRequests] = useState(new Set())

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
        // 令牌无效，清除存储的数据
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
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
      
      // 存储令牌到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', accessToken)
      }
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
  const logout = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('用户退出登录')
    }
    
    // 清除状态
    setUser(null)
    setToken(null)
    
    // 清除 localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
    
    // 跳转到登录页面
    if (typeof window !== 'undefined') {
      router.push('/login')
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    if (token) {
      const userData = await fetchUserProfile(token, { 
        requestId: `refresh_${Date.now()}`,
        timeoutMs: 8000 
      })
      setUser(userData)
    }
  }

  // 初始化客户端状态
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 组件挂载时检查持久化的登录状态
  useEffect(() => {
    // 确保在客户端执行
    if (!isClient) {
      return
    }
    
    console.log('🚀 useEffect被调用 - 开始认证检查')
    
    let mounted = true
    
    const initializeAuth = async () => {
      console.log('🔄 开始初始化认证状态')
      
      try {
        // 检查 localStorage 中的令牌
        const storedToken = localStorage.getItem('access_token')
        console.log('🔍 存储的token:', storedToken ? '存在' : '不存在')
        
        if (storedToken && mounted) {
          console.log('🔧 设置token到状态')
          setToken(storedToken)
          
          // 验证令牌并获取用户信息
          console.log('📞 调用fetchUserProfile')
          const userData = await fetchUserProfile(storedToken, { 
            requestId: `init_${Date.now()}`,
            timeoutMs: 5000 // 缩短超时时间
          })
          
          if (userData && mounted) {
            console.log('✅ 初始化时设置用户数据:', userData)
            setUser(userData)
          } else if (mounted) {
            // 令牌无效，清除所有数据
            console.log('❌ 令牌无效，清除数据')
            setToken(null)
            localStorage.removeItem('access_token')
          }
        } else if (!storedToken) {
          console.log('ℹ️ 没有存储的token')
        }
      } catch (error) {
        console.error('💥 初始化过程中出错:', error)
        if (mounted) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (mounted) {
          console.log('🏁 认证状态初始化完成 - 设置isLoading=false')
          setIsLoading(false)
        }
      }
    }

    initializeAuth()
    
    return () => {
      mounted = false
    }
  }, [isClient])

  // 提供给子组件的值
  const contextValue = {
    user,
    token,
    isLoading,
    isClient,
    login,
    logout,
    refreshUser,
    showDailyRewardToast,
    setShowDailyRewardToast,
    // 辅助状态
    isAuthenticated: !!user && !!token,
    isAdmin: !!user && user.is_superuser
  }

  // 开发环境调试日志 - 只在客户端执行
  if (process.env.NODE_ENV === 'development' && isClient) {
    console.log('AuthContext状态更新:', {
      hasUser: !!user,
      hasToken: !!token,
      isLoading,
      isAuthenticated: !!user && !!token,
      isAdmin: !!user && user.is_superuser,
      userEmail: user?.email
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