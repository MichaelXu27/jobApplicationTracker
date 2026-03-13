"use client";

import { signOut } from "next-auth/react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import type { Session } from "next-auth";
import type { ApplicationPayload, ApplicationStatus } from "@/types";

interface NavbarProps {
  user: Session["user"];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, "");
}

// Known column keys (after normalizeHeader) — anything else is treated as a
// potential status column (e.g. a person's name like "Michael")
const KNOWN_KEYS = new Set([
  "company", "role", "jobtitle", "location",
  "dateapplied", "date", "notes", "whoapplied", "status",
]);

function normalizeStatus(raw: string): ApplicationStatus {
  const v = raw.toLowerCase().trim();
  if (v === "interviewing" || v === "interview" || v === "in progress") return "INTERVIEWING";
  if (v === "denied" || v === "rejected" || v === "declined") return "DENIED";
  return "APPLIED";
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(value: unknown): string | null {
  if (!value) return null;

  // SheetJS with cellDates:true already gives a JS Date for date cells
  if (value instanceof Date && !isNaN(value.getTime())) {
    return toYMD(value);
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;

    // Strip ordinal suffixes: "Aug 1st" → "Aug 1", "Sep 23rd" → "Sep 23"
    const cleaned = raw.replace(/\b(\d+)(st|nd|rd|th)\b/gi, "$1");

    // If the string already contains a 4-digit year, parse it directly
    if (/\b\d{4}\b/.test(cleaned)) {
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) return toYMD(d);
    }

    // No year present — infer: if the date with the current year would be
    // more than 1 day in the future, assume it belongs to the previous year
    const now = new Date();
    const withCurrentYear = new Date(`${cleaned} ${now.getFullYear()}`);
    if (!isNaN(withCurrentYear.getTime())) {
      const isFuture = withCurrentYear > new Date(now.getTime() + 86_400_000);
      const year = isFuture ? now.getFullYear() - 1 : now.getFullYear();
      return toYMD(new Date(`${cleaned} ${year}`));
    }
  }

  return null;
}

// Map a raw xlsx row object (with arbitrary header casing) → ApplicationPayload
// Returns null (and logs the reason) when a required field is missing/unparseable
function rowToPayload(row: Record<string, unknown>, rowIndex: number): ApplicationPayload | null {
  // Normalise all keys once
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    normalized[normalizeHeader(key)] = row[key];
  }

  const company = String(normalized["company"] ?? "").trim();
  const jobTitle = String(normalized["role"] ?? normalized["jobtitle"] ?? "").trim();
  const rawDate = normalized["dateapplied"] ?? normalized["date"];
  const dateApplied = formatDate(rawDate);

  // Status: check well-known header names first, then fall back to ANY column
  // whose key is not in our known set (e.g. a person's name like "Michael")
  let statusRaw = String(normalized["whoapplied"] ?? normalized["status"] ?? "").trim();
  if (!statusRaw) {
    for (const key of Object.keys(normalized)) {
      if (!KNOWN_KEYS.has(key) && normalized[key]) {
        statusRaw = String(normalized[key]).trim();
        break;
      }
    }
  }

  // Debug: log every skipped row with the specific reason
  if (!company || !jobTitle || !dateApplied) {
    const reasons: string[] = [];
    if (!company) reasons.push("missing company");
    if (!jobTitle) reasons.push("missing role/jobTitle");
    if (!dateApplied) reasons.push(`unparseable date (raw value: ${JSON.stringify(rawDate)})`);
    console.warn(`[xlsx] Row ${rowIndex + 2} skipped — ${reasons.join(", ")}`, {
      rawKeys: Object.keys(row),
      normalizedKeys: Object.keys(normalized),
      values: { company, jobTitle, rawDate, dateApplied, statusRaw },
    });
    return null;
  }

  return {
    company,
    jobTitle,
    dateApplied,
    status: normalizeStatus(statusRaw || "applied"),
    location: String(normalized["location"] ?? "").trim() || undefined,
    notes: (String(normalized["notes"] ?? "").trim() || undefined)?.slice(0, 5000),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  DENIED: "Denied",
};

export default function Navbar({ user }: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleExport() {
    setExporting(true);
    const toastId = toast.loading("Exporting…");
    try {
      const res = await fetch("/api/applications?limit=10000&sortOrder=asc");
      if (!res.ok) throw new Error();
      const { data } = await res.json();

      const rows = (data as {
        company: string; jobTitle: string; location?: string | null;
        dateApplied: string; notes?: string | null; status: string;
      }[]).map((a) => ({
        Company: a.company,
        Role: a.jobTitle,
        Location: a.location ?? "",
        "Date Applied": new Date(a.dateApplied).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }),
        Notes: a.notes ?? "",
        Status: STATUS_LABELS[a.status] ?? a.status,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Applications");
      XLSX.writeFile(wb, "job-applications.xlsx");
      toast.success(`Exported ${rows.length} application${rows.length !== 1 ? "s" : ""}`, { id: toastId });
    } catch {
      toast.error("Export failed", { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("⚠️ DEV: Delete ALL your job applications? This cannot be undone.")) return;
    setClearing(true);
    const toastId = toast.loading("Deleting all applications…");
    try {
      const res = await fetch("/api/applications/all", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to delete", { id: toastId }); return; }
      toast.success(`Deleted ${data.deleted} application${data.deleted !== 1 ? "s" : ""}`, { id: toastId });
      window.dispatchEvent(new CustomEvent("applications-cleared"));
    } catch {
      toast.error("Failed to delete applications", { id: toastId });
    } finally {
      setClearing(false);
    }
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "U";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so the same file can be re-selected later
    e.target.value = "";

    setImporting(true);
    const toastId = toast.loading("Parsing spreadsheet…");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const applications: ApplicationPayload[] = [];
      let skippedParse = 0;

      console.log(`[xlsx] Parsed ${rows.length} rows from "${file.name}"`);
      console.log("[xlsx] Detected headers:", Object.keys(rows[0] ?? {}));

      for (let i = 0; i < rows.length; i++) {
        const payload = rowToPayload(rows[i], i);
        if (payload) {
          applications.push(payload);
        } else {
          skippedParse++;
        }
      }

      console.log(`[xlsx] ${applications.length} valid, ${skippedParse} skipped at parse stage`);

      if (applications.length === 0) {
        toast.error("No valid rows found. Check that the file has the required columns.", { id: toastId });
        return;
      }

      toast.loading(`Importing ${applications.length} application${applications.length !== 1 ? "s" : ""}…`, { id: toastId });

      const res = await fetch("/api/applications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applications }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Import failed", { id: toastId });
        return;
      }

      // Log every server-side validation failure so we can diagnose them
      if (data.errors?.length) {
        console.group(`[xlsx] ${data.errors.length} rows rejected by server validation`);
        (data.errors as string[]).forEach((e: string) => console.warn(e));
        console.groupEnd();
      }

      const totalSkipped = skippedParse + (data.skipped ?? 0);
      const msg =
        totalSkipped > 0
          ? `Imported ${data.inserted} application${data.inserted !== 1 ? "s" : ""} (${totalSkipped} skipped)`
          : `Imported ${data.inserted} application${data.inserted !== 1 ? "s" : ""}`;

      toast.success(msg, { id: toastId });

      // Notify the dashboard to refresh its data
      window.dispatchEvent(new CustomEvent("applications-imported"));
    } catch (err) {
      console.error("[xlsx import]", err);
      toast.error("Failed to parse file. Make sure it is a valid .xlsx file.", { id: toastId });
    } finally {
      setImporting(false);
    }
  }

  return (
    <header className="bg-white sticky top-0 z-30 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">JobTracker</span>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">

            {/* Export xlsx button */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl
                border border-gray-200 bg-white text-gray-600
                hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
              title="Export applications to .xlsx"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export xlsx"}</span>
            </button>

            {/* Import xlsx button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl
                border border-gray-200 bg-white text-gray-600
                hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
              title="Import applications from .xlsx"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden sm:inline">{importing ? "Importing…" : "Import xlsx"}</span>
            </button>

            {/* [DEV] Nuclear delete */}
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl
                border border-red-200 bg-white text-red-500
                hover:bg-red-50 hover:border-red-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
              title="[DEV] Delete all applications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">{clearing ? "Clearing…" : "Clear all"}</span>
            </button>

            {/* User section */}
            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {initials}
              </div>
              <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.name ?? user?.email}
              </span>
            </div>

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800
                px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
