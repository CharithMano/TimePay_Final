import React from 'react';
import clsx from 'clsx';

const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className,
  required,
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={clsx(
          'form-input',
          error && 'border-danger-300 focus:ring-danger-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;