"use client";

import type { Application } from "@/types";
import CompanyAvatar from "./CompanyAvatar";

interface Props {
  applications: Application[];
  onEdit: (app: Application) => void;
}

export default function InterviewPipelineCard({ applications, onEdit }: Props) {
  const pipeline = applications.filter((a) => a.status === "INTERVIEWING");

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Interview Pipeline</h3>
          <p className="text-xs text-gray-400 mt-0.5">Active opportunities</p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            pipeline.length > 0
              ? "bg-amber-50 text-amber-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {pipeline.length} active
        </span>
      </div>

      {pipeline.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">No active interviews</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pipeline.map((app) => (
            <button
              key={app.id}
              onClick={() => onEdit(app)}
              className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl
                hover:bg-gray-50 transition-colors text-left group"
            >
              <CompanyAvatar name={app.company} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                  {app.jobTitle}
                </p>
                <p className="text-xs text-gray-500 truncate">{app.company}</p>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* CTA hint */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
        <p className="text-xs font-medium text-amber-800 mb-0.5">Keep momentum 🚀</p>
        <p className="text-[11px] text-amber-600">
          Follow up within 5 days of an interview to stand out.
        </p>
      </div>
    </div>
  );
}
