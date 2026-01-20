import React from 'react';
import styled, { css } from 'styled-components';

interface InputProps {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  id?: string;
  name?: string;
  step?: number;
  min?: number;
  max?: number;
  style?: React.CSSProperties;
  autoFocus?: boolean;
}

const InputContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['fullWidth'].includes(prop),
})<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const StyledInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !['hasError'].includes(prop),
})<{ hasError?: boolean }>`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s ease-in-out;
  outline: none;
  background-color: white;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  ${({ hasError }) =>
    hasError &&
    css`
      border-color: #ef4444;
      
      &:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    `}
`;

const ErrorMessage = styled.span`
  font-size: 13px;
  color: #ef4444;
  margin-top: 4px;
`;

const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  disabled = false,
  placeholder,
  type = 'text',
  value,
  onChange,
  onBlur,
  required = false,
  id,
  name,
  ...props
}) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <InputContainer fullWidth={fullWidth}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
        </Label>
      )}
      <StyledInput
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        hasError={!!error}
        autoComplete="off"
        spellCheck="false"
        translate="no"
        {...props}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputContainer>
  );
};

export default Input;