"use client";

// Main search page for MedFusion.
// Why: this is the single entrypoint that routes users into disease, region, or combined analysis mode.

import { useMemo, useState } from "react";
import BothView from "@/components/BothView";
import DiseaseView from "@/components/DiseaseView";
import RegionView from "@/components/RegionView";
import SearchBar from "@/components/SearchBar";

function detectMode(query) {
  if (query?.disease && query?.region) return "both";
  if (query?.disease) return "disease";
  if (query?.region) return "region";
  return "idle";
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const mode = useMemo(() => detectMode(response?.query || {}), [response]);

  async function handleSearch({ disease, region }) {
    const params = new URLSearchParams();
    if (disease) params.set("disease", disease);
    if (region) params.set("region", region);

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Search failed");
      }
      setResponse(json);
    } catch (fetchError) {
      setError(fetchError?.message || "Search failed");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  function handleExportJson() {
    if (!response) return;
    const fileName = `medfusion-${response.query.disease || response.query.region || "data"}-${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const queryChips = [
    { disease: "dengue", region: "India" },
    { disease: "covid-19", region: "France" },
    { disease: "influenza", region: "USA" },
    { disease: "malaria", region: "Africa" },
    { disease: "tuberculosis", region: "India" },
  ]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0b2236,_#030712_60%)] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">MedFusion</p>
          <h1 className="text-4xl font-black text-cyan-100 md:text-5xl">Disease Surveillance Dashboard</h1>
          <p className="max-w-3xl text-slate-300">
            Search by disease, region, or both to aggregate live intelligence from WHO, CDC, ECDC, ProMED,
            HealthMap, Open Targets, PubChem, and national datasets.
          </p>
        </header>

        <SearchBar loading={loading} onSearch={handleSearch} />
        {error ? <p className="rounded-xl border border-rose-500/30 bg-rose-900/20 p-3 text-rose-200">{error}</p> : null}

        {mode === "disease" ? <DiseaseView query={response.query} results={response.results} loading={loading} /> : null}
        {mode === "region" ? <RegionView query={response.query} results={response.results} loading={loading} /> : null}
        {mode === "both" ? <BothView query={response.query} results={response.results} loading={loading} /> : null}

        {mode === "idle" ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 md:p-12 text-center">
              <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                MedFusion
              </h2>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                Real-time disease surveillance intelligence from 12 global sources
              </p>

              {/* Stats Row */}
              <div className="flex justify-center gap-3 mb-8 flex-wrap">
                <div className="bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-full">12 Sources</div>
                <div className="bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-full">15 Diseases</div>
                <div className="bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-full">3 Query Modes</div>
                <div className="bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-full">Live Data</div>
              </div>

              {/* Query Chips */}
              <div className="flex justify-center flex-wrap gap-3">
                {queryChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(chip)}
                    className="border border-cyan-500 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-200 font-medium px-4 py-2 rounded-full transition-all"
                  >
                    {chip.disease} • {chip.region}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {mode !== "idle" ? (
          <div className="flex justify-end">
            <button
              onClick={handleExportJson}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Export JSON
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
