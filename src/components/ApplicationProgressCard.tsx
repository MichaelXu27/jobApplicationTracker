"use client";

import { useMemo } from "react";
import type { Application, ApplicationStatus } from "@/types";

interface Props {
  applications: Application[];
}

// Returns "YYYY-MM-DD" in local time
function toLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface StatColumn {
  label: string;
  status: ApplicationStatus;
  barColor: string;
  textColor: string;
}

const COLUMNS: StatColumn[] = [
  { label: "Applied", status: "APPLIED", barColor: "bg-blue-500", textColor: "text-blue-600" },
  { label: "Interviews", status: "INTERVIEWING", barColor: "bg-amber-500", textColor: "text-amber-600" },
  { label: "Denied", status: "DENIED", barColor: "bg-slate-400", textColor: "text-slate-500" },
];

export default function ApplicationProgressCard({ applications }: Props) {
  const counts = useMemo(() => {
    const c: Record<ApplicationStatus, number> = { APPLIED: 0, INTERVIEWING: 0, DENIED: 0 };
    applications.forEach((a) => { c[a.status as ApplicationStatus]++; });
    return c;
  }, [applications]);

  // Last 7 days data — one mini-bar per day, per status
  const last7 = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const ds = toLocalDate(d);
      const appsOnDay = applications.filter(
        (a) => toLocalDate(new Date(a.dateApplied)) === ds
      );
      return {
        date: ds,
        APPLIED: appsOnDay.filter((a) => a.status === "APPLIED").length,
        INTERVIEWING: appsOnDay.filter((a) => a.status === "INTERVIEWING").length,
        DENIED: appsOnDay.filter((a) => a.status === "DENIED").length,
      };
    });
  }, [applications]);

  const maxDaily = Math.max(...last7.map((d) => d.APPLIED + d.INTERVIEWING + d.DENIED), 1);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900">Application Progress</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {today}
        </div>
      </div>

      {/* Three stat columns */}
      <div className="grid grid-cols-3 gap-3">
        {COLUMNS.map(({ label, status, barColor, textColor }) => {
          const count = counts[status];
          return (
            <div key={status}>
              <p className="text-[11px] text-gray-400 mb-1 leading-none">{label}</p>
              <p className={`text-2xl font-bold ${textColor}`}>{count}</p>

              {/* Mini bar chart — 7 days */}
              <div className="mt-2.5 flex items-end gap-px h-10">
                {last7.map((day) => {
                  const val = day[status as ApplicationStatus];
                  const pct = maxDaily > 0 ? (val / maxDaily) * 100 : 0;
                  const heightPct = Math.max(pct, val > 0 ? 15 : 8);
                  return (
                    <div
                      key={day.date}
                      className={`flex-1 rounded-t-[2px] transition-all ${
                        val > 0 ? barColor : "bg-gray-100"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">Total tracked</span>
        <span className="text-sm font-bold text-gray-900">{applications.length}</span>
      </div>
    </div>
  );
}
