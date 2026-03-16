"use client";

// Recharts trend chart.
// Why: shows time progression from whichever source exposes date-linked counts.

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function normalizeSeries(data = []) {
  return data
    .map((row, index) => ({
      date: row?.dateRep || row?.date || row?.pubDate || row?.Date || `Point ${index + 1}`,
      value:
        Number(row?.cases) ||
        Number(row?.deaths) ||
        Number(row?.value) ||
        Number(row?.newCasesBySpecimenDate) ||
        0,
    }))
    .slice(0, 40)
    .reverse();
}

export default function TrendChart({ title = "Trend", data = [], loading = false }) {
  if (loading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-slate-800/70" />;
  }

  const series = normalizeSeries(data);

  if (!series.length) {
    return <div className="rounded-2xl border border-slate-800 p-4 text-slate-300">Trend data unavailable.</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-lg font-semibold text-cyan-200">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
