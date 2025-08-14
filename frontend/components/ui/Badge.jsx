import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'

// 徽章样式变体定义（与设计系统 v2.0 对齐）
export const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        // 基础
        default: 'bg-brand-100 text-brand-800',
        secondary: 'bg-brand-50 text-brand-600',

        // 功能性
        success: 'bg-content-100 text-content-800',
        feature: 'bg-core-100 text-core-800',
        popular: 'bg-accent-600 text-neutral-white',

        // 状态
        warning: 'bg-warning-100 text-warning-800',
        error: 'bg-error-100 text-error-800',
        info: 'bg-info-100 text-info-800',
      },
      size: {
        xs: 'text-[10px] px-1.5 py-0.5',
        sm: 'text-xs px-2 py-0.5',
        default: 'text-sm px-2.5 py-1',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    }
  }
)

const Badge = forwardRef(({ className = '', variant, size, children, ...props }, ref) => {
  return (
    <span ref={ref} className={`${badgeVariants({ variant, size })} ${className}`} {...props}>
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'

export { Badge }


