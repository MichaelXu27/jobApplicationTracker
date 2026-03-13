import type { ApplicationStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

const statusStyles: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  INTERVIEWING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  DENIED: "bg-red-50 text-red-600 ring-1 ring-red-200",
};

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${statusStyles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
