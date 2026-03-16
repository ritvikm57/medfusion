import { NextResponse } from "next/server";
import { buildError, safeJsonFetch } from "../utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const disease = searchParams.get("disease")?.trim();

  if (!disease) {
    return NextResponse.json({ error: "disease parameter required", source: "classify" }, { status: 400 });
  }

  try {
    const [meshResult, mondoResult] = await Promise.allSettled([
      // NCBI MeSH — free, no auth, reliable
      safeJsonFetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=mesh&term=${encodeURIComponent(disease)}&retmode=json&retmax=5`,
        "ncbi-mesh"
      ),
      // Open Targets disease search — free GraphQL
      fetch("https://api.platform.opentargets.org/api/v4/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `{
            search(queryString: "${disease}", entityNames: ["disease"], page: {index: 0, size: 3}) {
              hits {
                id
                name
                description
                object {
                  ... on Disease {
                    id
                    name
                    description
                    synonyms { hasBroadSynonym hasSynonym hasExactSynonym }
                  }
                }
              }
            }
          }`
        }),
        cache: "no-store"
      }).then(r => r.json())
    ]);

    // Parse MeSH
    const meshData = meshResult.status === "fulfilled" ? meshResult.value : null;
    const meshIds = meshData?.esearchresult?.idlist || [];

    // Parse Open Targets
    const otData = mondoResult.status === "fulfilled" ? mondoResult.value : null;
    const diseases = otData?.data?.search?.hits?.map(h => ({
      id: h.id,
      name: h.name,
      description: h.description,
    })) || [];

    return NextResponse.json({
      source: "classify",
      disease,
      mesh: {
        ids: meshIds,
        searchTerm: disease,
        database: "NCBI MeSH"
      },
      ontology: diseases,
    });
  } catch (error) {
    return NextResponse.json(buildError("classify", error), { status: 500 });
  }
}






