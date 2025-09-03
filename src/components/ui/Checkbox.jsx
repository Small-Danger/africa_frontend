import React from 'react';

const Checkbox = ({ 
  checked = false, 
  onChange, 
  disabled = false, 
  indeterminate = false,
  className = "",
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      ref={(el) => {
        if (el) {
          el.indeterminate = indeterminate;
        }
      }}
      className={`
        ${sizeClasses[size]}
        text-blue-600 
        border-gray-300 
        rounded 
        focus:ring-blue-500 
        focus:ring-2
        disabled:opacity-50 
        disabled:cursor-not-allowed
        ${className}
      `}
    />
  );
};

export default Checkbox;
