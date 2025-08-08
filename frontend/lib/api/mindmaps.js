import { apiCall } from './base'

export async function listMindmaps({ limit = 20, cursor = null } = {}) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (cursor) params.set('cursor', cursor)
  return await apiCall(`/api/mindmaps?${params.toString()}`)
}

export async function getMindmap(id) {
  return await apiCall(`/api/mindmaps/${id}`)
}

export async function createMindmap(payload) {
  return await apiCall('/api/mindmaps', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateMindmap(id, payload) {
  return await apiCall(`/api/mindmaps/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export async function patchMindmap(id, payload) {
  return await apiCall(`/api/mindmaps/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteMindmap(id) {
  return await apiCall(`/api/mindmaps/${id}`, { method: 'DELETE' })
}


