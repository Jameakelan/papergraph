import type { HTMLAttributes } from "react";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  onClick?: () => void;
}

export function Chip({
  children,
  className = "",
  active,
  onClick,
  ...props
}: ChipProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 
        px-2.5 py-1 
        rounded-full 
        text-xs font-semibold
        transition-colors duration-200
        ${onClick ? "cursor-pointer hover:bg-[var(--color-primary)] hover:text-white" : ""}
        ${
          active
            ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-glow)]"
            : "bg-[var(--color-bg-surface-hover)] text-[var(--color-text-subtle)]"
        }
        ${className}
      `}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: 600,
        backgroundColor: active
          ? "var(--color-primary)"
          : "var(--color-bg-surface-hover)",
        color: active ? "#ffffff" : "var(--color-text-main)",
        boxShadow: active ? "var(--shadow-glow)" : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
      }}
      onClick={onClick}
      {...props}
    >
      {active && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-white"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#fff",
          }}
        />
      )}
      {children}
    </span>
  );
}
