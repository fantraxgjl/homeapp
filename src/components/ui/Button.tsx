"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
}

const variantClasses = {
  primary:
    "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white",
  secondary:
    "bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100",
  ghost:
    "bg-transparent hover:bg-slate-700/50 active:bg-slate-700 text-slate-300",
  danger: "bg-red-600 hover:bg-red-500 active:bg-red-700 text-white",
};

const sizeClasses = {
  sm: "min-h-10 px-3 py-2 text-sm",
  md: "min-h-14 px-4 py-3 text-base",
  lg: "min-h-16 px-6 py-4 text-lg",
  xl: "min-h-20 px-8 py-5 text-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 rounded-xl font-medium
          transition-all duration-150 select-none touch-manipulation
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
