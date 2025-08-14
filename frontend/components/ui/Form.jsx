import * as React from 'react'
import { Label as BaseLabel } from './Label'

export const FormField = ({ children, className = '' }) => (
  <div className={`space-y-2 ${className}`}>{children}</div>
)

export const FormItem = ({ children, className = '' }) => (
  <div className={`space-y-1 ${className}`}>{children}</div>
)

export const FormLabel = ({ children, required = false, ...props }) => (
  <BaseLabel requiredIndicator={required} {...props}>{children}</BaseLabel>
)

export const FormControl = ({ children }) => children

export const HelperText = ({ children, tone = 'muted' }) => {
  const toneClass = {
    muted: 'text-brand-500',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
    info: 'text-info-600',
  }[tone] || 'text-brand-500'
  return <p className={`text-xs ${toneClass}`}>{children}</p>
}

export const FormMessage = ({ message, status = 'default' }) => {
  if (!message) return null
  const color = {
    default: 'text-brand-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
    info: 'text-info-600',
  }[status] || 'text-brand-600'
  return <p className={`text-xs ${color}`}>{message}</p>
}
