import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
}

const variantClasses = {
  default: "bg-slate-800",
  elevated: "bg-slate-800 shadow-lg shadow-black/20",
  bordered: "bg-slate-800 border border-slate-700",
};

export function Card({
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl p-4 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
