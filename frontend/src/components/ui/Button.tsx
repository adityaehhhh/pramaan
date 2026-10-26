"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "teal";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
      md: "px-4 py-2.5 text-sm rounded-xl gap-2",
      lg: "px-6 py-3.5 text-base rounded-xl gap-2.5",
    };

    const variantClasses = {
      primary:
        "bg-[#315CF5] hover:bg-[#2347DB] text-white shadow-sm shadow-[#315CF5]/25 border border-transparent font-medium",
      secondary:
        "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#14213D] border border-[#E2E8F0] font-medium",
      outline:
        "bg-white hover:bg-[#F8FAFC] text-[#14213D] border border-[#E5EAF2] hover:border-[#CBD5E1] shadow-xs font-medium",
      ghost:
        "bg-transparent hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#14213D] border border-transparent font-medium",
      danger:
        "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm shadow-[#EF4444]/25 border border-transparent font-medium",
      teal:
        "bg-[#14B8A6] hover:bg-[#0D9488] text-white shadow-sm shadow-[#14B8A6]/25 border border-transparent font-medium",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
