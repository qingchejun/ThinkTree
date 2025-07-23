/**
 * API 调用工具库
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 通用 API 调用函数
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  const config = { ...defaultOptions, ...options }
  
  try {
    const response = await fetch(url, config)
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

// 文件上传
export async function uploadFile(file, format = 'tree') {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload?format_type=${format}`, {
      method: 'POST',
      body: formData,
    })
    
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

// 处理文本
export async function processText(text, format = 'tree') {
  if (!text || !text.trim()) {
    throw new Error('文本内容不能为空')
  }
  
  return await apiCall('/api/process-text', {
    method: 'POST',
    body: JSON.stringify({
      text: text.trim(),
      format_type: format
    })
  })
}

// 思维导图 CRUD 操作
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

export async function getProfile() {
  return await apiCall('/api/auth/profile')
}