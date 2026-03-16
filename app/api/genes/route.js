// Open Targets GraphQL route.
// Why: Open Targets links diseases to high-confidence target genes for translational insights.

import { NextResponse } from "next/server";
import { buildError, canonicalizeDisease } from "../utils";

const OPENTARGETS_URL = "https://api.platform.opentargets.org/api/v4/graphql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const diseaseInput = searchParams.get("disease")?.trim();
  const disease = canonicalizeDisease(diseaseInput);

  try {
    if (!disease) {
      return NextResponse.json({
        source: "open-targets",
        disease: null,
        data: [],
        note: "Provide a disease to fetch associated genes.",
      });
    }

    const query = `
      query DiseaseTargets($term: String!) {
        search(queryString: $term, entityNames: ["disease"], page: { index: 0, size: 1 }) {
          hits {
            id
            name
          }
        }
      }
    `;

    const searchResponse = await fetch(OPENTARGETS_URL, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { term: disease } }),
    });

    if (!searchResponse.ok) {
      throw new Error(`open-targets request failed with status ${searchResponse.status}`);
    }

    const searchJson = await searchResponse.json();
    const diseaseHit = searchJson?.data?.search?.hits?.[0];

    if (!diseaseHit?.id) {
      return NextResponse.json({
        source: "open-targets",
        disease,
        data: [],
      });
    }

    const associationQuery = `
      query Assoc($efoId: String!) {
        disease(efoId: $efoId) {
          id
          name
          associatedTargets(page: { index: 0, size: 20 }) {
            rows {
              score
              target {
                id
                approvedSymbol
                approvedName
              }
            }
          }
        }
      }
    `;

    const assocResponse = await fetch(OPENTARGETS_URL, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: associationQuery, variables: { efoId: diseaseHit.id } }),
    });

    if (!assocResponse.ok) {
      throw new Error(`open-targets request failed with status ${assocResponse.status}`);
    }

    const assocJson = await assocResponse.json();
    const rows = assocJson?.data?.disease?.associatedTargets?.rows || [];

    const data = rows.map((row) => ({
      score: row?.score || 0,
      geneId: row?.target?.id || null,
      symbol: row?.target?.approvedSymbol || null,
      name: row?.target?.approvedName || null,
    }));

    return NextResponse.json({
      source: "open-targets",
      disease,
      diseaseId: diseaseHit.id,
      data,
    });
  } catch (error) {
    return NextResponse.json(buildError("open-targets", error), { status: 500 });
  }
}
