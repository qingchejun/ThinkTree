/**
 * API 调用工具库 - 重构支持HttpOnly Cookie认证
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 令牌刷新状态管理
let isRefreshing = false
let refreshPromise = null

// 静默刷新令牌的函数
async function refreshAccessToken() {
  if (isRefreshing) {
    // 如果正在刷新，等待当前刷新完成
    return refreshPromise
  }
  
  isRefreshing = true
  refreshPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 发送Cookie
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        console.log('🔄 令牌刷新成功')
        resolve(true)
      } else {
        console.log('❌ 令牌刷新失败')
        resolve(false)
      }
    } catch (error) {
      console.error('令牌刷新异常:', error)
      resolve(false)
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })
  
  return refreshPromise
}

// 通用 API 调用函数 - 带自动令牌刷新
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 自动携带Cookie
  }
  
  const config = { 
    ...defaultOptions, 
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers }
  }
  
  try {
    const response = await fetch(url, config)
    
    // 如果返回401，尝试刷新令牌并重试
    if (response.status === 401) {
      console.log('🔒 检测到401，尝试刷新令牌')
      
      const refreshSuccess = await refreshAccessToken()
      
      if (refreshSuccess) {
        // 令牌刷新成功，重试原请求
        console.log('🔄 令牌刷新成功，重试原请求')
        const retryResponse = await fetch(url, config)
        const retryData = await retryResponse.json()
        
        if (!retryResponse.ok) {
          throw new Error(retryData.detail || '请求失败')
        }
        
        return retryData
      } else {
        // 令牌刷新失败，用户需要重新登录
        console.log('❌ 令牌刷新失败，需要重新登录')
        // 触发登出逻辑
        window.location.href = '/?auth=login&reason=session_expired'
        throw new Error('会话已过期，请重新登录')
      }
    }
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.detail || '请求失败')
    }
    
    return data
  } catch (error) {
    console.error('API调用错误:', error)
    throw error
  }
}

// 文件上传 - 不再需要token参数
export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      credentials: 'include', // 自动携带Cookie
      body: formData,
    })
    
    // 401错误处理已在通用函数中处理，这里不需要特殊处理
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.detail || '上传失败')
    }
    
    return data
  } catch (error) {
    console.error('文件上传错误:', error)
    throw error
  }
}

// 处理文本 - 不再需要token参数
export async function processText(text) {
  if (!text || !text.trim()) {
    throw new Error('文本内容不能为空')
  }
  
  return await apiCall('/api/process-text', {
    method: 'POST',
    body: JSON.stringify({
      text: text.trim()
    })
  })
}

// 思维导图 CRUD 操作 - 不再需要token参数
export async function createMindMap(mindmapData) {
  return await apiCall('/api/mindmaps', {
    method: 'POST',
    body: JSON.stringify(mindmapData)
  })
}

export async function getMindMap(mindmapId) {
  return await apiCall(`/api/mindmaps/${mindmapId}`)
}

export async function updateMindMap(mindmapId, mindmapData) {
  return await apiCall(`/api/mindmaps/${mindmapId}`, {
    method: 'PUT',
    body: JSON.stringify(mindmapData)
  })
}

export async function deleteMindMap(mindmapId) {
  return await apiCall(`/api/mindmaps/${mindmapId}`, {
    method: 'DELETE'
  })
}

export async function listMindMaps() {
  return await apiCall('/api/mindmaps')
}

// 分享功能
export async function createShareLink(mindmapId, config = {}) {
  return await apiCall(`/api/mindmaps/${mindmapId}/share`, {
    method: 'POST',
    body: JSON.stringify(config)
  })
}

export async function getSharedMindMap(shareToken) {
  return await apiCall(`/api/share/${shareToken}`)
}

// 用户认证
export async function register(email, password) {
  return await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function login(email, password) {
  return await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

// 用户认证相关 API - 不再需要token参数
export async function getProfile() {
  return await apiCall('/api/auth/profile')
}

export async function updateProfile(profileData) {
  return await apiCall('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  })
}

// 用户登出
export async function logout() {
  return await apiCall('/api/auth/logout', {
    method: 'POST'
  })
}

// 邀请码相关 API - 不再需要token参数
export async function generateInvitationCode(description = '') {
  return await apiCall('/api/invitations/create', {
    method: 'POST',
    body: JSON.stringify({ 
      description: description || null,
      expires_hours: null 
    })
  })
}

export async function getUserInvitations() {
  return await apiCall('/api/invitations/list')
}

// 积分相关 API - 不再需要token参数
export async function getCreditHistory(page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  return await apiCall(`/api/auth/credits/history?${params}`)
}