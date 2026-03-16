// PubMed API route.
// Why: PubMed provides access to scholarly literature on diseases and outbreaks.

import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = searchParams.get("disease")?.trim();

  if (!disease) {
    return NextResponse.json({ source: "pubmed", data: [] });
  }

  try {
    // Step 1: Search PubMed for articles matching disease + outbreak + surveillance
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      disease
    )}+outbreak+surveillance&retmax=5&retmode=json&sort=date`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      return NextResponse.json({ source: "pubmed", data: [] });
    }

    const searchData = await searchResponse.json();
    const ids = searchData?.esearchresult?.idlist || [];

    if (!ids || ids.length === 0) {
      return NextResponse.json({ source: "pubmed", data: [] });
    }

    // Step 2: Get summaries for the found articles
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(
      ","
    )}&retmode=json`;

    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) {
      return NextResponse.json({ source: "pubmed", data: [] });
    }

    const summaryData = await summaryResponse.json();
    const result = summaryData?.result || {};

    // Parse results, skipping the "uids" key
    const articles = Object.entries(result)
      .filter(([key]) => key !== "uids")
      .map(([_, article]) => {
        const authors = article?.authors || [];
        const firstAuthor = authors[0]?.name || "Unknown";
        const authorString =
          authors.length > 1 ? `${firstAuthor} et al` : firstAuthor;

        return {
          title: article?.title || "",
          authors: authorString,
          journal: article?.source || "",
          pubdate: article?.pubdate || "",
          pmid: article?.uid || "",
          link: `https://pubmed.ncbi.nlm.nih.gov/${article?.uid}`,
        };
      });

    return NextResponse.json({ source: "pubmed", data: articles });
  } catch (error) {
    return NextResponse.json({ source: "pubmed", data: [] });
  }
}
