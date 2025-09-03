import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  "flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
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

const Input = React.forwardRef(({ 
  className, 
  size, 
  error, 
  onChange,
  ...props 
}, ref) => {
  const handleChange = (e) => {
    console.log(`🎯 Input onChange appelé:`, e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <input
      className={cn(inputVariants({ size, error }), className)}
      ref={ref}
      onChange={handleChange}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;
