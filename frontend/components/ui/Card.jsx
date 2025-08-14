import * as React from 'react';

// 语义变体到类名的映射（与设计系统 v2.0 对齐）
const cardVariants = {
  default: 'bg-neutral-white border border-brand-200 rounded-lg shadow-sm',
  elevated: 'bg-neutral-white border border-brand-200 rounded-lg shadow-md',
  interactive: 'bg-neutral-white border border-brand-200 rounded-lg shadow-sm hover:shadow-md hover:border-brand-300 transition-shadow duration-200',
  borderless: 'bg-neutral-white border-0 rounded-lg shadow-lg',
  feature: 'bg-brand-50 border-0 rounded-2xl shadow-sm',
  highlight: 'bg-accent-50 border border-accent-200 rounded-lg shadow-sm',
}

const Card = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={`${cardVariants[variant] || cardVariants.default} ${className}`}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight text-brand-800 ${className}`} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-brand-500 ${className}`} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex items-center p-6 pt-0 ${className}`} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }; 