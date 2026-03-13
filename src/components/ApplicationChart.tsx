"use client";

import { useMemo, useState } from "react";
import type { Application } from "@/types";

interface Props {
  applications: Application[];
  period: "week" | "month";
  onPeriodChange: (p: "week" | "month") => void;
}

// Returns "YYYY-MM-DD" in local time (avoids UTC-offset bugs)
function toLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function appLocalDate(iso: string): string {
  return toLocalDate(new Date(iso));
}

interface DataPoint {
  label: string;
  count: number;
  isToday: boolean;
  key: string;
}

function getWeekData(applications: Application[]): DataPoint[] {
  const today = new Date();
  const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = toLocalDate(d);
    const count = applications.filter((a) => appLocalDate(a.dateApplied) === dateStr).length;
    return { label: DAY_LETTERS[d.getDay()], count, isToday: i === 6, key: dateStr };
  });
}

function getMonthData(applications: Application[]): DataPoint[] {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    const count = applications.filter((a) => {
      const d = new Date(a.dateApplied);
      return d >= weekStart && d <= weekEnd;
    }).length;
    return {
      label: i === 0 ? "Now" : `W-${i}`,
      count,
      isToday: i === 0,
      key: toLocalDate(weekStart),
    };
  }).reverse();
}

// ---------------------------------------------------------------------------
// SVG constants
// ---------------------------------------------------------------------------
const W = 440;
const H = 170;
const BOTTOM = 128;
const TOP = 22;
const CHART_H = BOTTOM - TOP;
const PAD_X = 40;

export default function ApplicationChart({ applications, period, onPeriodChange }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const data = useMemo(
    () => (period === "week" ? getWeekData(applications) : getMonthData(applications)),
    [applications, period]
  );

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Week-over-week % change
  const thisWeek = applications.filter((a) => {
    const d = new Date(a.dateApplied);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return d >= cutoff;
  }).length;

  const lastWeek = applications.filter((a) => {
    const d = new Date(a.dateApplied);
    const end = new Date();
    end.setDate(end.getDate() - 7);
    const start = new Date();
    start.setDate(start.getDate() - 14);
    return d >= start && d < end;
  }).length;

  const pctChange =
    lastWeek === 0
      ? thisWeek > 0
        ? 100
        : 0
      : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

  const n = data.length;
  const xs = data.map((_, i) => PAD_X + i * ((W - PAD_X * 2) / (n - 1)));

  // Today's index
  const todayIdx = data.findLastIndex((d) => d.isToday);

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Application Tracker</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1 ml-8">
            Track changes in activity over time
          </p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => { onPeriodChange(p); setSelectedIdx(null); }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all capitalize
                ${period === p
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {p === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Lollipop Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 170 }}
        aria-label="Application activity chart"
      >
        {/* Baseline — rendered first so dots paint on top of it */}
        <line x1={PAD_X} y1={BOTTOM} x2={W - PAD_X} y2={BOTTOM} stroke="#f1f5f9" strokeWidth={1} />

        {data.map((day, i) => {
          const x = xs[i];
          const dotY =
            day.count === 0
              ? BOTTOM
              : BOTTOM - (day.count / maxCount) * CHART_H;
          const isActive = selectedIdx === i || (selectedIdx === null && day.isToday);
          const isToday = day.isToday;

          const stemColor = isActive ? (isToday ? "#1e293b" : "#3b82f6") : "#e2e8f0";
          const dotFill = isActive
            ? isToday
              ? "#1e293b"
              : "#3b82f6"
            : day.count > 0
            ? "#bfdbfe"
            : "#f1f5f9";
          const labelColor = isActive ? (isToday ? "#1e293b" : "#3b82f6") : "#9ca3af";
          const dotR = isActive ? 11 : 8;

          // Tooltip bubble
          const showBubble = isActive && day.count > 0;
          const bubbleW = 34;
          const bubbleH = 22;

          return (
            <g
              key={day.key}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedIdx(isActive ? null : i)}
            >
              {/* Stem — ends at the bottom edge of the dot so the line doesn't show through */}
              <line
                x1={x}
                y1={BOTTOM}
                x2={x}
                y2={dotY + dotR}
                stroke={stemColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                style={{ transition: "stroke 0.2s" }}
              />
              {/* Dot */}
              <circle
                cx={x}
                cy={dotY}
                r={dotR}
                fill={dotFill}
                style={{ transition: "r 0.15s, fill 0.2s" }}
              />

              {/* Tooltip bubble */}
              {showBubble && (
                <g>
                  <rect
                    x={x - bubbleW / 2}
                    y={dotY - bubbleH - 8}
                    width={bubbleW}
                    height={bubbleH}
                    rx={7}
                    fill="#1e293b"
                  />
                  {/* Triangle pointer */}
                  <polygon
                    points={`${x - 5},${dotY - 9} ${x + 5},${dotY - 9} ${x},${dotY - 4}`}
                    fill="#1e293b"
                  />
                  <text
                    x={x}
                    y={dotY - bubbleH / 2 - 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={11}
                    fontWeight="600"
                  >
                    {day.count}
                  </text>
                </g>
              )}

              {/* Day label */}
              <text
                x={x}
                y={H - 6}
                textAnchor="middle"
                fill={labelColor}
                fontSize={12}
                fontWeight={isActive ? "700" : "400"}
                style={{ transition: "fill 0.2s" }}
              >
                {day.label}
              </text>
            </g>
          );
        })}

      </svg>

      {/* Stat row */}
      <div className="flex items-center gap-3 mt-1">
        <span
          className={`text-3xl font-bold ${
            pctChange >= 0 ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {pctChange >= 0 ? "+" : ""}
          {pctChange}%
        </span>
        <div>
          <p className="text-sm font-medium text-gray-800">
            {thisWeek} application{thisWeek !== 1 ? "s" : ""} this week
          </p>
          <p className="text-xs text-gray-400">
            {pctChange >= 0 ? "higher" : "lower"} than last week&apos;s {lastWeek}
          </p>
        </div>
      </div>
    </div>
  );
}
