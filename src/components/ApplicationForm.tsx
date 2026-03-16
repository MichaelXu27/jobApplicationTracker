"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type ApplicationInput } from "@/lib/validations";
import { type Application } from "@/types";
import StatusDropdown from "./StatusDropdown";

interface ApplicationFormProps {
  isOpen: boolean;
  editingApplication: Application | null;
  isSaving: boolean;
  onSubmit: (data: ApplicationInput) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// DatePicker
// ---------------------------------------------------------------------------
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function DatePicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse currently selected date or default to today
  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function toYMD(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const selectedYMD = value;
  const todayYMD = toYMD(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input flex items-center justify-between gap-2 cursor-pointer ${hasError ? "input-error" : ""}`}
      >
        <span className={`text-sm ${displayValue ? "text-gray-900" : "text-gray-400"}`}>
          {displayValue || "Select date"}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl p-3 w-72">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const ymd = toYMD(viewYear, viewMonth, day);
              const isSelected = ymd === selectedYMD;
              const isToday = ymd === todayYMD;
              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => { onChange(ymd); setOpen(false); }}
                  className={`w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-colors
                    ${isSelected
                      ? "bg-blue-600 text-white font-semibold"
                      : isToday
                      ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onChange(todayYMD); setOpen(false); }}
              className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors py-0.5"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ApplicationForm
// ---------------------------------------------------------------------------
export default function ApplicationForm({
  isOpen,
  editingApplication,
  isSaving,
  onSubmit,
  onClose,
}: ApplicationFormProps) {
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { status: "APPLIED" },
  });

  const jobTitleRegistration = register("jobTitle");
  const jobTitleRef = (el: HTMLInputElement | null) => {
    jobTitleRegistration.ref(el);
    firstInputRef.current = el;
  };

  useEffect(() => {
    if (isOpen) {
      if (editingApplication) {
        reset({
          jobTitle: editingApplication.jobTitle,
          company: editingApplication.company,
          location: editingApplication.location ?? "",
          dateApplied: editingApplication.dateApplied.split("T")[0],
          status: editingApplication.status,
          notes: editingApplication.notes ?? "",
          jobDescription: editingApplication.jobDescription ?? "",
          jobLink: editingApplication.jobLink ?? "",
          salary: editingApplication.salary ?? "",
          recruiterContact: editingApplication.recruiterContact ?? "",
        });
      } else {
        reset({
          jobTitle: "",
          company: "",
          location: "",
          dateApplied: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })(),
          status: "APPLIED",
          notes: "",
          jobDescription: "",
          jobLink: "",
          salary: "",
          recruiterContact: "",
        });
      }
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen, editingApplication, reset]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={!isSaving ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative card w-full max-w-2xl my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 id="form-dialog-title" className="text-lg font-semibold text-gray-900">
            {editingApplication ? "Edit Application" : "Add New Application"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-14rem)] overflow-y-auto">

            {/* Row: Job title + Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  className={`input ${errors.jobTitle ? "input-error" : ""}`}
                  {...jobTitleRegistration}
                  ref={jobTitleRef}
                />
                {errors.jobTitle && (
                  <p className="mt-1 text-xs text-red-600">{errors.jobTitle.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe"
                  className={`input ${errors.company ? "input-error" : ""}`}
                  {...register("company")}
                />
                {errors.company && (
                  <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>
                )}
              </div>
            </div>

            {/* Row: Location + Date + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote"
                  className="input"
                  {...register("location")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date Applied <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="dateApplied"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      hasError={!!errors.dateApplied}
                    />
                  )}
                />
                {errors.dateApplied && (
                  <p className="mt-1 text-xs text-red-600">{errors.dateApplied.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <StatusDropdown
                      value={field.value ?? "APPLIED"}
                      onChange={field.onChange}
                      hasError={!!errors.status}
                    />
                  )}
                />
                {errors.status && (
                  <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Row: Salary + Job link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Salary / Compensation
                </label>
                <input
                  type="text"
                  placeholder="e.g. $150,000 - $180,000"
                  className="input"
                  {...register("salary")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  className={`input ${errors.jobLink ? "input-error" : ""}`}
                  {...register("jobLink")}
                />
                {errors.jobLink && (
                  <p className="mt-1 text-xs text-red-600">{errors.jobLink.message}</p>
                )}
              </div>
            </div>

            {/* Recruiter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Recruiter Contact
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Smith — jane@company.com"
                className="input"
                {...register("recruiterContact")}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Interview notes, follow-up actions, impressions…"
                className="input resize-none"
                {...register("notes")}
              />
            </div>

            {/* Job description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Job Description
              </label>
              <textarea
                rows={5}
                placeholder="Paste the full job description here…"
                className="input resize-y"
                {...register("jobDescription")}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  {editingApplication ? "Saving…" : "Adding…"}
                </span>
              ) : editingApplication ? (
                "Save Changes"
              ) : (
                "Add Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
