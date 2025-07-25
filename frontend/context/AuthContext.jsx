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
  refreshUser: async () => {}
})

// 认证提供者组件
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // 获取用户信息
  const fetchUserProfile = async (authToken) => {
    try {
      // 设置请求超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒超时

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const userData = await response.json()
        console.log('获取用户信息成功:', userData) // 调试日志
        return userData
      } else {
        console.error('获取用户信息失败:', response.status, response.statusText)
        // 令牌无效，清除存储的数据
        if (response.status === 401) {
          localStorage.removeItem('access_token')
        }
        return null
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      
      // 超时或网络错误时，不清除token，让用户可以重试
      if (error.name === 'AbortError') {
        console.error('用户信息获取超时')
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('无法连接到服务器')
      }
      
      return null
    }
  }

  // 登录函数
  const login = async (accessToken) => {
    try {
      console.log('开始处理登录, token:', accessToken?.substring(0, 20) + '...') // 调试日志
      
      // 存储令牌到 localStorage
      localStorage.setItem('access_token', accessToken)
      setToken(accessToken)
      
      // 获取用户信息
      const userData = await fetchUserProfile(accessToken)
      if (userData) {
        console.log('设置用户数据:', userData) // 调试日志
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
    console.log('用户退出登录') // 调试日志
    
    // 清除状态
    setUser(null)
    setToken(null)
    
    // 清除 localStorage
    localStorage.removeItem('access_token')
    
    // 跳转到登录页面
    if (typeof window !== 'undefined') {
      router.push('/login')
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    if (token) {
      const userData = await fetchUserProfile(token)
      setUser(userData)
    }
  }

  // 组件挂载时检查持久化的登录状态
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('开始初始化认证状态') // 调试日志
      setIsLoading(true)
      
      // 检查 localStorage 中的令牌
      const storedToken = localStorage.getItem('access_token')
      console.log('存储的token:', storedToken ? '存在' : '不存在') // 调试日志
      
      if (storedToken) {
        setToken(storedToken)
        
        // 验证令牌并获取用户信息
        const userData = await fetchUserProfile(storedToken)
        if (userData) {
          console.log('初始化时设置用户数据:', userData) // 调试日志
          setUser(userData)
        } else {
          // 令牌无效，清除所有数据
          console.log('令牌无效，清除数据') // 调试日志
          setToken(null)
          localStorage.removeItem('access_token')
        }
      }
      
      console.log('认证状态初始化完成') // 调试日志
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  // 提供给子组件的值
  const contextValue = {
    user,
    token,
    isLoading,
    login,
    logout,
    refreshUser,
    // 辅助状态
    isAuthenticated: !!user && !!token,
    isAdmin: !!user && user.is_superuser
  }

  // 开发环境调试日志
  if (process.env.NODE_ENV === 'development') {
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