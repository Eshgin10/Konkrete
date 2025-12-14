import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, gradient }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        rounded-2xl p-6 
        ${gradient ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-surface'}
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};