import React from 'react';
import { AlertCircle } from 'lucide-react';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error = '',
  helpText = '',
  disabled = false,
  className = '',
  options = [], // For select fields
  rows = 3, // For textarea
  children // For custom input content
}) => {
  const baseInputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

  const renderInput = () => {
    if (children) {
      return children;
    }

    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={baseInputClasses}
            required={required}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={baseInputClasses}
            required={required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClasses}
            required={required}
            min="0"
            step="any"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={baseInputClasses}
            required={required}
          />
        );

      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClasses}
            required={required}
          />
        );
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {renderInput()}

      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Validation utilities
export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`;
  }
  return '';
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  if (!phoneRegex.test(phone) || phone.length < 10) {
    return 'Please enter a valid phone number';
  }
  return '';
};

export const validateNumber = (value, fieldName, min = 0, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (max !== null && num > max) {
    return `${fieldName} must not exceed ${max}`;
  }
  return '';
};

export const validateDate = (date, fieldName) => {
  if (!date) {
    return `${fieldName} is required`;
  }
  const selectedDate = new Date(date);
  const today = new Date();
  if (selectedDate > today) {
    return `${fieldName} cannot be in the future`;
  }
  return '';
};

export default FormField;
