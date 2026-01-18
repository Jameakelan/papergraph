import { useState, useRef, useEffect } from "react";
import { Chip } from "./Chip";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = "Select...",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full" ref={containerRef}>
      <label className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <div
          className="min-h-[38px] p-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] cursor-pointer flex flex-wrap gap-2 items-center hover:border-[var(--color-primary)] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selected.length === 0 && (
            <span className="text-[var(--color-text-subtle)] text-sm">
              {placeholder}
            </span>
          )}
          {selected.map((item) => (
            <div
              key={item}
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(item);
              }}
            >
              <Chip className="cursor-pointer hover:bg-red-100 hover:text-red-600">
                {item} &times;
              </Chip>
            </div>
          ))}
          <div className="ml-auto text-[var(--color-text-subtle)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {isOpen && options.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-lg)] z-[100] p-1">
            {options.map((option) => (
              <div
                key={option}
                className={`
                  p-2 text-sm rounded cursor-pointer transition-colors flex items-center justify-between
                  ${
                    selected.includes(option)
                      ? "bg-[var(--color-primary)] text-white"
                      : "hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-main)]"
                  }
                `}
                onClick={() => toggleOption(option)}
              >
                <span>{option}</span>
                {selected.includes(option) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
