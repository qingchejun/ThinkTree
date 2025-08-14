"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const sizeToClass = {
  sm: 'h-[20px] w-[36px]',
  default: 'h-[24px] w-[44px]',
  lg: 'h-[28px] w-[52px]',
}

const thumbSizeToClass = {
  sm: 'h-4 w-4 data-[state=checked]:translate-x-4',
  default: 'h-5 w-5 data-[state=checked]:translate-x-5',
  lg: 'h-6 w-6 data-[state=checked]:translate-x-6',
}

const Switch = React.forwardRef(({ className, size = 'default', ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-content-600 data-[state=unchecked]:bg-brand-200',
      sizeToClass[size] || sizeToClass.default,
      className
    )}
    {...props}
    ref={ref}>
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block rounded-full bg-neutral-white shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0',
        thumbSizeToClass[size] || thumbSizeToClass.default,
      )} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }