import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'

// 按钮样式变体定义 - 使用新的设计系统色彩
const buttonVariants = cva(
  // 基础样式 - 使用新的设计token
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // 样式变体 - 基于新的色彩系统
      variant: {
        // 主要按钮 - 使用品牌色
        primary: "bg-brand-800 text-neutral-white hover:bg-brand-900 active:bg-brand-950",
        
        // 次要按钮 - 使用浅色品牌色
        secondary: "bg-brand-100 text-brand-800 hover:bg-brand-200 active:bg-brand-300",
        
        // 强调按钮 - 使用橙色强调色
        accent: "bg-accent-600 text-neutral-white hover:bg-accent-700 active:bg-accent-800",
        
        // 幽灵按钮 - 透明背景
        ghost: "text-brand-700 bg-transparent hover:bg-brand-100 active:bg-brand-200",
        
        // 链接按钮 - 链接样式
        link: "text-brand-600 underline-offset-4 hover:underline active:text-brand-700",
        
        // 成功按钮 - 绿色
        success: "bg-success-600 text-neutral-white hover:bg-success-700 active:bg-success-800",
        
        // 警告按钮 - 黄色
        warning: "bg-warning-600 text-neutral-white hover:bg-warning-700 active:bg-warning-800",
        
        // 错误按钮 - 红色
        error: "bg-error-600 text-neutral-white hover:bg-error-700 active:bg-error-800",
        
        // 向后兼容 - 保留原有变体名称
        default: "bg-brand-800 text-neutral-white hover:bg-brand-900 active:bg-brand-950", // 映射到primary
        outline: "border border-brand-200 bg-transparent text-brand-700 hover:bg-brand-100 active:bg-brand-200",
        destructive: "bg-error-600 text-neutral-white hover:bg-error-700 active:bg-error-800", // 映射到error
      },
      
      // 尺寸变体
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
        xl: "h-14 px-8 text-xl"
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