import { apiCall } from './base'

export async function initiateLogin(email, invitationCode) {
  return await apiCall('/api/auth/initiate-login', {
    method: 'POST',
    body: JSON.stringify({ email, invitation_code: invitationCode || null }),
  })
}

export async function verifyCode(email, code) {
  return await apiCall('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export async function getProfile() {
  return await apiCall('/api/auth/profile')
}

export async function refresh() {
  return await apiCall('/api/auth/refresh', { method: 'POST' })
}

export async function logout() {
  return await apiCall('/api/auth/logout', { method: 'POST' })
}


