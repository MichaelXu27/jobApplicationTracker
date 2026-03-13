import type { Application, ApplicationStatus } from "@/types";

interface DashboardStatsProps {
  applications: Application[];
}

const statConfig: {
  label: string;
  status: ApplicationStatus;
  bg: string;
  text: string;
  icon: React.ReactNode;
}[] = [
  {
    label: "Applied",
    status: "APPLIED",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Interviewing",
    status: "INTERVIEWING",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    label: "Denied",
    status: "DENIED",
    bg: "bg-red-50",
    text: "text-red-600",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function DashboardStats({ applications }: DashboardStatsProps) {
  const total = applications.length;
  const counts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Total */}
      <div className="card p-5 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
          </div>
          <div className="bg-gray-100 rounded-xl p-2.5 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      {statConfig.map(({ label, status, bg, text, icon }) => (
        <div key={status} className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${text}`}>{counts[status] ?? 0}</p>
            </div>
            <div className={`${bg} rounded-xl p-2.5 ${text}`}>{icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
