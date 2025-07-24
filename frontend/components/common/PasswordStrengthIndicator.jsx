/**
 * 密码强度指示器组件
 * ThinkSo v3.2.0 - 强密码验证功能
 */
'use client'

import { useState, useEffect } from 'react'

const PasswordStrengthIndicator = ({ password, onStrengthChange }) => {
  const [strength, setStrength] = useState({
    length: false,
    has_uppercase: false,
    has_lowercase: false,
    has_numbers: false,
    has_special: false,
    is_valid: false,
    strength_level: 'weak',
    score: 0
  })
  const [checking, setChecking] = useState(false)

  // 检查密码强度
  const checkPasswordStrength = async (password) => {
    if (!password) {
      const emptyStrength = {
        length: false,
        has_uppercase: false,
        has_lowercase: false,
        has_numbers: false,
        has_special: false,
        is_valid: false,
        strength_level: 'weak',
        score: 0
      }
      setStrength(emptyStrength)
      onStrengthChange?.(emptyStrength)
      return
    }

    setChecking(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-password-strength`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        const data = await response.json()
        setStrength(data)
        onStrengthChange?.(data)
      }
    } catch (err) {
      console.error('检查密码强度失败:', err)
    } finally {
      setChecking(false)
    }
  }

  // 监听密码变化，使用防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      checkPasswordStrength(password)
    }, 300)

    return () => clearTimeout(timer)
  }, [password])

  // 获取强度条颜色
  const getStrengthColor = () => {
    switch (strength.strength_level) {
      case 'weak':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'strong':
        return 'bg-blue-500'
      case 'very_strong':
        return 'bg-green-500'
      default:
        return 'bg-gray-300'
    }
  }

  // 获取强度文本
  const getStrengthText = () => {
    switch (strength.strength_level) {
      case 'weak':
        return '弱'
      case 'medium':
        return '中等'
      case 'strong':
        return '强'
      case 'very_strong':
        return '很强'
      default:
        return '无'
    }
  }

  // 获取强度百分比
  const getStrengthPercentage = () => {
    return (strength.score / 5) * 100
  }

  if (!password) return null

  return (
    <div className="mt-2 space-y-3">
      {/* 强度条 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">密码强度</span>
          <span className={`text-sm font-medium ${
            strength.is_valid ? 'text-green-600' : 'text-gray-500'
          }`}>
            {checking ? '检查中...' : getStrengthText()}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${getStrengthPercentage()}%` }}
          />
        </div>
      </div>

      {/* 详细要求检查 */}
      <div className="space-y-1">
        <div className="text-xs text-gray-600 mb-2">密码要求：</div>
        
        {/* 长度要求 */}
        <div className={`flex items-center text-xs ${
          strength.length ? 'text-green-600' : 'text-gray-500'
        }`}>
          <span className="mr-2">
            {strength.length ? '✓' : '○'}
          </span>
          <span>至少8位字符</span>
        </div>

        {/* 大写字母 */}
        <div className={`flex items-center text-xs ${
          strength.has_uppercase ? 'text-green-600' : 'text-gray-500'
        }`}>
          <span className="mr-2">
            {strength.has_uppercase ? '✓' : '○'}
          </span>
          <span>包含大写字母 (A-Z)</span>
        </div>

        {/* 小写字母 */}
        <div className={`flex items-center text-xs ${
          strength.has_lowercase ? 'text-green-600' : 'text-gray-500'
        }`}>
          <span className="mr-2">
            {strength.has_lowercase ? '✓' : '○'}
          </span>
          <span>包含小写字母 (a-z)</span>
        </div>

        {/* 数字 */}
        <div className={`flex items-center text-xs ${
          strength.has_numbers ? 'text-green-600' : 'text-gray-500'
        }`}>
          <span className="mr-2">
            {strength.has_numbers ? '✓' : '○'}
          </span>
          <span>包含数字 (0-9)</span>
        </div>

        {/* 特殊字符 */}
        <div className={`flex items-center text-xs ${
          strength.has_special ? 'text-green-600' : 'text-gray-500'
        }`}>
          <span className="mr-2">
            {strength.has_special ? '✓' : '○'}
          </span>
          <span>包含特殊字符 (!@#$%等)</span>
        </div>

        {/* 总体要求 */}
        <div className={`flex items-center text-xs font-medium mt-2 pt-2 border-t border-gray-200 ${
          strength.is_valid ? 'text-green-600' : 'text-orange-600'
        }`}>
          <span className="mr-2">
            {strength.is_valid ? '✓' : '!'}
          </span>
          <span>
            {strength.is_valid 
              ? '密码符合安全要求' 
              : '需要满足至少3种字符类型'
            }
          </span>
        </div>
      </div>
    </div>
  )
}

export default PasswordStrengthIndicator