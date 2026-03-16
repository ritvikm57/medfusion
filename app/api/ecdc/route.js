// ECDC adapter route.
// Why: ECDC case distribution feeds are useful for cross-country epidemiological trend context.

import { NextResponse } from "next/server";
import { buildError, keywordMatch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region")?.trim();

  try {
    // ECDC file is large — use 20s timeout instead of default 8s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      response = await fetch(
        "https://opendata.ecdc.europa.eu/covid19/casedistribution/json/",
        { signal: controller.signal, cache: "no-store" }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`ecdc request failed with status ${response.status}`);
    }

    const data = await response.json();
    const records = data?.records || [];

    const filtered = region
      ? records.filter((row) => keywordMatch(row?.countriesAndTerritories, [region]))
      : records;

    return NextResponse.json({
      source: "ecdc",
      region: region || null,
      data: filtered.slice(0, 500),
    });
  } catch (error) {
    return NextResponse.json(buildError("ecdc", error), { status: 500 });
  }
}