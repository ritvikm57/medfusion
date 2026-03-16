// CDC Open Data adapter route.
// Why: CDC open datasets provide tabular surveillance records via Socrata endpoint.

import { NextResponse } from "next/server";
import { buildError, canonicalizeDisease, combinedKeywordMatch, safeJsonFetch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = canonicalizeDisease(searchParams.get("disease")?.trim());
  const region = searchParams.get("region")?.trim();

  try {
    const rows = await safeJsonFetch(
      "https://data.cdc.gov/resource/x9gk-5huc.json",
      "cdc-open-data"
    );

    const filtered = (rows || []).filter((row) => combinedKeywordMatch(JSON.stringify(row), disease, region));

    return NextResponse.json({
      source: "cdc-open-data",
      disease: disease || null,
      region: region || null,
      data: filtered,
    });
  } catch (error) {
    return NextResponse.json(buildError("cdc-open-data", error), { status: 500 });
  }
}
