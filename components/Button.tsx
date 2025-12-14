import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ios-list';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  // Base style: 56px height (h-14) for easier touch targets
  const baseStyle = "font-semibold text-[17px] tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center";
  
  // Variants mapping - Unified rounded-2xl (16px)
  const variants = {
    // Primary: h-14 (56px)
    primary: "bg-primary text-white h-14 rounded-2xl shadow-lg shadow-blue-500/25",
    // Secondary: h-14 (56px)
    secondary: "bg-surfaceHighlight text-white h-14 rounded-2xl",
    // Danger: h-14 (56px)
    danger: "bg-danger text-white h-14 rounded-2xl",
    // Ghost: h-10 (40px)
    ghost: "bg-transparent text-primary hover:bg-surfaceHighlight/30 h-10 rounded-lg",
    // iOS List: h-12 (48px)
    'ios-list': "bg-surface text-danger h-12 w-full rounded-none justify-start px-0 active:bg-surfaceHighlight active:scale-100",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : 'px-6'} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};