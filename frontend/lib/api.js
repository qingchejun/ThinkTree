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
  
  const config = { 
    ...defaultOptions, 
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers }
  }
  
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
export async function uploadFile(file, token) {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
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
export async function processText(text, token) {
  if (!text || !text.trim()) {
    throw new Error('文本内容不能为空')
  }
  
  return await apiCall('/api/process-text', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text.trim()
    })
  })
}

// 思维导图 CRUD 操作
export async function createMindMap(mindmapData, token) {
  return await apiCall('/api/mindmaps', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mindmapData)
  })
}

export async function getMindMap(mindmapId, token) {
  return await apiCall(`/api/mindmaps/${mindmapId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

export async function updateMindMap(mindmapId, mindmapData, token) {
  return await apiCall(`/api/mindmaps/${mindmapId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mindmapData)
  })
}

export async function deleteMindMap(mindmapId, token) {
  return await apiCall(`/api/mindmaps/${mindmapId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

export async function listMindMaps(token) {
  return await apiCall('/api/mindmaps', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
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

export async function getProfile(token) {
  return await apiCall('/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

// 用户设置相关 API
export async function updateProfile(profileData, token) {
  return await apiCall('/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  })
}

// 密码更新 API
export async function updatePassword(token, currentPassword, newPassword, confirmPassword) {
  return await apiCall('/api/auth/password', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    })
  })
}

// 邀请码相关 API
export async function generateInvitationCode(token, description = '') {
  return await apiCall('/api/invitations/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      description: description || null,
      expires_hours: null 
    })
  })
}

export async function getUserInvitations(token) {
  return await apiCall('/api/invitations/list', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

// 积分相关 API
export async function getCreditHistory(token, page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  return await apiCall(`/api/auth/credits/history?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}