"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-[#14213D] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none rounded-xl bg-white border text-sm text-[#14213D] pl-3.5 pr-10 py-2.5 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
              error ? "border-[#EF4444] focus:ring-[#EF4444]/20 focus:border-[#EF4444]" : "border-[#E5EAF2]"
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3.5 text-[#64748B] pointer-events-none flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-[#EF4444] mt-1.5 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
