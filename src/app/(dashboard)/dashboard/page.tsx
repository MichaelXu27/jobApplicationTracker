"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import type { Application, ApplicationStatus } from "@/types";
import type { ApplicationInput } from "@/lib/validations";

import ApplicationChart from "@/components/ApplicationChart";
import RecentApplicationsPanel from "@/components/RecentApplicationsPanel";
import InterviewPipelineCard from "@/components/InterviewPipelineCard";
import ApplicationProgressCard from "@/components/ApplicationProgressCard";
import ApplicationTable from "@/components/ApplicationTable";
import ApplicationForm from "@/components/ApplicationForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

export default function DashboardPage() {
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  // Full unfiltered list for the top cards / chart
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [allLoading, setAllLoading] = useState(true);

  // Filtered / paginated list for the bottom table
  const [tableApplications, setTableApplications] = useState<Application[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Table filter state
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Chart period
  const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    setAllLoading(true);
    try {
      const res = await fetch("/api/applications?limit=10000&sortOrder=desc");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAllApplications(data.data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setAllLoading(false);
    }
  }, []);

  const fetchTable = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("sortOrder", sortOrder);
      params.set("page", String(tablePage));
      params.set("limit", "15");

      const res = await fetch(`/api/applications?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTableApplications(data.data);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setTableLoading(false);
    }
  }, [statusFilter, searchQuery, sortOrder, tablePage]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchTable(); }, [fetchTable]);

  // Refresh both lists when the navbar bulk-import or nuclear delete fires
  useEffect(() => {
    const handler = () => { fetchAll(); setTablePage(1); fetchTable(); };
    window.addEventListener("applications-imported", handler);
    window.addEventListener("applications-cleared", handler);
    return () => {
      window.removeEventListener("applications-imported", handler);
      window.removeEventListener("applications-cleared", handler);
    };
  }, [fetchAll, fetchTable]);

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const handleSave = async (data: ApplicationInput) => {
    setIsSaving(true);
    try {
      const url = editingApp
        ? `/api/applications/${editingApp.id}`
        : "/api/applications";
      const method = editingApp ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      toast.success(editingApp ? "Application updated!" : "Application added!");
      setFormOpen(false);
      setEditingApp(null);
      await Promise.all([fetchAll(), fetchTable()]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/applications/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Application deleted");
      setDeleteTarget(null);
      await Promise.all([fetchAll(), fetchTable()]);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingApp(null);
    setFormOpen(true);
  };

  const handleStatusFilterChange = (s: ApplicationStatus | "") => {
    setStatusFilter(s);
    setTablePage(1);
  };

  const handleSearchChange = (s: string) => {
    setSearchQuery(s);
    setTablePage(1);
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setTablePage(1);
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Top dashboard grid                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left column — chart + two small cards */}
        <div className="lg:col-span-7 space-y-6">
          <ApplicationChart
            applications={allApplications}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InterviewPipelineCard
              applications={allApplications}
              onEdit={handleEdit}
            />
            <ApplicationProgressCard applications={allApplications} />
          </div>
        </div>

        {/* Right column — recent applications panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <RecentApplicationsPanel
            applications={allApplications}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            onAdd={handleAddNew}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Full applications table                                              */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">All Applications</h2>
          <span className="text-sm text-gray-400">
            {allApplications.length} total
          </span>
        </div>
        <ApplicationTable
          applications={tableApplications}
          isLoading={tableLoading}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          sortOrder={sortOrder}
          page={tablePage}
          totalPages={totalPages}
          onStatusFilterChange={handleStatusFilterChange}
          onSearchChange={handleSearchChange}
          onSortToggle={handleSortToggle}
          onPageChange={setTablePage}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onAddNew={handleAddNew}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Modals                                                               */}
      {/* ------------------------------------------------------------------ */}
      <ApplicationForm
        isOpen={formOpen}
        editingApplication={editingApp}
        isSaving={isSaving}
        onSubmit={handleSave}
        onClose={() => { setFormOpen(false); setEditingApp(null); }}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        jobTitle={deleteTarget?.jobTitle ?? ""}
        company={deleteTarget?.company ?? ""}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
