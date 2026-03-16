"use client";

// Region-mode dashboard composition.
// Why: focuses on location-specific burden, indicators, and active disease signals.

import AlertFeed from "./AlertFeed";
import OutbreakMap from "./OutbreakMap";
import TrendChart from "./TrendChart";

export default function RegionView({ query, results, loading = false }) {
  const whoRows = (results?.who?.data || [])
    .filter((row) => row?.Dim1 === "SEX_BTSX")
    .sort((a, b) => Number(a?.TimeDim || 0) - Number(b?.TimeDim || 0));
  const activeDiseases = results?.activeDiseases || [];
  const mapRows = [...(results?.ecdc?.data || []), ...(results?.healthmap?.data || [])];
  const alerts = [...(results?.alerts?.data || []), ...(results?.flu?.data || [])].slice(0, 20);

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-cyan-100">Region Mode: {query?.region}</h2>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="mb-3 text-lg font-semibold text-cyan-200">Active Diseases</h3>
        {activeDiseases.length ? (
          <div className="flex flex-wrap gap-2">
            {activeDiseases.map((name) => (
              <span key={name} className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm text-cyan-200">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-300">Data unavailable.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="mb-3 text-lg font-semibold text-cyan-200">WHO Indicators</h3>
        {whoRows.length ? (
          <div className="max-h-72 overflow-auto text-sm">
            <table className="w-full text-left text-slate-200">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Life Expectancy (years)</th>
                  <th className="py-2">Year</th>
                  <th className="py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {whoRows.slice(0, 40).map((row, index) => (
                  <tr key={`${row?.Id || "who"}-${index}`} className="border-t border-slate-800">
                    <td className="py-2">Life Expectancy</td>
                    <td className="py-2">{row?.TimeDim || "N/A"}</td>
                    <td className="py-2">
                      {Number.isFinite(Number(row?.NumericValue))
                        ? Number(row.NumericValue).toFixed(1)
                        : row?.Value || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-300">Data unavailable.</p>
        )}
      </div>

      <OutbreakMap data={mapRows} loading={loading} />
      <TrendChart
        title="Regional Trend"
        data={whoRows}
        loading={loading}
        xKey="TimeDim"
        yKey="NumericValue"
        lineName="Life Expectancy"
        ascending
      />
      <AlertFeed title="Regional Alerts" items={alerts} loading={loading} />
    </section>
  );
}
