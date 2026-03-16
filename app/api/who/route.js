// WHO GHO OData adapter route.
// Why: WHO country indicators provide standardized public-health signal by ISO-3 country code.

import { NextResponse } from "next/server";
import { buildError, safeJsonFetch, toISO3 } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region")?.trim();
  const indicator = searchParams.get("indicator") || "WHOSIS_000001";

  try {
    if (!region) {
      return NextResponse.json({
        source: "who-gho",
        region: null,
        indicator,
        data: null,
        note: "Provide a region to fetch country-level WHO indicators.",
      });
    }

    const countryCode = toISO3(region);
    const endpoint = `https://ghoapi.azureedge.net/api/${encodeURIComponent(indicator)}?$filter=${encodeURIComponent(
      `SpatialDim eq '${countryCode}'`
    )}`;

    const response = await safeJsonFetch(endpoint, "who-gho");

    return NextResponse.json({
      source: "who-gho",
      region,
      countryCode,
      indicator,
      data: response?.value || [],
    });
  } catch (error) {
    return NextResponse.json(buildError("who-gho", error), { status: 500 });
  }
}
