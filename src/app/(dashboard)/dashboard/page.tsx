"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

import type { Application, ApplicationStatus } from "@/types";
import type { ApplicationInput } from "@/lib/validations";

import ApplicationChart from "@/components/ApplicationChart";
import RecentApplicationsPanel from "@/components/RecentApplicationsPanel";
import InterviewPipelineCard from "@/components/InterviewPipelineCard";
import ApplicationProgressCard from "@/components/ApplicationProgressCard";
import ApplicationPieChart from "@/components/ApplicationPieChart";
import ApplicationTable from "@/components/ApplicationTable";
import ApplicationForm from "@/components/ApplicationForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const PAGE_SIZE = 15;

export default function DashboardPage() {
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [allLoading, setAllLoading] = useState(true);

  // Table filter / sort / page state — all computed client-side
  const [tablePage, setTablePage] = useState(1);
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
  // Data fetching — single fetch for everything
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refresh when navbar bulk-import or nuclear delete fires
  useEffect(() => {
    const handler = () => { fetchAll(); setTablePage(1); };
    window.addEventListener("applications-imported", handler);
    window.addEventListener("applications-cleared", handler);
    return () => {
      window.removeEventListener("applications-imported", handler);
      window.removeEventListener("applications-cleared", handler);
    };
  }, [fetchAll]);

  // -----------------------------------------------------------------------
  // Client-side filter / sort / paginate
  // -----------------------------------------------------------------------

  const { tableApplications, totalPages } = useMemo(() => {
    const q = searchQuery.toLowerCase();

    let filtered = allApplications.filter((a) => {
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesSearch =
        !q ||
        a.jobTitle.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        (a.location ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });

    filtered = [...filtered].sort((a, b) => {
      const diff = new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

    const total = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(tablePage, total);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return { tableApplications: paged, totalPages: total };
  }, [allApplications, statusFilter, searchQuery, sortOrder, tablePage]);

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const handleSave = async (data: ApplicationInput) => {
    setIsSaving(true);
    try {
      const url = editingApp ? `/api/applications/${editingApp.id}` : "/api/applications";
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
      await fetchAll();
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
      const res = await fetch(`/api/applications/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Application deleted");
      setDeleteTarget(null);
      await fetchAll();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
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

          <ApplicationPieChart applications={allApplications} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InterviewPipelineCard
              applications={allApplications}
              onEdit={(app) => { setEditingApp(app); setFormOpen(true); }}
            />
            <ApplicationProgressCard applications={allApplications} />
          </div>
        </div>

        {/* Right column — recent applications panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <RecentApplicationsPanel
            applications={allApplications}
            onEdit={(app) => { setEditingApp(app); setFormOpen(true); }}
            onDelete={setDeleteTarget}
            onAdd={() => { setEditingApp(null); setFormOpen(true); }}
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
          isLoading={allLoading}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          sortOrder={sortOrder}
          page={tablePage}
          totalPages={totalPages}
          onStatusFilterChange={handleStatusFilterChange}
          onSearchChange={handleSearchChange}
          onSortToggle={handleSortToggle}
          onPageChange={setTablePage}
          onEdit={(app) => { setEditingApp(app); setFormOpen(true); }}
          onDelete={setDeleteTarget}
          onAddNew={() => { setEditingApp(null); setFormOpen(true); }}
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
