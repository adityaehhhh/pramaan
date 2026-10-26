import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export interface AlertBannerProps {
  type?: "success" | "warning" | "danger" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function AlertBanner({
  type = "info",
  title,
  message,
  onClose,
  className = "",
}: AlertBannerProps) {
  const typeConfig = {
    success: {
      bg: "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]",
      icon: <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />,
    },
    warning: {
      bg: "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]",
      icon: <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />,
    },
    danger: {
      bg: "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]",
      icon: <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />,
    },
    info: {
      bg: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]",
      icon: <Info className="w-4 h-4 text-[#2563EB] shrink-0" />,
    },
  };

  const current = typeConfig[type];

  return (
    <div
      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${current.bg} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">{current.icon}</span>
        <div>
          {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
          <p className="leading-relaxed">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 transition-colors shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
