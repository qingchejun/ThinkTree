import * as React from 'react'
import { cn } from '@/lib/utils'

const sizeToClass = {
  xs: 'text-xs px-2 py-1.5',
  sm: 'text-sm px-3 py-2',
  default: 'text-sm px-3 py-2',
  lg: 'text-base px-4 py-3',
}

const statusToClass = {
  default: 'border-brand-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-500',
  success: 'border-success-600 focus-visible:ring-success-600/20 focus-visible:border-success-600',
  warning: 'border-warning-600 focus-visible:ring-warning-600/20 focus-visible:border-warning-600',
  error: 'border-error-600 focus-visible:ring-error-600/20 focus-visible:border-error-600',
  info: 'border-info-600 focus-visible:ring-info-600/20 focus-visible:border-info-600',
}

const Textarea = React.forwardRef(({ className = '', size = 'default', status = 'default', minRows = 4, ...props }, ref) => {
  const sizeClass = sizeToClass[size] || sizeToClass.default
  const statusClass = statusToClass[status] || statusToClass.default
  return (
    <textarea
      rows={minRows}
      className={cn(
        'flex w-full rounded-md border bg-neutral-white ring-offset-neutral-white placeholder:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        sizeClass,
        statusClass,
        'min-h-[80px]',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }