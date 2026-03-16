"use client";

// Disease-mode dashboard composition.
// Why: shows global disease context, biomedical enrichment, and alert intelligence in one panel.

import AlertFeed from "./AlertFeed";
import GeneNetwork from "./GeneNetwork";
import OutbreakMap from "./OutbreakMap";
import TrendChart from "./TrendChart";
import OutbreakTimeline from "./OutbreakTimeline";
import FluChart from "./FluChart";
import RecentResearch from "./RecentResearch";
import SourceFooter from "./SourceFooter";

const COVID_ALIASES = new Set(["covid", "covid-19", "coronavirus", "sars-cov-2"]);

function isCovidQuery(value) {
  return COVID_ALIASES.has(String(value || "").trim().toLowerCase());
}

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
  const ontologyHit = results?.classify?.ontology?.[0] || null;
  const meshIds = results?.classify?.mesh?.ids || [];
  const genes = results?.genes?.data || [];
  const drugs = results?.drugs?.data || [];
  const alerts = [...(results?.alerts?.data || []), ...(results?.flu?.data || [])].slice(0, 20);
  const mapRows = [...(results?.ecdc?.data || []), ...(results?.healthmap?.data || [])];

  const indiaCovid = results?.india?.covidCurrent || null;
  const covidSearch = isCovidQuery(query?.diseaseCanonical || query?.disease);
  const indiaDiseaseFallback = !diseaseStats && query?.region?.toLowerCase() === "india" && covidSearch ? indiaCovid : null;
  const showDiseaseShCoverageNotice = !diseaseStats && !indiaDiseaseFallback && !loading;

  const casesLabel = indiaDiseaseFallback ? "COVID-19 Cases (India)" : "Cases";
  const deathsLabel = indiaDiseaseFallback ? "COVID-19 Deaths (India)" : "Deaths";
  const activeLabel = indiaDiseaseFallback ? "COVID-19 Active (India)" : "Active";

  const mapMarker =
    query?.disease && query?.region?.toLowerCase() === "india"
      ? {
          lat: 20,
          lng: 77,
          label: `${query?.disease}: ${indiaCovid?.cases ?? "N/A"} COVID-19 cases`,
        }
      : null;

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-cyan-100">Disease Mode: {query?.disease}</h2>

      <OutbreakTimeline title="Outbreak Alerts" items={alerts} loading={loading} />

      <div className="grid gap-4 md:grid-cols-3">
        <ValueCard
          label={casesLabel}
          value={
            diseaseStats?.cases || diseaseStats?.todayCases || indiaDiseaseFallback?.cases || "N/A"
          }
        />
        <ValueCard
          label={deathsLabel}
          value={
            diseaseStats?.deaths || diseaseStats?.todayDeaths || indiaDiseaseFallback?.deaths || "N/A"
          }
        />
        <ValueCard label={activeLabel} value={diseaseStats?.active || indiaDiseaseFallback?.active || "N/A"} />
      </div>

      {showDiseaseShCoverageNotice ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-900/20 p-3 text-sm text-amber-200">
          Global surveillance data not available for {query?.disease || "this disease"} via Disease.sh (COVID-19 only source).
        </p>
      ) : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="mb-3 text-lg font-semibold text-cyan-200">ICD-10 Classification</h3>
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
          <DataUnavailable />
        )}
      </div>

      <OutbreakMap data={mapRows} loading={loading} forcedMarker={mapMarker} />
      <TrendChart title="Disease Trend" data={results?.ecdc?.data || []} loading={loading} />
      <AlertFeed title="Global Alerts" items={alerts} loading={loading} />
      <FluChart data={results?.flu?.data} loading={loading} />

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

      <RecentResearch papers={results?.pubmed?.data} loading={loading} />

      <GeneNetwork disease={query?.disease} genes={genes} drugs={drugs} loading={loading} />

      <SourceFooter results={results} />
    </section>
  );
}
