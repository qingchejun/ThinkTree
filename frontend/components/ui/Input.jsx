import * as React from 'react';
import { cn } from '@/lib/utils';

const sizeToClass = {
  xs: 'h-8 px-2 text-xs',
  sm: 'h-9 px-3 text-sm',
  default: 'h-10 px-3 text-sm',
  lg: 'h-11 px-4 text-base',
};

const statusToClass = {
  default: 'border-brand-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-500',
  success: 'border-success-600 focus-visible:ring-success-600/20 focus-visible:border-success-600',
  warning: 'border-warning-600 focus-visible:ring-warning-600/20 focus-visible:border-warning-600',
  error: 'border-error-600 focus-visible:ring-error-600/20 focus-visible:border-error-600',
  info: 'border-info-600 focus-visible:ring-info-600/20 focus-visible:border-info-600',
};

const Input = React.forwardRef(({ className = '', type = 'text', size = 'default', status = 'default', ...props }, ref) => {
  const sizeClass = sizeToClass[size] || sizeToClass.default;
  const statusClass = statusToClass[status] || statusToClass.default;
  return (
    <input
      type={type}
      className={cn(
        'flex w-full rounded-md border bg-neutral-white ring-offset-neutral-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        sizeClass,
        statusClass,
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };