"use client";

import { useEffect, useRef, useState } from "react";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "@/types";

export const STATUS_CONFIG: Record<ApplicationStatus, { bg: string; text: string; dot: string }> = {
  APPLIED:      { bg: "bg-blue-50",   text: "text-blue-700",  dot: "bg-blue-500"  },
  INTERVIEWING: { bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-500" },
  DENIED:       { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

interface StatusDropdownProps {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  /** If true, adds an "All Statuses" option with value="" at the top */
  includeAll?: boolean;
  allLabel?: string;
}

export default function StatusDropdown({
  value,
  onChange,
  hasError,
  includeAll = false,
  allLabel = "All Statuses",
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isAll = value === "";
  const cfg = STATUS_CONFIG[value as ApplicationStatus];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input flex items-center justify-between gap-2 cursor-pointer ${hasError ? "input-error" : ""}`}
      >
        <span className="flex items-center gap-2">
          {isAll ? (
            <span className="text-sm font-medium text-gray-500">{allLabel}</span>
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg?.dot ?? "bg-gray-400"}`} />
              <span className={`text-sm font-medium ${cfg?.text ?? "text-gray-700"}`}>
                {STATUS_LABELS[value as ApplicationStatus] ?? value}
              </span>
            </>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {includeAll && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
                ${isAll ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-300" />
              <span className="font-medium">{allLabel}</span>
              {isAll && (
                <svg className="ml-auto w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}
          {APPLICATION_STATUSES.map((s) => {
            const c = STATUS_CONFIG[s];
            const isSelected = s === value;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
                  ${isSelected ? `${c.bg} ${c.text}` : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                <span className="font-medium">{STATUS_LABELS[s]}</span>
                {isSelected && (
                  <svg className="ml-auto w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
