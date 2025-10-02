import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from 'react-date-range';
// FIX: Removed parseISO from import to resolve module export error.
import { format } from 'date-fns';

interface DatePickerProps {
  label: string;
  id: string;
  value: string | null | undefined; // Expects YYYY-MM-DD string
  onChange: (date: string) => void;
  error?: string;
  maxDate?: Date;
  minDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, id, value, onChange, error, maxDate, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isMobileTheme, setIsMobileTheme] = useState(false);

  useEffect(() => {
    setIsMobileTheme(document.body.classList.contains('field-officer-dark-theme'));
  }, []);
  
  // FIX: Replaced parseISO with a timezone-safe new Date() constructor.
  // Replacing dashes with slashes forces the browser to interpret the date as local, not UTC.
  const selectedDate = value ? new Date(value.replace(/-/g, '/')) : undefined;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const desktopErrorClasses = 'border-border focus-within:ring-accent';
  const mobileErrorClasses = 'fo-input';

  const errorClasses = error 
    ? (isMobileTheme ? 'fo-input--error' : 'border-red-500 focus-within:ring-red-500')
    : (isMobileTheme ? '' : 'border-border focus-within:ring-accent');

  const wrapperClasses = isMobileTheme 
    ? `mt-1 relative flex items-center w-full fo-input ${errorClasses}`
    : `mt-1 relative flex items-center bg-card border ${errorClasses} rounded-lg px-3 py-2.5 w-full sm:text-sm focus-within:ring-1`;

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-muted">
        {label}
      </label>
      <div className={wrapperClasses}>
        <input
          id={id}
          type="text"
          readOnly
          value={value && selectedDate ? format(selectedDate, 'dd MMM, yyyy') : ''}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-transparent w-full focus:outline-none cursor-pointer"
          placeholder="Select a date"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-invalid={!!error}
        />
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-muted" aria-label="Open calendar">
          <CalendarIcon className="h-5 w-5" />
        </button>
      </div>
      {isOpen && (
        <div ref={wrapperRef} className="absolute z-10 mt-1 bg-card border border-border rounded-lg shadow-lg" role="dialog">
          <Calendar
            date={selectedDate}
            onChange={handleSelect}
            maxDate={maxDate}
            minDate={minDate}
            color="#005D22"
          />
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
};

export default DatePicker;
