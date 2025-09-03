import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  "rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-lg hover:shadow-xl",
        interactive: "cursor-pointer hover:shadow-md hover:scale-[1.02] hover:-translate-y-1",
        flat: "border-0 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Card = React.forwardRef(({ 
  className, 
  variant, 
  children, 
  ...props 
}, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
    {children}
  </div>
));

Card.displayName = "Card";

const CardHeader = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => (
  <div ref={ref} className={cn("p-6 pb-0", className)} {...props}>
    {children}
  </div>
));

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => (
  <h3 ref={ref} className={cn("text-xl font-semibold text-gray-900", className)} {...props}>
    {children}
  </h3>
));

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => (
  <p ref={ref} className={cn("text-sm text-gray-600 mt-1", className)} {...props}>
    {children}
  </p>
));

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props}>
    {children}
  </div>
));

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
));

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
