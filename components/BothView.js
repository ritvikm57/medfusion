"use client";

// Combined disease+region dashboard composition.
// Why: merges pathogen-specific enrichment with region-specific surveillance context.

import DiseaseView from "./DiseaseView";
import RegionView from "./RegionView";

export default function BothView({ query, results, loading = false }) {
  const indiaRows = results?.india?.data || [];

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-cyan-100">
        Both Mode: {query?.disease} in {query?.region}
      </h2>

      <DiseaseView query={query} results={results} loading={loading} />
      <RegionView query={query} results={results} loading={loading} />

      {query?.region?.toLowerCase() === "india" ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="mb-3 text-lg font-semibold text-cyan-200">India-Specific IHME Rows</h3>
          {indiaRows.length ? (
            <div className="max-h-72 overflow-auto text-sm">
              <table className="w-full text-left text-slate-200">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    {Object.keys(indiaRows[0] || {})
                      .slice(0, 5)
                      .map((key) => (
                        <th key={key} className="py-2">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {indiaRows.slice(0, 30).map((row, index) => (
                    <tr key={index} className="border-t border-slate-800">
                      {Object.keys(indiaRows[0] || {})
                        .slice(0, 5)
                        .map((key) => (
                          <td key={`${index}-${key}`} className="py-2">
                            {String(row[key] ?? "")}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-300">Data unavailable.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
