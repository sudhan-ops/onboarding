
import React, { useState, useEffect } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  // FIX: Widen the 'error' prop type to 'any' to accommodate complex error types from react-hook-form.
  error?: any;
  registration?: UseFormRegisterReturn;
}

const Input: React.FC<InputProps> = ({ label, id, error, registration, ...props }) => {
  const [isMobileTheme, setIsMobileTheme] = useState(false);

  useEffect(() => {
    setIsMobileTheme(document.body.classList.contains('field-officer-dark-theme'));
  }, []);

  const { className, ...otherProps } = props;
  
  const baseClass = isMobileTheme ? 'fo-input' : 'form-input';
  const errorClass = isMobileTheme ? 'fo-input--error' : 'form-input--error';
  const finalClassName = `${baseClass} ${error ? errorClass : ''} ${className || ''}`;
  
  const inputElement = (
    <input
      id={id}
      className={finalClassName}
      aria-invalid={!!error}
      {...registration}
      {...otherProps}
    />
  );

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <div className={label ? "mt-1" : ""}>
        {inputElement}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;