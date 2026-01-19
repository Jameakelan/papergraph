import type { PropsWithChildren } from "react";

export interface CardProps extends PropsWithChildren {
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Card({
  children,
  className = "",
  title,
  subtitle,
  actions,
}: CardProps) {
  return (
    <div
      className={`
        bg-[var(--color-bg-surface)] 
        backdrop-blur-md 
        border border-[var(--color-border)] 
        rounded-[var(--radius-md)] 
        shadow-[var(--shadow-lg)]
        flex flex-col
        ${className}
      `}
      style={{
        backgroundColor: "var(--color-bg-surface)",
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {(title || subtitle || actions) && (
        <div
          className="p-4 border-b border-[var(--color-border)] flex items-start justify-between gap-4"
          style={{
            padding: "var(--space-4)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div>
            {title && (
              <h3
                className="m-0 text-base font-semibold text-[var(--color-text-main)]"
                style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <div
                className="mt-1 text-sm text-[var(--color-text-muted)]"
                style={{
                  marginTop: "2px",
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div
        className="p-4 flex-1 flex flex-col overflow-hidden"
        style={{ padding: "var(--space-4)" }}
      >
        {children}
      </div>
    </div>
  );
}
