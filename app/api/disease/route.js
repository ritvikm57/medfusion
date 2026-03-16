// Disease.sh adapter route.
// Why: disease.sh provides quick global/country disease snapshots with no auth.

import { NextResponse } from "next/server";
import { buildError, canonicalizeDisease, safeJsonFetch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = canonicalizeDisease(searchParams.get("disease"));
  const region = searchParams.get("region")?.trim();

  try {
    // Disease.sh is COVID-focused. For non-COVID, return null data gracefully.
    if (disease && disease !== "covid-19") {
      return NextResponse.json({
        source: "disease.sh",
        disease,
        region: region || null,
        data: null,
        note: "Disease.sh has strong coverage for COVID-19 only.",
      });
    }

    if (region) {
      const data = await safeJsonFetch(
        `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(region)}`,
        "disease.sh"
      );

      return NextResponse.json({
        source: "disease.sh",
        disease: disease || "covid-19",
        region,
        data,
      });
    }

    const data = await safeJsonFetch("https://disease.sh/v3/covid-19/all", "disease.sh");

    return NextResponse.json({
      source: "disease.sh",
      disease: disease || "covid-19",
      region: null,
      data,
    });
  } catch (error) {
    return NextResponse.json(buildError("disease.sh", error), { status: 500 });
  }
}
