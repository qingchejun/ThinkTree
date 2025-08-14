"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
      },
      tone: {
        default: 'text-brand-700',
        muted: 'text-brand-500',
        error: 'text-error-600',
      },
    },
    defaultVariants: {
      size: 'sm',
      tone: 'default',
    },
  }
)

const Label = React.forwardRef(({ className, size, tone, requiredIndicator = false, children, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ size, tone }), className)} {...props}>
    {children}
    {requiredIndicator && <span className="ml-1 text-error-600">*</span>}
  </LabelPrimitive.Root>
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }