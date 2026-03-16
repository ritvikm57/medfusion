import { NextResponse } from "next/server";
import { buildError, combinedKeywordMatch, safeJsonFetch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = searchParams.get("disease")?.trim();
  const region = searchParams.get("region")?.trim();

  try {
    const [ukCovidResult, ukFluResult] = await Promise.allSettled([
      // UKHSA COVID dashboard API — free, no auth
      safeJsonFetch(
        `https://api.ukhsa-dashboard.data.gov.uk/themes/infectious_disease/sub_themes/respiratory/topics/COVID-19/geography_types/Nation/geographies/England/metrics/COVID-19_cases_countRollingMean?page_size=10`,
        "ukhsa-covid"
      ),
      // UKHSA Flu dashboard
      safeJsonFetch(
        `https://api.ukhsa-dashboard.data.gov.uk/themes/infectious_disease/sub_themes/respiratory/topics/Influenza/geography_types/Nation/geographies/England/metrics/influenza_testing_positivityByWeek?page_size=10`,
        "ukhsa-flu"
      ),
    ]);

    const covidData = ukCovidResult.status === "fulfilled"
      ? ukCovidResult.value?.results || []
      : [];

    const fluData = ukFluResult.status === "fulfilled"
      ? ukFluResult.value?.results || []
      : [];

    const allData = { covid: covidData, influenza: fluData };

    // Filter by disease if provided
    const diseaseKey = disease?.toLowerCase();
    const filtered = diseaseKey === "flu" || diseaseKey === "influenza"
      ? { influenza: fluData }
      : diseaseKey === "covid" || diseaseKey === "covid-19"
      ? { covid: covidData }
      : allData;

    return NextResponse.json({
      source: "ukhsa",
      disease: disease || null,
      region: region || "England",
      data: filtered,
    });
  } catch (error) {
    return NextResponse.json(buildError("ukhsa", error), { status: 500 });
  }
}