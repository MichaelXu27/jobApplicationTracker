// Shared TypeScript types used across frontend and backend

export type ApplicationStatus = "APPLIED" | "INTERVIEWING" | "DENIED";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "INTERVIEWING",
  "DENIED",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  DENIED: "Denied",
};

/** Shape returned from the API */
export interface Application {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  location: string | null;
  dateApplied: string; // ISO string from JSON serialization
  status: ApplicationStatus;
  notes: string | null;
  jobDescription: string | null;
  jobLink: string | null;
  salary: string | null;
  recruiterContact: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for create / update API calls */
export interface ApplicationPayload {
  jobTitle: string;
  company: string;
  location?: string;
  dateApplied: string; // "YYYY-MM-DD"
  status: ApplicationStatus;
  notes?: string;
  jobDescription?: string;
  jobLink?: string;
  salary?: string;
  recruiterContact?: string;
}

/** Paginated response from GET /api/applications */
export interface PaginatedApplications {
  data: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Query params for GET /api/applications */
export interface ApplicationFilters {
  status?: ApplicationStatus | "";
  search?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
