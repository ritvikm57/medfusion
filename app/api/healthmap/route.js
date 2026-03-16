// HealthMap scraper route.
// Why: HealthMap offers outbreak visibility from curated web signals where formal APIs are limited.

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { buildError, canonicalizeDisease, combinedKeywordMatch, safeTextFetch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = canonicalizeDisease(searchParams.get("disease")?.trim());
  const region = searchParams.get("region")?.trim();

  try {
    const html = await safeTextFetch("https://healthmap.org/en/", "healthmap");
    const $ = cheerio.load(html);

    const entries = [];
    $("a, .alert, .outbreak, .news-item").each((_, el) => {
      if (entries.length >= 40) return;
      const title = $(el).text().trim();
      const link = $(el).attr("href") || null;
      if (!title) return;
      if (!combinedKeywordMatch(title, disease, region)) return;

      entries.push({
        title,
        link: link?.startsWith("http") ? link : link ? `https://healthmap.org${link}` : null,
      });
    });

    return NextResponse.json({
      source: "healthmap",
      disease: disease || null,
      region: region || null,
      data: entries,
    });
  } catch (error) {
    return NextResponse.json(buildError("healthmap", error), { status: 500 });
  }
}
