"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type ApplicationInput } from "@/lib/validations";
import { APPLICATION_STATUSES, STATUS_LABELS, type Application } from "@/types";

interface ApplicationFormProps {
  isOpen: boolean;
  editingApplication: Application | null;
  isSaving: boolean;
  onSubmit: (data: ApplicationInput) => void;
  onClose: () => void;
}

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
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { status: "APPLIED" },
  });

  // react-hook-form's register() returns its own ref. To also focus the first
  // field, we extract the ref callback and call both.
  const jobTitleRegistration = register("jobTitle");
  const jobTitleRef = (el: HTMLInputElement | null) => {
    jobTitleRegistration.ref(el);
    firstInputRef.current = el;
  };

  // Populate form when editing, or reset for create
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
          dateApplied: new Date().toISOString().split("T")[0],
          status: "APPLIED",
          notes: "",
          jobDescription: "",
          jobLink: "",
          salary: "",
          recruiterContact: "",
        });
      }
      // Focus first input after DOM settles
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen, editingApplication, reset]);

  // Close on Escape
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
                <input
                  type="date"
                  className={`input ${errors.dateApplied ? "input-error" : ""}`}
                  {...register("dateApplied")}
                />
                {errors.dateApplied && (
                  <p className="mt-1 text-xs text-red-600">{errors.dateApplied.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input ${errors.status ? "input-error" : ""}`}
                  {...register("status")}
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
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
