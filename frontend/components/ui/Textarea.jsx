import * as React from "react"

// 简单的类名合并工具函数
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-brand-200 bg-neutral-white px-3 py-2 text-sm ring-offset-neutral-white placeholder:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-2 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }