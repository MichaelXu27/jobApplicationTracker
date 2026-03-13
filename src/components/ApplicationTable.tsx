"use client";

import { useState } from "react";
import type { Application, ApplicationStatus } from "@/types";
import StatusBadge from "./StatusBadge";
import CompanyAvatar from "./CompanyAvatar";
import StatusDropdown from "./StatusDropdown";

interface ApplicationTableProps {
  applications: Application[];
  isLoading: boolean;
  statusFilter: ApplicationStatus | "";
  searchQuery: string;
  sortOrder: "asc" | "desc";
  page: number;
  totalPages: number;
  onStatusFilterChange: (s: ApplicationStatus | "") => void;
  onSearchChange: (s: string) => void;
  onSortToggle: () => void;
  onPageChange: (p: number) => void;
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onAddNew: () => void;
}

export default function ApplicationTable({
  applications,
  isLoading,
  statusFilter,
  searchQuery,
  sortOrder,
  page,
  totalPages,
  onStatusFilterChange,
  onSearchChange,
  onSortToggle,
  onPageChange,
  onEdit,
  onDelete,
  onAddNew,
}: ApplicationTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="card overflow-hidden">
      {/* Filter / Search Bar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search role, company, location…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Status filter */}
        <div className="sm:w-44">
          <StatusDropdown
            value={statusFilter}
            onChange={(v) => onStatusFilterChange(v as ApplicationStatus | "")}
            includeAll
          />
        </div>

        {/* Sort */}
        <button onClick={onSortToggle} className="btn-secondary gap-1.5 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          {sortOrder === "desc" ? "Newest first" : "Oldest first"}
        </button>

        {/* Add */}
        <button onClick={onAddNew} className="btn-primary gap-1.5 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Application
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : applications.length === 0 ? (
        <EmptyState
          hasFilters={!!(statusFilter || searchQuery)}
          onAddNew={onAddNew}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-32" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    Role / Company
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    Location
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    Date Applied
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => (
                  <>
                    <tr
                      key={app.id}
                      onClick={() => setExpandedRow(expandedRow === app.id ? null : app.id)}
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <CompanyAvatar name={app.company} size="sm" />
                          <div>
                            <div className="font-medium text-gray-900">{app.jobTitle}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{app.company}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-sm truncate max-w-0">
                        {app.location || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-sm">
                        {formatDate(app.dateApplied)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {app.jobLink && (
                            <a
                              href={app.jobLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 flex items-center justify-center rounded-lg
                                text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Open job posting"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => onEdit(app)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg
                              text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDelete(app)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg
                              text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {expandedRow === app.id && (
                      <tr key={`${app.id}-expanded`} className="bg-blue-50/20">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm ml-11">
                            {app.salary && <Detail label="Salary" value={app.salary} />}
                            {app.recruiterContact && <Detail label="Recruiter" value={app.recruiterContact} />}
                            {app.notes && (
                              <Detail label="Notes" value={app.notes} className="col-span-2" multiline />
                            )}
                            {app.jobDescription && (
                              <Detail
                                label="Job Description"
                                value={app.jobDescription}
                                className="col-span-2"
                                multiline
                              />
                            )}
                            <p className="col-span-2 text-xs text-gray-400">
                              Updated {formatDateTime(app.updatedAt)}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-50">
            {applications.map((app) => (
              <div key={app.id} className="p-4">
                <div className="flex items-start gap-3">
                  <CompanyAvatar name={app.company} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm truncate">{app.jobTitle}</p>
                        <p className="text-xs text-gray-500">{app.company}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => onEdit(app)} className="text-gray-400 hover:text-blue-600 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => onDelete(app)} className="text-gray-400 hover:text-red-600 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={app.status} size="sm" />
                      {app.location && (
                        <span className="text-xs text-gray-400">{app.location}</span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(app.dateApplied)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="btn-secondary text-xs px-3 py-1.5 gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="btn-secondary text-xs px-3 py-1.5 gap-1"
              >
                Next
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Detail({
  label,
  value,
  className = "",
  multiline = false,
}: {
  label: string;
  value: string;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <div className={className}>
      <span className="font-medium text-gray-700">{label}:</span>{" "}
      {multiline ? (
        <p className="mt-1 text-gray-500 whitespace-pre-wrap text-xs leading-relaxed">{value}</p>
      ) : (
        <span className="text-gray-500">{value}</span>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-xl shrink-0" />
          <div className="h-9 bg-gray-200 rounded-xl flex-1" />
          <div className="h-9 bg-gray-200 rounded-xl w-24" />
          <div className="h-9 bg-gray-200 rounded-xl w-24" />
          <div className="h-9 bg-gray-200 rounded-xl w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onAddNew,
}: {
  hasFilters: boolean;
  onAddNew: () => void;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-base font-medium text-gray-900 mb-1">No applications match</h3>
          <p className="text-sm text-gray-400">Try adjusting your search or filter.</p>
        </>
      ) : (
        <>
          <h3 className="text-base font-medium text-gray-900 mb-1">No applications yet</h3>
          <p className="text-sm text-gray-400 mb-5">Start tracking your job search today.</p>
          <button onClick={onAddNew} className="btn-primary">
            Add your first application
          </button>
        </>
      )}
    </div>
  );
}
