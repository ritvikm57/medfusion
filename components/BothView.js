"use client";

// Combined disease+region dashboard composition.
// Why: merges pathogen-specific enrichment with region-specific surveillance context.

import AlertFeed from "./AlertFeed";
import GeneNetwork from "./GeneNetwork";
import OutbreakMap from "./OutbreakMap";
import TrendChart from "./TrendChart";
import OutbreakTimeline from "./OutbreakTimeline";
import FluChart from "./FluChart";
import RecentResearch from "./RecentResearch";
import SourceFooter from "./SourceFooter";

function keywordIncludes(text, keyword) {
  if (!keyword) return true;
  return String(text || "").toLowerCase().includes(String(keyword).toLowerCase());
}

function filterAlertsForBothMode(items = [], disease, region) {
  return items.filter((item) => {
    const haystack = [item?.title, item?.description, item?.topic, item?.geography, item?.age]
      .filter(Boolean)
      .join(" ");

    return keywordIncludes(haystack, disease) && keywordIncludes(haystack, region);
  });
}

export default function BothView({ query, results, loading = false }) {
  const ontologyHit = results?.classify?.ontology?.[0] || null;
  const meshIds = results?.classify?.mesh?.ids || [];
  const genes = results?.genes?.data || [];
  const drugs = results?.drugs?.data || [];
  const whoRows = (results?.who?.data || [])
    .filter((row) => row?.Dim1 === "SEX_BTSX")
    .sort((a, b) => Number(a?.TimeDim || 0) - Number(b?.TimeDim || 0));
  const allAlerts = [...(results?.alerts?.data || []), ...(results?.flu?.data || [])];
  const alerts = filterAlertsForBothMode(allAlerts, query?.disease, query?.region).slice(0, 20);
  const mapRows = [...(results?.ecdc?.data || []), ...(results?.healthmap?.data || [])];

  const indiaCovidCases = results?.india?.covidCurrent?.cases;
  const forcedIndiaMarker =
    query?.region?.toLowerCase() === "india"
      ? {
          lat: 20,
          lng: 77,
          label: `${query?.disease}: ${indiaCovidCases ?? "N/A"} COVID-19 cases`,
        }
      : null;

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-cyan-100">
        {query?.disease} surveillance - {query?.region}
      </h2>

      <OutbreakTimeline title="Outbreak Alerts" items={alerts} loading={loading} />

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
                      {Number.isFinite(Number(row?.NumericValue)) ? Number(row.NumericValue).toFixed(1) : row?.Value || "N/A"}
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

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="mb-3 text-lg font-semibold text-cyan-200">Classification</h3>
        {ontologyHit ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-950/70 p-3">
              <p className="text-sm font-semibold text-slate-100">{ontologyHit?.name || "Unknown disease"}</p>
              <p className="mt-1 text-xs text-slate-300">{ontologyHit?.description || "No description available."}</p>
            </div>
            {meshIds.length ? (
              <div className="flex flex-wrap gap-2">
                {meshIds.map((id) => (
                  <span key={id} className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {id}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-slate-300">Data unavailable.</p>
        )}
      </div>

      <OutbreakMap data={mapRows} loading={loading} forcedMarker={forcedIndiaMarker} />

      <TrendChart
        title="Regional Trend"
        data={whoRows}
        loading={loading}
        xKey="TimeDim"
        yKey="NumericValue"
        lineName="Life Expectancy"
        ascending
      />

      <FluChart data={results?.flu?.data} loading={loading} />

      <AlertFeed title="Alerts" items={alerts} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="mb-3 text-lg font-semibold text-cyan-200">Genes</h3>
          {genes.length ? (
            <div className="max-h-72 overflow-auto text-sm">
              <table className="w-full text-left text-slate-200">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-2">Symbol</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {genes.slice(0, 20).map((gene, index) => (
                    <tr key={`${gene?.geneId || gene?.symbol || "gene"}-${index}`} className="border-t border-slate-800">
                      <td className="py-2">{gene?.symbol || "N/A"}</td>
                      <td className="py-2">{gene?.name || "N/A"}</td>
                      <td className="py-2">{Number(gene?.score || 0).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-300">Data unavailable.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="mb-3 text-lg font-semibold text-cyan-200">Drugs</h3>
          {drugs.length ? (
            <div className="max-h-72 overflow-auto text-sm">
              <table className="w-full text-left text-slate-200">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-2">Drug</th>
                    <th className="py-2">CID</th>
                    <th className="py-2">Formula</th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map((drug, index) => (
                    <tr key={`${drug?.drug || "drug"}-${index}`} className="border-t border-slate-800">
                      <td className="py-2">{drug?.drug || "N/A"}</td>
                      <td className="py-2">{drug?.cid || "N/A"}</td>
                      <td className="py-2">{drug?.molecularFormula || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-300">Data unavailable.</p>
          )}
        </div>
      </div>

      <RecentResearch papers={results?.pubmed?.data} loading={loading} />

      <GeneNetwork disease={query?.disease} genes={genes} drugs={drugs} loading={loading} />

      <SourceFooter results={results} />
    </section>
  );
}
