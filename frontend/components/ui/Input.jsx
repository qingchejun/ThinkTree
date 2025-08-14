import * as React from 'react';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-brand-200 bg-neutral-white px-3 py-2 text-sm ring-offset-neutral-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-2 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input }; 