import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "neutral" | "teal" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 font-medium tracking-wide",
    md: "text-xs px-2.5 py-1 font-semibold",
  };

  const variantClasses = {
    primary: "bg-[#EFF4FF] text-[#315CF5] border border-[#BFDBFE]",
    success: "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]",
    warning: "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",
    danger: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
    teal: "bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]",
    neutral: "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]",
    outline: "bg-white text-[#14213D] border border-[#E5EAF2]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
