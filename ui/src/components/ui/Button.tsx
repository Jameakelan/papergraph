import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "var(--radius-sm)",
    fontWeight: 500,
    fontSize: "14px",
    transition: "all 0.2s ease",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border: "1px solid transparent",
  };

  const variants = {
    primary: {
      backgroundColor: "var(--color-primary)",
      color: "var(--color-primary-foreground)",
      boxShadow: "0 0 15px -3px rgba(99, 102, 241, 0.4)",
    },
    secondary: {
      backgroundColor: "var(--color-bg-surface-hover)",
      color: "var(--color-text-main)",
      border: "1px solid var(--color-border-highlight)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--color-text-main)",
      border: "1px solid var(--color-border-highlight)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--color-text-muted)",
    },
  };

  const sizes = {
    sm: { padding: "6px 10px", fontSize: "13px" },
    md: { padding: "8px 16px", fontSize: "14px" },
    lg: { padding: "12px 20px", fontSize: "16px" },
  };

  const style = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
  };

  return (
    <button
      className={`btn-${variant} ${className}`}
      style={style}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
