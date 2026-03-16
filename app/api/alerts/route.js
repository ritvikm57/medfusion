import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import { buildError, canonicalizeDisease, combinedKeywordMatch, safeTextFetch } from "../utils";

const WHO_RSS = "https://www.who.int/rss-feeds/news-english.xml";
const HEALTHMAP_RSS = "https://healthmap.org/feed/";

async function fetchAndParse(url, source) {
  try {
    const xml = await safeTextFetch(url, source);
    const parsed = await parseStringPromise(xml, { explicitArray: false, trim: true });
    const items = parsed?.rss?.channel?.item || [];
    return Array.isArray(items) ? items : [items];
  } catch {
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = canonicalizeDisease(searchParams.get("disease")?.trim());
  const region = searchParams.get("region")?.trim();

  try {
    const [whoItems, healthmapItems] = await Promise.all([
      fetchAndParse(WHO_RSS, "who-rss"),
      fetchAndParse(HEALTHMAP_RSS, "healthmap-rss"),
    ]);

    const allItems = [
      ...whoItems.map((i) => ({ ...i, _source: "WHO" })),
      ...healthmapItems.map((i) => ({ ...i, _source: "HealthMap" })),
    ];

    const filtered = allItems
      .filter((item) => {
        const text = `${item?.title || ""} ${item?.description || ""}`;
        return combinedKeywordMatch(text, disease, region);
      })
      .slice(0, 20)
      .map((item) => ({
        title: item?.title || "Untitled",
        link: item?.link || null,
        pubDate: item?.pubDate || null,
        description: item?.description || "",
        source: item._source,
      }));

    const fallback = allItems.slice(0, 20).map((item) => ({
      title: item?.title || "Untitled",
      link: item?.link || null,
      pubDate: item?.pubDate || null,
      description: item?.description || "",
      source: item._source,
    }));

    return NextResponse.json({
      source: "alerts",
      disease: disease || null,
      region: region || null,
      data: filtered.length ? filtered : fallback,
    });
  } catch (error) {
    return NextResponse.json(buildError("alerts", error), { status: 500 });
  }
}