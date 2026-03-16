"use client";

// Disease-mode dashboard composition.
// Why: shows global disease context, biomedical enrichment, and alert intelligence in one panel.

import AlertFeed from "./AlertFeed";
import GeneNetwork from "./GeneNetwork";
import OutbreakMap from "./OutbreakMap";
import TrendChart from "./TrendChart";

function ValueCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value ?? "N/A"}</p>
    </div>
  );
}

function DataUnavailable() {
  return <div className="rounded-xl border border-slate-800 p-4 text-slate-300">Data unavailable.</div>;
}

export default function DiseaseView({ query, results, loading = false }) {
  const diseaseStats = results?.disease?.data;
  const classification = results?.classify?.data || [];
  const genes = results?.genes?.data || [];
  const drugs = results?.drugs?.data || [];
  const alerts = [...(results?.alerts?.data || []), ...(results?.flu?.data || [])].slice(0, 20);
  const mapRows = [...(results?.ecdc?.data || []), ...(results?.healthmap?.data || [])];

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-cyan-100">Disease Mode: {query?.disease}</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <ValueCard label="Cases" value={diseaseStats?.cases || diseaseStats?.todayCases || "N/A"} />
        <ValueCard label="Deaths" value={diseaseStats?.deaths || diseaseStats?.todayDeaths || "N/A"} />
        <ValueCard label="Recovered" value={diseaseStats?.recovered || "N/A"} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="mb-3 text-lg font-semibold text-cyan-200">ICD-10 Classification</h3>
        {classification.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {classification.map((item, index) => (
              <div key={`${item?.code || "code"}-${index}`} className="rounded-xl bg-slate-950/70 p-3">
                <p className="text-sm font-semibold text-slate-100">{item?.term || "Unknown term"}</p>
                <p className="text-xs text-cyan-300">{item?.code || "No code"}</p>
              </div>
            ))}
          </div>
        ) : (
          <DataUnavailable />
        )}
      </div>

      <OutbreakMap data={mapRows} loading={loading} />
      <TrendChart title="Disease Trend" data={results?.ecdc?.data || []} loading={loading} />
      <AlertFeed title="Global Alerts" items={alerts} loading={loading} />

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
            <DataUnavailable />
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
            <DataUnavailable />
          )}
        </div>
      </div>

      <GeneNetwork disease={query?.disease} genes={genes} drugs={drugs} loading={loading} />
    </section>
  );
}
