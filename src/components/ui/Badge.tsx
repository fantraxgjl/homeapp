import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantClasses = {
  default: "bg-slate-700 text-slate-300",
  success: "bg-emerald-900/50 text-emerald-400",
  warning: "bg-amber-900/50 text-amber-400",
  danger: "bg-red-900/50 text-red-400",
  info: "bg-indigo-900/50 text-indigo-400",
};

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
