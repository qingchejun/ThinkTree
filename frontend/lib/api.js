/**
 * API 调用工具库 - HttpOnly Cookie跨域认证专用配置
 * 
 * 🔑 关键配置说明：
 * - credentials: 'include' - 确保所有请求都携带HttpOnly Cookie
 * - 自动401处理和令牌刷新
 * - CORS跨域Cookie认证支持
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 🌐 全局fetch配置 - 确保所有API请求都支持HttpOnly Cookie
export const DEFAULT_FETCH_OPTIONS = {
  credentials: 'include',  // 🔑 关键：跨域请求携带Cookie
  headers: {
    'Content-Type': 'application/json',
  },
}

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

// 内部：带超时与 AbortController 的 fetch
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(id)
  }
}

// 指数退避 + 抖动（仅用于 GET 幂等请求）
async function getWithRetry(url, config, maxRetries = 2) {
  let attempt = 0
  let lastError = null
  while (attempt <= maxRetries) {
    try {
      const resp = await fetchWithTimeout(url, config, 15000)
      return resp
    } catch (err) {
      lastError = err
      attempt += 1
      if (attempt > maxRetries) break
      const backoff = 300 * Math.pow(2, attempt - 1) + Math.random() * 200
      await new Promise(r => setTimeout(r, backoff))
    }
  }
  throw lastError || new Error('网络错误')
}

// 🚀 通用 API 调用函数 - HttpOnly Cookie认证 + 自动令牌刷新 + 超时/重试
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = { 
    ...DEFAULT_FETCH_OPTIONS,  // 使用全局默认配置
    ...options,
    headers: { 
      ...DEFAULT_FETCH_OPTIONS.headers, 
      ...options.headers 
    }
  }
  
  // 调试日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 API Call: ${endpoint}`, {
      url,
      method: config.method || 'GET',
      credentials: config.credentials,
      hasCredentials: config.credentials === 'include'
    })
  }
  
  try {
    const isGet = (config.method || 'GET').toUpperCase() === 'GET'
    const response = isGet 
      ? await getWithRetry(url, config, 2)
      : await fetchWithTimeout(url, config, 15000)
    
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
    
    const data = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      // 402: 积分不足，返回结构化错误
      if (response.status === 402) {
        const err = new Error(data?.message || '积分不足')
        err.code = 402
        err.meta = data || {}
        throw err
      }
      const err = new Error(data.detail || data.message || '请求失败')
      err.code = response.status
      err.meta = data || {}
      throw err
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

// 推荐系统 API
export async function getReferralLink() {
  return await apiCall('/api/referrals/me/link')
}

export async function getReferralStats() {
  return await apiCall('/api/referrals/me/stats')
}

export async function getReferralHistory() {
  return await apiCall('/api/referrals/me/history')
}

// 积分相关 API - 不再需要token参数
export async function getCreditHistory(page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  return await apiCall(`/api/auth/credits/history?${params}`)
}

// 🌐 便捷的fetch封装 - 确保所有直接fetch调用也支持HttpOnly Cookie
export async function secureFetch(url, options = {}) {
  const config = {
    ...DEFAULT_FETCH_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_FETCH_OPTIONS.headers,
      ...options.headers
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔒 Secure Fetch: ${url}`, {
      credentials: config.credentials,
      method: config.method || 'GET'
    })
  }
  
  return await fetch(url, config)
}