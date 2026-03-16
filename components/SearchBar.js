"use client";

// Search bar for disease/region query modes.
// Why: one form supports disease-only, region-only, and disease+region searches.

import { useState } from "react";

export default function SearchBar({ onSearch, initialDisease = "", initialRegion = "", loading = false }) {
  const [disease, setDisease] = useState(initialDisease);
  const [region, setRegion] = useState(initialRegion);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!disease.trim() && !region.trim()) {
      setError("Enter at least one value: disease or region.");
      return;
    }

    setError("");
    onSearch({
      disease: disease.trim(),
      region: region.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-5 shadow-xl">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={disease}
          onChange={(event) => setDisease(event.target.value)}
          placeholder="Disease (e.g., dengue)"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-400/30 transition focus:ring"
        />
        <input
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          placeholder="Region (e.g., India)"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-400/30 transition focus:ring"
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-rose-300">{error}</p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
    </form>
  );
}
