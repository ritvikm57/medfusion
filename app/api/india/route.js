import { NextResponse } from "next/server";
import Papa from "papaparse";
import { buildError, safeTextFetch, safeJsonFetch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = searchParams.get("disease")?.trim()?.toLowerCase();

  try {
    const [openDengueResult, panoResult] = await Promise.allSettled([
      // OpenDengue — India filtered CSV via GitHub raw
      safeTextFetch(
        "https://raw.githubusercontent.com/OpenDengue/master-repo/main/data/releases/V1.3/National_extract_V1_3.csv",
        "opendengue"
      ),
      // PAHO dengue data — covers global including Asia
      safeJsonFetch(
        "https://disease.sh/v3/covid-19/countries/India",
        "disease-sh-india"
      ),
    ]);

    let indiaRecords = [];

    if (openDengueResult.status === "fulfilled") {
      const parsed = Papa.parse(openDengueResult.value, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      // Filter for India
      indiaRecords = (parsed.data || [])
  .filter(row => 
    row.adm_0_name?.toLowerCase().includes("india")
  )
  .slice(0, 100);
    }

    const covidIndia = panoResult.status === "fulfilled" ? panoResult.value : null;

    return NextResponse.json({
      source: "india-health",
      disease: disease || "all",
      region: "India",
      dengueHistorical: indiaRecords,
      covidCurrent: covidIndia ? {
        cases: covidIndia.cases,
        deaths: covidIndia.deaths,
        active: covidIndia.active,
        recovered: covidIndia.recovered,
        updated: covidIndia.updated,
      } : null,
    });
  } catch (error) {
    return NextResponse.json(buildError("india-health", error), { status: 500 });
  }
}