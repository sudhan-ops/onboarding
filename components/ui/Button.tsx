
import React, { useState, useEffect } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  ...props
}) => {
  const [isMobileTheme, setIsMobileTheme] = useState(false);

  useEffect(() => {
    // This effect runs on the client-side, where document is available.
    setIsMobileTheme(document.body.classList.contains('field-officer-dark-theme'));
  }, []);

  const baseStyles = 'inline-flex items-center justify-center font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full';

  const variantStyles = isMobileTheme
    ? {
        primary: 'fo-btn-primary',
        secondary: 'fo-btn-secondary',
        outline: 'fo-btn-outline',
        danger: 'fo-btn-danger',
        icon: 'text-gray-400 hover:bg-gray-800/60',
      }[variant]
    : {
        primary: 'bg-accent text-white hover:bg-accent-dark focus:ring-accent',
        secondary: 'bg-border text-primary-text hover:bg-gray-300 focus:ring-gray-400',
        outline: 'border border-accent text-accent hover:bg-accent-light focus:ring-accent',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        icon: 'text-muted hover:bg-gray-100 focus:ring-accent',
      }[variant];

  const desktopSizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-2 text-sm',
    lg: 'px-8 py-3 text-base',
  };
  
  if (variant === 'icon') {
    desktopSizeStyles.sm = 'p-1.5';
    desktopSizeStyles.md = 'p-2';
    desktopSizeStyles.lg = 'p-3';
  }
  
  // On mobile, padding is defined in the `fo-btn-*` classes, so size styles are not needed for most variants.
  const sizeClass = (isMobileTheme && variant !== 'icon') ? '' : desktopSizeStyles[size];

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};

export default Button;