// CDC Open Data adapter route.
// Why: CDC open datasets provide tabular surveillance records via Socrata endpoint.

import { NextResponse } from "next/server";
import { canonicalizeDisease, combinedKeywordMatch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = canonicalizeDisease(searchParams.get("disease")?.trim());
  const region = searchParams.get("region")?.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let rows = [];
  try {
    const res = await fetch(
      "https://data.cdc.gov/resource/x9gk-5huc.json",
      { signal: controller.signal, cache: "no-store" }
    );
    if (res.ok) rows = await res.json();
  } catch {
    rows = [];
  } finally {
    clearTimeout(timer);
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({
      source: "cdc-open-data",
      disease: disease || null,
      region: region || null,
      data: [],
      note: "CDC temporarily unavailable",
    });
  }

  const filtered = rows.filter((row) => combinedKeywordMatch(JSON.stringify(row), disease, region));

  return NextResponse.json({
    source: "cdc-open-data",
    disease: disease || null,
    region: region || null,
    data: filtered,
  });
}
