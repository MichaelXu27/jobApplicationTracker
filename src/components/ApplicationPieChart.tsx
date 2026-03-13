"use client";

import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { Application } from "@/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  applications: Application[];
}

export default function ApplicationPieChart({ applications }: Props) {
  const counts = useMemo(() => {
    const c = { APPLIED: 0, INTERVIEWING: 0, DENIED: 0 };
    for (const a of applications) {
      if (a.status in c) c[a.status as keyof typeof c]++;
    }
    return c;
  }, [applications]);

  const total = applications.length;

  const data = {
    labels: ["Applied", "Interviewing", "Denied"],
    datasets: [
      {
        data: [counts.APPLIED, counts.INTERVIEWING, counts.DENIED],
        backgroundColor: ["#3b82f6", "#f59e0b", "#94a3b8"],
        borderColor: ["#fff", "#fff", "#fff"],
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 16,
          font: { size: 12 },
          color: "#6b7280",
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) => {
            const val = ctx.raw as number;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${ctx.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Status Breakdown</h3>
      {total === 0 ? (
        <div className="flex items-center justify-center h-40 text-sm text-gray-400">
          No applications yet
        </div>
      ) : (
        <div style={{ height: 220 }}>
          <Pie data={data} options={options} />
        </div>
      )}
    </div>
  );
}
