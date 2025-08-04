/**
 * 服务状态检查组件 - 显示后端服务连接状态
 */
'use client'

import { useState, useEffect } from 'react'

export default function ServiceStatus({ onStatusChange }) {
  const [status, setStatus] = useState('checking') // checking, online, offline
  const [lastCheck, setLastCheck] = useState(null)

  const checkServiceStatus = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        setStatus('online')
        onStatusChange?.('online')
      } else {
        setStatus('offline')
        onStatusChange?.('offline')
      }
    } catch (error) {
      console.error('服务状态检查失败:', error)
      setStatus('offline')
      onStatusChange?.('offline')
    }
    setLastCheck(new Date())
  }

  useEffect(() => {
    // 立即检查一次
    checkServiceStatus()
    
    // 每30秒检查一次
    const interval = setInterval(checkServiceStatus, 30000)
    
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-red-500'
      case 'checking':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return '服务正常'
      case 'offline':
        return '服务不可用'
      case 'checking':
        return '检查中...'
      default:
        return '未知状态'
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span className="text-gray-600">{getStatusText()}</span>
      {lastCheck && (
        <span className="text-gray-400 text-xs">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}