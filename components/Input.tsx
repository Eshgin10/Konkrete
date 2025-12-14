import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-[13px] text-textSecondary mb-2 pl-4 font-medium">{label}</label>}
      {/* Height 56px (h-14), Rounded 16px (2xl) */}
      <input 
        className={`w-full bg-[#1C1C1E] text-white rounded-2xl px-6 h-14 text-[17px] border-none focus:ring-2 focus:ring-primary/50 outline-none placeholder-gray-600 transition-shadow ${className}`} 
        {...props}
      />
    </div>
  );
};