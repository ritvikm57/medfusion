// Shared helpers for MedFusion API routes so each data-source handler can stay concise and fault tolerant.

export const COUNTRY_CODE_MAP = {
  india: "IND",
  "united states": "USA",
  usa: "USA",
  uk: "GBR",
  "united kingdom": "GBR",
  england: "GBR",
  france: "FRA",
  germany: "DEU",
  brazil: "BRA",
  china: "CHN",
  japan: "JPN",
  spain: "ESP",
  italy: "ITA",
  canada: "CAN",
  australia: "AUS",
};

export const DISEASE_ALIAS_MAP = {
  influenza: ["influenza", "flu", "seasonal flu", "h1n1", "grippe"],
  "covid-19": ["covid", "covid-19", "coronavirus", "sars-cov-2"],
  dengue: ["dengue", "breakbone fever"],
  tuberculosis: ["tuberculosis", "tb"],
  malaria: ["malaria"],
};

export function toISO3(region) {
  if (!region) return null;
  const normalized = region.trim().toLowerCase();
  return COUNTRY_CODE_MAP[normalized] || region.trim().toUpperCase();
}

export function keywordMatch(input, keywords) {
  const haystack = String(input || "").toLowerCase();
  return keywords.some((term) => haystack.includes(String(term || "").toLowerCase()));
}

export function canonicalizeDisease(value) {
  const normalized = normalizeDisease(value);
  if (!normalized) return "";

  const canonicalEntry = Object.entries(DISEASE_ALIAS_MAP).find(([_, aliases]) => aliases.includes(normalized));
  return canonicalEntry ? canonicalEntry[0] : normalized;
}

export function diseaseKeywords(value) {
  const canonical = canonicalizeDisease(value);
  if (!canonical) return [];

  const aliases = DISEASE_ALIAS_MAP[canonical] || [canonical];
  return Array.from(new Set([canonical, ...aliases]));
}

export function combinedKeywordMatch(payload, disease, region) {
  const text = String(payload || "");
  const diseaseTerms = diseaseKeywords(disease);
  const filters = [...diseaseTerms, region].filter(Boolean);
  if (!filters.length) return true;
  return keywordMatch(text, filters);
}

export function buildError(source, error) {
  return {
    error: error?.message || "Unknown error",
    source,
  };
}

export async function safeJsonFetch(url, source, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`${source} request failed with status ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function safeTextFetch(url, source, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`${source} request failed with status ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeDisease(value) {
  return String(value || "").trim().toLowerCase();
}
