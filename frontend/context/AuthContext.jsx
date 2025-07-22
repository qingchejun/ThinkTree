/**
 * 认证上下文 (AuthContext) - ThinkTree v2.1.0
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        return userData
      } else {
        // 令牌无效，清除存储的数据
        localStorage.removeItem('access_token')
        return null
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  // 登录函数
  const login = async (accessToken) => {
    try {
      // 存储令牌到 localStorage
      localStorage.setItem('access_token', accessToken)
      setToken(accessToken)
      
      // 获取用户信息
      const userData = await fetchUserProfile(accessToken)
      if (userData) {
        setUser(userData)
        return { success: true }
      } else {
        return { success: false, error: '获取用户信息失败' }
      }
    } catch (error) {
      console.error('登录处理失败:', error)
      return { success: false, error: '登录处理失败' }
    }
  }

  // 退出登录函数
  const logout = () => {
    // 清除状态
    setUser(null)
    setToken(null)
    
    // 清除 localStorage
    localStorage.removeItem('access_token')
    
    // 跳转到登录页面
    router.push('/login')
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
      setIsLoading(true)
      
      // 检查 localStorage 中的令牌
      const storedToken = localStorage.getItem('access_token')
      
      if (storedToken) {
        setToken(storedToken)
        
        // 验证令牌并获取用户信息
        const userData = await fetchUserProfile(storedToken)
        if (userData) {
          setUser(userData)
        } else {
          // 令牌无效，清除所有数据
          setToken(null)
          localStorage.removeItem('access_token')
        }
      }
      
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
    isAuthenticated: !!user && !!token
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