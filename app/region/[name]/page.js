"use client";

// Region detail page.
// Why: deep link route for region-centric surveillance without requiring homepage interaction.

import { useEffect, useState } from "react";
import RegionView from "@/components/RegionView";

export default function RegionDetailPage({ params }) {
  const region = decodeURIComponent(params?.name || "");
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/search?region=${encodeURIComponent(region)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load region view");
        }
        setResponse(json);
      } catch (loadError) {
        setError(loadError?.message || "Failed to load region view");
      } finally {
        setLoading(false);
      }
    }

    if (region) load();
  }, [region]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0b2236,_#030712_60%)] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-3xl font-black text-cyan-100">Region Detail: {region}</h1>
        {error ? <p className="rounded-xl border border-rose-500/30 bg-rose-900/20 p-3 text-rose-200">{error}</p> : null}
        <RegionView query={{ region }} results={response?.results || {}} loading={loading} />
      </div>
    </main>
  );
}
