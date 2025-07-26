import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'

// 按钮样式变体定义
const buttonVariants = cva(
  // 基础样式
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // 样式变体
      variant: {
        primary: "bg-brand-primary text-white hover:bg-brand-primary/90 active:bg-brand-primary/95",
        secondary: "bg-background-secondary text-text-primary hover:bg-border-secondary active:bg-border-primary",
        ghost: "text-text-primary hover:bg-background-secondary active:bg-border-secondary",
        link: "text-brand-primary underline-offset-4 hover:underline active:text-brand-primary/80"
      },
      // 尺寸变体
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg"
      }
    },
    // 默认值
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
)

// Button 组件
const Button = forwardRef(({ 
  className = "", 
  variant, 
  size, 
  children, 
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={`${buttonVariants({ variant, size })} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = "Button"

export { Button, buttonVariants } 