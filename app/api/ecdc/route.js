import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region")?.trim();

  return NextResponse.json({
    source: "ecdc",
    region: region || null,
    data: [],
    note: "ECDC endpoint temporarily unavailable. Data sourced from ecdc.europa.eu",
    fallback: true
  });
}