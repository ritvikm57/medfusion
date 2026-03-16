// CDC FluView adapter route.
// Why: Delphi Epidata API serves official CDC ILINet FluView data — free, no auth.

import { NextResponse } from "next/server";
import { buildError, canonicalizeDisease, safeJsonFetch } from "../utils";

function getCurrentEpiweekRange() {
  const now = new Date();
  const year = now.getFullYear();
  const currentWeek = Math.ceil((now - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  const startWeek = Math.max(1, currentWeek - 10);
  return `${year}${String(startWeek).padStart(2, "0")}-${year}${String(currentWeek).padStart(2, "0")}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const diseaseInput = searchParams.get("disease")?.trim();
  const disease = canonicalizeDisease(diseaseInput);
  const region = searchParams.get("region")?.trim();

  try {
    const epiweeks = getCurrentEpiweekRange();
    const data = await safeJsonFetch(
      `https://api.delphi.cmu.edu/epidata/fluview/?regions=nat,hhs1,hhs2,hhs3,hhs4,hhs5,hhs6,hhs7,hhs8,hhs9,hhs10&epiweeks=${epiweeks}`,
      "cdc-fluview"
    );

    const epidata = data?.epidata || [];
    const filtered = region
      ? epidata.filter((row) => JSON.stringify(row).toLowerCase().includes(region.toLowerCase()))
      : epidata;

    return NextResponse.json({
      source: "cdc-fluview",
      disease: disease || "influenza",
      region: region || "national",
      season: "2025-2026",
      count: filtered.length,
      data: filtered.length ? filtered : epidata.slice(0, 20),
    });
  } catch (error) {
    return NextResponse.json(buildError("cdc-fluview", error), { status: 500 });
  }
}
