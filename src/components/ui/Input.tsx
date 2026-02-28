import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-lg border bg-white dark:bg-[#1e1f22] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              error
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary/60',
              icon ? 'pl-10 pr-4' : 'px-4',
              'py-2.5 text-sm',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
