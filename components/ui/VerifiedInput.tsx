
import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import Input from './Input';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface VerifiedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isVerified: boolean;
  hasValue: boolean;
  error?: string;
  registration?: UseFormRegisterReturn;
  onManualInput?: () => void;
}

const VerifiedInput: React.FC<VerifiedInputProps> = ({ label, isVerified, hasValue, error, registration, onManualInput, ...props }) => {
  
  // FIX: Make the handler async to correctly handle the promise-based nature of RHF's onChange.
  const handleInput = async (e: React.FormEvent<HTMLInputElement>) => {
    if (onManualInput) {
        onManualInput();
    }
    if (registration?.onChange) {
      await registration.onChange(e);
    }
  };

  const formRegistration = registration ? { ...registration, onChange: handleInput } : undefined;

  return (
    <div>
        <div className="flex items-center mb-1">
             <label htmlFor={props.id} className="block text-sm font-medium text-muted">
                {label}
            </label>
            {hasValue && (
                isVerified ? (
                    <span className="ml-2 flex items-center text-green-600" title="Verified from document">
                        <CheckCircle className="h-4 w-4" />
                    </span>
                ) : (
                    <span className="ml-2 flex items-center text-yellow-500" title="Manually entered. Please verify.">
                        <AlertTriangle className="h-4 w-4" />
                    </span>
                )
            )}
        </div>
        <Input
            id={props.id}
            error={error}
            registration={formRegistration}
            label="" // Label is handled above
            {...props}
        />
    </div>
  );
};

export default VerifiedInput;
