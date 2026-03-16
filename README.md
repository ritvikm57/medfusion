# MedFusion

MedFusion is a live, multi-source disease surveillance dashboard built with Next.js (App Router).
It lets users search by disease, region, or both, then aggregates epidemiology signals, public-health alerts,
classification data, and translational biomedical context into a single view.

The app is designed to stay resilient under partial source failures by using source-level fault tolerance
and aggregation via settled promises.

## What MedFusion Does

- Aggregates real-time and near-real-time public health data from multiple external sources.
- Supports three query modes:
	- Disease mode (disease only)
	- Region mode (region only)
	- Combined mode (disease + region)
- Enriches searches with:
	- ICD-10 classification suggestions
	- Gene associations (Open Targets)
	- Candidate drug metadata (PubChem)
- Visualizes outputs as:
	- Outbreak map (Leaflet)
	- Trend chart (Recharts)
	- Alert feed cards
	- Disease-gene-drug force graph

## Tech Stack

- Framework: Next.js 15 (App Router)
- Runtime UI: React 19
- Styling: Tailwind CSS v4
- Mapping: Leaflet + React Leaflet
- Charting: Recharts
- Graph visualization: react-force-graph-2d
- Parsing/utilities:
	- xml2js (RSS/XML)
	- cheerio (HTML scraping)
	- papaparse (CSV)

## Project Structure

```text
app/
	page.js                      # Main query/search experience
	layout.js                    # Fonts + global layout metadata
	globals.css                  # Global styling
	disease/[name]/page.js       # Deep-link disease page
	region/[name]/page.js        # Deep-link region page
	api/
		search/route.js            # Master aggregator endpoint
		utils.js                   # Shared helpers for all routes
		disease/route.js           # disease.sh adapter
		who/route.js               # WHO GHO adapter
		alerts/route.js            # ProMED RSS adapter
		flu/route.js               # CDC FluView RSS adapter
		cdc/route.js               # CDC Open Data adapter
		ecdc/route.js              # ECDC adapter
		healthmap/route.js         # HealthMap scraper adapter
		uk/route.js                # UK ONS dataset discovery adapter
		classify/route.js          # ICD-10 route (NLM Clinical Tables)
		genes/route.js             # Open Targets GraphQL adapter
		drugs/route.js             # PubChem adapter
		india/route.js             # IHME India CSV adapter (conditional)
components/
	SearchBar.js
	DiseaseView.js
	RegionView.js
	BothView.js
	OutbreakMap.js
	TrendChart.js
	AlertFeed.js
	GeneNetwork.js
```

## Local Development

### Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- npm 9+ (or equivalent package manager)

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Open http://localhost:3000.

### Build and Start

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Query Model

The frontend sends user input to the aggregator endpoint:

- GET /api/search?disease=<value>&region=<value>

Supported behavior:

- If only disease is set: mode = disease
- If only region is set: mode = region
- If both are set: mode = both
- If neither is set: returns HTTP 400 with a structured validation error

The aggregator canonicalizes disease terms, fans out to source routes, and returns a unified result envelope.

## Aggregator Response Shape

```json
{
	"mode": "disease | region | both | invalid",
	"query": {
		"disease": "raw user input",
		"diseaseCanonical": "canonical disease",
		"region": "raw region"
	},
	"timestamp": "ISO string",
	"results": {
		"disease": {},
		"who": {},
		"alerts": {},
		"flu": {},
		"cdc": {},
		"ecdc": {},
		"healthmap": {},
		"uk": {},
		"classify": {},
		"genes": {},
		"drugs": {},
		"india": {},
		"activeDiseases": []
	}
}
```

Notes:

- india appears only when region equals India.
- activeDiseases is derived from CDC tabular rows for region and both modes.
- Any individual source can fail without breaking the entire response.

## API Endpoints

All endpoints are GET routes under /api.

### Core Aggregation

| Endpoint | Purpose | Parameters |
|---|---|---|
| /api/search | Master orchestration endpoint; fans out to source adapters and merges responses | disease (optional), region (optional) |

### Source Adapters

| Endpoint | External Source | Purpose | Parameters |
|---|---|---|---|
| /api/disease | disease.sh | COVID-oriented global/country stats | disease, region |
| /api/who | WHO GHO OData | Country health indicators by ISO3 code | region, indicator (optional) |
| /api/alerts | ProMED RSS | Curated outbreak alert feed | disease, region |
| /api/flu | CDC FluView RSS | Influenza bulletin feed | disease, region |
| /api/cdc | CDC Open Data (Socrata) | Tabular surveillance records | disease, region |
| /api/ecdc | ECDC | Case distribution records and trend context | region |
| /api/healthmap | HealthMap | Scraped outbreak headlines/links | disease, region |
| /api/uk | UK ONS API | UK dataset discovery relevant to terms | disease, region |
| /api/classify | NLM Clinical Tables | ICD-10 term/code suggestions | disease |
| /api/genes | Open Targets GraphQL | Disease-associated gene targets | disease |
| /api/drugs | PubChem PUG-REST | Candidate drug metadata (CID/formula) | disease |
| /api/india | IHME GHDx CSV | India-specific cause/burden rows | disease |

## Data Normalization and Matching

Shared helpers in app/api/utils.js provide normalization and resilient behavior:

- Disease canonicalization using alias maps
- Region to ISO3 conversion for WHO requests
- Keyword matching across mixed payloads
- Safe fetch wrappers with consistent no-store behavior
- Consistent route-level error object construction

Current disease alias examples include influenza/flu, covid-19/coronavirus,
dengue, tuberculosis, and malaria.

## UI Composition by Mode

### Disease Mode

- Summary cards (cases/deaths/recovered)
- ICD-10 panel
- Outbreak map and trend chart
- Alert feed
- Genes and drugs tables
- Force-directed network graph

### Region Mode

- Active diseases chips (derived)
- WHO indicators table
- Outbreak map and regional trend chart
- Regional alert feed

### Combined Mode

- Renders both disease and region modules
- Adds India-specific table when region is India

## Deep-Link Routes

- /disease/[name]
- /region/[name]

These pages call the same /api/search endpoint and render the corresponding view components.

## Fault Tolerance Model

Resilience is a first-class behavior:

- Aggregator uses Promise.allSettled for per-source isolation.
- Source errors are preserved as structured payloads instead of throwing away the full response.
- Several adapters return filtered results and fallback slices to avoid empty UIs when strict filtering yields zero matches.
- UI components render graceful empty/placeholder states for unavailable modules.

## Operational Notes

- External source schemas can change without notice.
- Some providers are rate-limited or intermittently unavailable.
- /api/disease is intentionally COVID-centric when using disease.sh.
- /api/healthmap is scrape-based and may require selector updates over time.
- /api/india parses a large CSV and is only called conditionally to limit unnecessary work.

## Extending MedFusion

### Add a New Source Adapter

1. Create app/api/<source>/route.js.
2. Use helper utilities from app/api/utils.js for consistent matching and error behavior.
3. Return a normalized JSON shape:
	 - source
	 - disease and/or region where relevant
	 - data
	 - optional note or error
4. Register the endpoint in app/api/search/route.js fetchPlan.
5. Surface in the relevant UI view component(s).

### Add Disease Synonyms

Update DISEASE_ALIAS_MAP in app/api/utils.js.

### Add Region Code Mappings

Update COUNTRY_CODE_MAP in app/api/utils.js.

## Troubleshooting

### No results in one panel

- Check if that source endpoint is returning an error field.
- Verify external API availability.
- Relax disease/region input terms (especially for strict keyword filters).

### WHO data missing

- Confirm region is supplied.
- Confirm ISO3 conversion exists or add mapping in COUNTRY_CODE_MAP.
- Try a different WHO indicator query parameter.

### Map has no markers

- Many sources do not expose lat/lng consistently.
- Marker extraction currently looks for common latitude/longitude key variants.

### Graph appears sparse

- Disease may not map to an Open Targets disease hit.
- PubChem candidate list is disease-driven and may fall back to placeholder compounds.

## Recommended Next Improvements

- Add per-source timeout and retry strategy.
- Introduce source health telemetry and status badges.
- Add response caching policy with selective stale-while-revalidate behavior.
- Add unit tests for utility normalization/matching functions.
- Add integration tests for /api/search shape guarantees and mode handling.

## Scripts

```json
{
	"dev": "next dev",
	"build": "next build",
	"start": "next start",
	"lint": "next lint"
}
```

## License

No license file is currently included in this repository.
Add one if you plan to publish or distribute the project.
