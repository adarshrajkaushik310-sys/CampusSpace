'use client';

import React from 'react';
import Link from 'next/link';

export type ButtonVariant = 'primary' | 'secondary' | 'purple' | 'danger' | 'ghost' | 'outline' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BubbleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  target?: string;
  rel?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export function BubbleButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  target,
  rel,
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: BubbleButtonProps) {
  // Bubble styling: pill shape, generous padding, subtle 1-2px lift on hover, scale(0.98) on press, 160ms transition
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-full cursor-pointer select-none ' +
    'transition-all duration-160 ease-out ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 tracking-normal',
    md: 'text-sm px-4.5 py-2 gap-2 tracking-normal',
    lg: 'text-base px-6 py-2.5 gap-2.5 tracking-normal',
  }[size];

  const variantStyles = {
    // Solid Blue for primary actions
    primary:
      'bg-[#2563EB] text-white ' +
      'hover:bg-[#1D4ED8] hover:-translate-y-[1px] hover:shadow-bubble ' +
      'active:translate-y-0 active:scale-[0.98] ' +
      'focus-visible:ring-[#2563EB]',
    // Solid Purple for selected filters or secondary primary
    purple:
      'bg-[#7C3AED] text-white ' +
      'hover:bg-[#6D28D9] hover:-translate-y-[1px] hover:shadow-bubble-purple ' +
      'active:translate-y-0 active:scale-[0.98] ' +
      'focus-visible:ring-[#7C3AED]',
    // Neutral clean surface for secondary
    secondary:
      'bg-white text-[#111827] border border-[#D1D5DB] ' +
      'hover:bg-[#F3F4F6] hover:border-[#9CA3AF] hover:-translate-y-[1px] ' +
      'active:translate-y-0 active:scale-[0.98] ' +
      'focus-visible:ring-[#2563EB]',
    // Danger: Solid Red
    danger:
      'bg-[#DC2626] text-white ' +
      'hover:bg-[#B91C1C] hover:-translate-y-[1px] hover:shadow-bubble-danger ' +
      'active:translate-y-0 active:scale-[0.98] ' +
      'focus-visible:ring-[#DC2626]',
    // Success: maps cleanly to solid blue per strict palette rule
    success:
      'bg-[#2563EB] text-white ' +
      'hover:bg-[#1D4ED8] hover:-translate-y-[1px] ' +
      'active:translate-y-0 active:scale-[0.98] ' +
      'focus-visible:ring-[#2563EB]',
    ghost:
      'bg-transparent text-[#4B5563] hover:text-[#000000] hover:bg-[#F3F4F6] ' +
      'active:scale-[0.98] focus-visible:ring-[#2563EB]',
    outline:
      'bg-transparent text-[#111827] border border-[#D1D5DB] hover:border-[#000000] hover:bg-[#F9FAFB] ' +
      'hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] focus-visible:ring-[#2563EB]',
  }[variant];

  const content = (
    <>
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {!isLoading && icon && iconPosition === 'left' && <span className="inline-flex flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && <span className="inline-flex flex-shrink-0">{icon}</span>}
    </>
  );

  if (href && !disabled && !isLoading) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
}
