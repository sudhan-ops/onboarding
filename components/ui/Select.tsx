
import React, { useState, useEffect } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  // FIX: Widen the 'error' prop type to 'any' to accommodate complex error types from react-hook-form.
  error?: any;
  registration?: UseFormRegisterReturn;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, error, registration, children, ...props }) => {
  const [isMobileTheme, setIsMobileTheme] = useState(false);

  useEffect(() => {
    setIsMobileTheme(document.body.classList.contains('field-officer-dark-theme'));
  }, []);

  const { className, ...otherProps } = props;
  
  const baseClass = isMobileTheme ? 'fo-select fo-select-arrow' : 'form-input';
  const errorClass = isMobileTheme ? 'fo-select--error' : 'form-input--error';
  const finalClassName = `${baseClass} ${error ? errorClass : ''} ${className || ''}`;

  const selectElement = (
    <select
      id={id}
      className={finalClassName}
      aria-invalid={!!error}
      {...registration}
      {...otherProps}
    >
      {children}
    </select>
  );

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <div className={label ? "mt-1" : ""}>
        {selectElement}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Select;