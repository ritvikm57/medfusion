// PubChem PUG-REST route with Open Targets fallback.
// Why: PubChem gives canonical chemical metadata for candidate drugs related to a disease.
//      Open Targets provides dynamic drug discovery when disease is not in our map.

import { NextResponse } from "next/server";
import { buildError, canonicalizeDisease, normalizeDisease, safeJsonFetch } from "../utils";

const DISEASE_DRUG_MAP = {
  "dengue": ["paracetamol", "acetaminophen"],
  "malaria": ["chloroquine", "artemisinin", "quinine"],
  "tuberculosis": ["rifampin", "isoniazid", "pyrazinamide"],
  "influenza": ["oseltamivir", "zanamivir", "baloxavir"],
  "covid-19": ["remdesivir", "dexamethasone", "nirmatrelvir"],
  "covid": ["remdesivir", "dexamethasone", "nirmatrelvir"],
  "cholera": ["doxycycline", "azithromycin"],
  "ebola": ["remdesivir", "atoltivimab"],
  "mpox": ["tecovirimat", "cidofovir"],
  "zika": ["paracetamol", "ibuprofen"],
  "hepatitis": ["tenofovir", "entecavir", "sofosbuvir"],
  "measles": ["vitamin a", "paracetamol"],
  "typhoid": ["ciprofloxacin", "azithromycin", "ceftriaxone"],
  "hiv": ["tenofovir", "efavirenz", "dolutegravir"],
  "pneumonia": ["amoxicillin", "azithromycin"],
  "diarrhea": ["oral rehydration salts", "zinc"],
  "diabetes": ["metformin", "insulin"]
};

async function searchOpenTargets(disease) {
  try {
    const query = `
      query {
        search(queryString: "${disease}", entityNames: ["drug"], page: {index: 0, size: 5}) {
          hits {
            id
            name
            description
          }
        }
      }
    `;

    const response = await fetch("https://api.platform.opentargets.org/api/v4/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const hits = data?.data?.search?.hits || [];

    return hits.map((hit) => ({
      drug: hit.name,
      cid: hit.id,
      molecularFormula: "See PubChem",
    }));
  } catch (error) {
    return [];
  }
}

async function candidateDrugsForDisease(disease) {
  const normalized = normalizeDisease(disease);
  if (!normalized) return { candidates: [], note: null };

  // Step 1: Check DISEASE_DRUG_MAP for known diseases
  if (DISEASE_DRUG_MAP[normalized]) {
    return { candidates: DISEASE_DRUG_MAP[normalized], note: null };
  }

  // Step 2: Try Open Targets GraphQL for dynamic drug discovery
  const openTargetsDrugs = await searchOpenTargets(disease);
  if (openTargetsDrugs.length > 0) {
    return { candidates: openTargetsDrugs.map((d) => d.drug), note: null, openTargetsData: openTargetsDrugs };
  }

  // Step 3: Fallback to generic supportive care drugs
  return {
    candidates: ["ibuprofen", "paracetamol"],
    note: "No specific drugs found. Showing supportive care options.",
  };
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

    const { candidates, note, openTargetsData } = await candidateDrugsForDisease(disease);

    // If Open Targets was used, return those results directly (already formatted)
    if (openTargetsData && openTargetsData.length > 0) {
      return NextResponse.json({
        source: "open-targets",
        disease,
        data: openTargetsData,
      });
    }

    // Otherwise, fetch from PubChem for the candidates
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

    const response = {
      source: "pubchem",
      disease,
      data,
    };

    if (note) response.note = note;

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(buildError("pubchem", error), { status: 500 });
  }
}
