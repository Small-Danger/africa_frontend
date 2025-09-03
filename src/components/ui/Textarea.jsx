import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textareaVariants = cva(
  "flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition-all duration-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      size: {
        sm: "min-h-[80px] px-2 py-2 text-xs",
        md: "min-h-[100px] px-3 py-2 text-sm",
        lg: "min-h-[120px] px-4 py-3 text-base",
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

const Textarea = React.forwardRef(({ 
  className, 
  size, 
  error, 
  ...props 
}, ref) => {
  return (
    <textarea
      className={cn(textareaVariants({ size, error }), className)}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export default Textarea;
