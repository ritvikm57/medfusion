import { NextResponse } from "next/server";
import { buildError, safeJsonFetch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = searchParams.get("disease")?.trim()?.toLowerCase();

  try {
    const [covidResult, whoResult] = await Promise.allSettled([
      // Disease.sh India COVID data
      safeJsonFetch(
        "https://disease.sh/v3/covid-19/countries/India",
        "disease-sh-india"
      ),
      // WHO GHO India dengue indicator
      safeJsonFetch(
        "https://ghoapi.azureedge.net/api/WHOSIS_000002?$filter=SpatialDim eq 'IND'",
        "who-gho"
      ),
    ]);

    const covidData = covidResult.status === "fulfilled" ? covidResult.value : null;
    const whoData = whoResult.status === "fulfilled" ? whoResult.value : null;

    const covidCurrent = covidData ? {
      cases: covidData.cases,
      deaths: covidData.deaths,
      active: covidData.active,
      recovered: covidData.recovered,
      updated: covidData.updated,
    } : null;

    const whoIndicators = whoData?.value || [];

    return NextResponse.json({
      source: "india-health",
      disease: disease || "all",
      region: "India",
      covidCurrent,
      whoIndicators,
    });
  } catch (error) {
    return NextResponse.json(buildError("india-health", error), { status: 500 });
  }
}