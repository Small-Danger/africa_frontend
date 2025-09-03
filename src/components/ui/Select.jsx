import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const selectVariants = cva(
  "flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-no-repeat",
  {
    variants: {
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
      error: {
        true: "border-red-300 focus:ring-red-500 focus:border-red-300",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const Select = React.forwardRef(({ 
  className, 
  size, 
  error, 
  children,
  ...props 
}, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          selectVariants({ size, error }), 
          "pr-10", // Espace pour l'icône
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
});

Select.displayName = "Select";

const SelectOption = ({ value, children, ...props }) => (
  <option value={value} {...props}>
    {children}
  </option>
);

export { Select, SelectOption };
