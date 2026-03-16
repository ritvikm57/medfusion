"use client";

// Disease detail page.
// Why: deep link route for disease-specific surveillance context outside the homepage flow.

import { useEffect, useState } from "react";
import DiseaseView from "@/components/DiseaseView";

export default function DiseaseDetailPage({ params }) {
  const disease = decodeURIComponent(params?.name || "");
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/search?disease=${encodeURIComponent(disease)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load disease view");
        }
        setResponse(json);
      } catch (loadError) {
        setError(loadError?.message || "Failed to load disease view");
      } finally {
        setLoading(false);
      }
    }

    if (disease) load();
  }, [disease]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0b2236,_#030712_60%)] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-3xl font-black text-cyan-100">Disease Detail: {disease}</h1>
        {error ? <p className="rounded-xl border border-rose-500/30 bg-rose-900/20 p-3 text-rose-200">{error}</p> : null}
        <DiseaseView query={{ disease }} results={response?.results || {}} loading={loading} />
      </div>
    </main>
  );
}
