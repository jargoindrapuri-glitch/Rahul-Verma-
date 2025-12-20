import React from 'react';

// --- Layout & Cards ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm ${className}`}>
    {children}
  </div>
);

export const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-md mx-auto min-h-screen bg-dark-bg text-dark-text flex flex-col pb-24 relative overflow-hidden">
    {children}
  </div>
);

// --- Buttons ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gold-500 text-dark-bg hover:bg-gold-400 shadow-lg shadow-gold-500/20",
    secondary: "bg-dark-border text-dark-text hover:bg-zinc-700 border border-zinc-700",
    ghost: "bg-transparent text-gold-500 hover:bg-gold-500/10",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base font-bold",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

// --- Inputs ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs text-dark-muted mb-1.5 uppercase tracking-wider">{label}</label>}
    <input 
      className={`w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors ${className}`}
      {...props}
    />
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs text-dark-muted mb-1.5 uppercase tracking-wider">{label}</label>}
    <textarea 
      className={`w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors min-h-[100px] resize-none ${className}`}
      {...props}
    />
  </div>
);

// --- Progress Bar ---
export const ProgressBar: React.FC<{ progress: number; color?: string; label?: string }> = ({ progress, color = 'bg-gold-500', label }) => (
  <div className="w-full">
    {label && (
      <div className="flex justify-between text-xs mb-1">
        <span className="text-dark-text">{label}</span>
        <span className="text-dark-muted">{Math.round(progress)}%</span>
      </div>
    )}
    <div className="w-full bg-dark-border rounded-full h-2 overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-500`} 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);
