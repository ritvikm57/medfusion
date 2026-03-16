// PubChem PUG-REST route.
// Why: PubChem gives canonical chemical metadata for candidate drugs related to a disease.

import { NextResponse } from "next/server";
import { buildError, canonicalizeDisease, normalizeDisease, safeJsonFetch } from "../utils";

const DISEASE_DRUG_MAP = {
  dengue: ["paracetamol", "acetaminophen"],
  malaria: ["chloroquine", "artemisinin"],
  tuberculosis: ["rifampin", "isoniazid"],
  influenza: ["oseltamivir", "zanamivir"],
  covid: ["remdesivir", "dexamethasone"],
  "covid-19": ["remdesivir", "dexamethasone"],
  diabetes: ["metformin", "insulin"],
};

function candidateDrugsForDisease(disease) {
  const normalized = normalizeDisease(disease);
  if (!normalized) return [];
  if (DISEASE_DRUG_MAP[normalized]) return DISEASE_DRUG_MAP[normalized];

  // Fallback for unknown diseases with safe common analgesics as placeholder examples.
  return ["ibuprofen", "aspirin"];
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const diseaseInput = searchParams.get("disease")?.trim();
  const disease = canonicalizeDisease(diseaseInput);

  try {
    if (!disease) {
      return NextResponse.json({
        source: "pubchem",
        disease: null,
        data: [],
        note: "Provide a disease to map candidate drugs.",
      });
    }

    const candidates = candidateDrugsForDisease(disease);
    const fetches = candidates.map(async (drug) => {
      const endpoint = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
        drug
      )}/JSON`;

      const data = await safeJsonFetch(endpoint, "pubchem");
      const compound = data?.PC_Compounds?.[0];

      return {
        drug,
        cid: compound?.id?.id?.cid || null,
        molecularFormula:
          compound?.props?.find((prop) => prop?.urn?.label === "Molecular Formula")?.value?.sval || null,
      };
    });

    const settled = await Promise.allSettled(fetches);
    const data = settled
      .filter((item) => item.status === "fulfilled")
      .map((item) => item.value);

    return NextResponse.json({
      source: "pubchem",
      disease,
      data,
    });
  } catch (error) {
    return NextResponse.json(buildError("pubchem", error), { status: 500 });
  }
}
