import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, className = "", containerClassName = "", ...props },
    ref,
  ) => {
    return (
      <div
        className={`flex flex-col gap-1.5 ${containerClassName}`}
        style={{ display: "flex", flexDirection: "column", gap: "6px" }}
      >
        {label && (
          <label
            className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full
            bg-[var(--color-bg-surface)]
            border border-[var(--color-border)]
            rounded-[var(--radius-sm)]
            px-3 py-2
            text-[var(--color-text-main)]
            placeholder-[var(--color-text-subtle)]
            focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]
            transition-colors
            ${className}
          `}
          style={{
            width: "100%",
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            color: "var(--color-text-main)",
            outline: "none",
          }}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";
