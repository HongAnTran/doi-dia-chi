"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { normalizeVietnamese } from "@/lib/normalize";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Pre-normalized text used for accent-insensitive filtering. */
  keywords: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  id?: string;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const normalizedQuery = normalizeVietnamese(query);
  const filtered = normalizedQuery
    ? options.filter((o) => o.keywords.includes(normalizedQuery))
    : options;
  // Clamp instead of resetting in an effect: options can change while open.
  const active =
    filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : 0;

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  React.useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(Math.min(active + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.max(active - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[active];
      if (option) selectOption(option);
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
          setActiveIndex(0);
        }}
        className={cn(
          "border-input flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-transparent px-3 text-left text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
      </button>
      {open && (
        <div className="bg-popover absolute z-50 mt-1 w-full rounded-lg border shadow-md">
          <div className="border-b p-1.5">
            <Input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Tìm kiếm (gõ không dấu được)..."
              className="border-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0"
            />
          </div>
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
          >
            {filtered.length === 0 && (
              <li className="text-muted-foreground px-2.5 py-2 text-sm">
                Không tìm thấy kết quả
              </li>
            )}
            {filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                data-active={index === active}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm",
                  index === active && "bg-muted",
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="size-4 shrink-0" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
