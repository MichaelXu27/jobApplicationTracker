"use client";

import { useState } from "react";
import type { Application } from "@/types";
import StatusBadge from "./StatusBadge";
import CompanyAvatar from "./CompanyAvatar";

interface Props {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onAdd: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (hours < 1) return `${minutes}m ago`;
  if (days < 1) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function RecentApplicationsPanel({ applications, onEdit, onDelete, onAdd }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const recent = applications.slice(0, 4);

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="font-semibold text-gray-900">Your Recent Applications</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700
            bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add new
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No applications yet</p>
            <p className="text-xs text-gray-400">Add your first job application to get started.</p>
          </div>
        ) : (
          recent.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div key={app.id} className="px-5 py-3.5">
                {/* Row */}
                <div className="flex items-start gap-3">
                  <CompanyAvatar name={app.company} />

                  {/* Middle content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {app.jobTitle}
                          </span>
                          <StatusBadge status={app.status} size="sm" />
                        </div>
                        {app.salary && (
                          <span className="text-xs text-gray-500">{app.salary}</span>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {(app.location) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {app.location && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium
                            bg-gray-100 text-gray-600 rounded-full">
                            {app.location}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Notes snippet */}
                    {app.notes && (
                      <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">
                        {app.notes}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{app.company}</span>
                        <span className="mx-1">·</span>
                        <span>{timeAgo(app.updatedAt)}</span>
                      </div>

                      {/* Action icons */}
                      <div className="flex items-center gap-1">
                        {app.jobLink && (
                          <a
                            href={app.jobLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-6 h-6 flex items-center justify-center rounded-lg
                              text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        <button
                          onClick={() => onEdit(app)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg
                            text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(app)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg
                            text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {/* Expand toggle */}
                        {app.jobDescription && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : app.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg
                              text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <svg
                              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded job description */}
                    {isExpanded && app.jobDescription && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600
                        leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {app.jobDescription}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {applications.length > 4 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400">
            Showing 4 of {applications.length} applications — scroll down for full table
          </p>
        </div>
      )}
    </div>
  );
}
