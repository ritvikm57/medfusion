// Master MedFusion aggregator route.
// Why: central endpoint composes all public data sources with Promise.allSettled so one failure never breaks the dashboard.

import { NextResponse } from "next/server";
import { canonicalizeDisease, getCached, setCached } from "../utils";

function modeFromQuery(disease, region) {
  if (disease && region) return "both";
  if (disease) return "disease";
  if (region) return "region";
  return "invalid";
}

async function fetchRoute(origin, path, params) {
  const url = new URL(path, origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    const payload = await response.json().catch(() => null);

    // Preserve source-level error details instead of collapsing to null.
    if (!response.ok) {
      return (
        payload || {
          source: path,
          error: `${path} failed with status ${response.status}`,
        }
      );
    }

    return payload;
  } catch (error) {
    return {
      source: path,
      error: error?.message || "Request failed",
    };
  }
}

function settleToNullable(settled) {
  if (settled.status === "fulfilled") return settled.value;
  return {
    source: "search-aggregator",
    error: settled?.reason?.message || "Unknown aggregation failure",
  };
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const diseaseRaw = searchParams.get("disease")?.trim() || null;
  const disease = diseaseRaw ? canonicalizeDisease(diseaseRaw) : null;
  const region = searchParams.get("region")?.trim() || null;
  const mode = modeFromQuery(disease, region);

  const cacheKey = `${disease || ""}-${region || ""}`
  const cached = getCached(cacheKey)
  if (cached) return NextResponse.json({ ...cached, _cached: true })

  if (mode === "invalid") {
    return NextResponse.json(
      {
        mode,
        query: { disease, region },
        timestamp: new Date().toISOString(),
        error: "Provide at least one query parameter: disease or region.",
        results: {},
      },
      { status: 400 }
    );
  }

  const commonParams = { disease, region };

  const fetchPlan = [
    ["disease", "/api/disease"],
    ["who", "/api/who"],
    ["alerts", "/api/alerts"],
    ["flu", "/api/flu"],
    ["cdc", "/api/cdc"],
    ["ecdc", "/api/ecdc"],
    ["healthmap", "/api/healthmap"],
    ["uk", "/api/uk"],
    ["classify", "/api/classify"],
    ["genes", "/api/genes"],
    ["drugs", "/api/drugs"],
    ["pubmed", "/api/pubmed"],
  ];

  if (region?.toLowerCase() === "india") {
    fetchPlan.push(["india", "/api/india"]);
  }

  const settled = await Promise.allSettled(
    fetchPlan.map(([_, path]) => fetchRoute(origin, path, commonParams))
  );

  const results = fetchPlan.reduce((acc, [key], index) => {
    acc[key] = settleToNullable(settled[index]);
    return acc;
  }, {});

  // Derived region summary list for region/both mode from tabular CDC rows.
  if (mode !== "disease") {
    const cdcRows = results?.cdc?.data || [];
    const diseaseCandidates = new Map();
    cdcRows.forEach((row) => {
      const label = row?.condition || row?.topic || row?.indicator || row?.measure || null;
      if (label) diseaseCandidates.set(String(label), true);
    });
    results.activeDiseases = Array.from(diseaseCandidates.keys()).slice(0, 20);
  }

  const responseData = {
    mode,
    query: { disease: diseaseRaw, diseaseCanonical: disease, region },
    timestamp: new Date().toISOString(),
    results,
  }
  setCached(cacheKey, responseData)
  return NextResponse.json(responseData);
}
