# MedFusion — Disease Surveillance Dashboard

## Overview
MedFusion is a multi-source disease surveillance dashboard that combines epidemiological signals, public-health alerts, disease ontology, genomic associations, and drug insights into a unified workflow.

The platform solves a practical surveillance challenge: outbreak intelligence and biomedical context are usually scattered across disconnected data portals and APIs. MedFusion normalizes those heterogeneous feeds into one query-driven interface.

This project was built for **MedFusion Hackfest 2026 at Mahindra University**.

## Live Demo
[placeholder for Vercel URL]

## Tech Stack

From `package.json`:

- `next@^15.5.12`
- `react@19.2.3`
- `react-dom@19.2.3`
- `tailwindcss@^4`
- `@tailwindcss/postcss@^4`
- `leaflet@^1.9.4`
- `react-leaflet@^5.0.0`
- `recharts@^3.8.0`
- `react-force-graph@^1.48.2`
- `react-force-graph-2d@^1.29.1`
- `xml2js@^0.6.2`
- `cheerio@^1.2.0`
- `papaparse@^5.5.3`
- `eslint@^9`
- `eslint-config-next@^15.5.12`
- `babel-plugin-react-compiler@1.0.0`

## Data Sources

Note: the prompt asks for 11 sources, but the listed set contains 12; all listed sources are documented below.

| Source | What It Provides | Access Method | Endpoint Used | Status |
|---|---|---|---|---|
| CDC Open Data Portal | Tabular disease surveillance records | REST JSON (Socrata) | `https://data.cdc.gov/resource/x9gk-5huc.json` | Active |
| Disease.sh | Global and country COVID-19 case/death/active snapshots | REST JSON | `https://disease.sh/v3/covid-19/all` and `https://disease.sh/v3/covid-19/countries/{region}` | Active (COVID-focused only) |
| WHO GHO OData API | Country-level public health indicators (life expectancy used in UI) | REST JSON (OData) | `https://ghoapi.azureedge.net/api/{indicator}?$filter=SpatialDim eq '{ISO3}'` | Active |
| CDC FluView (via Delphi CMU Epidata API) | Weekly influenza-like illness surveillance | REST JSON | `https://api.delphi.cmu.edu/epidata/fluview/?regions=...&epiweeks=...` | Active |
| HealthMap | Outbreak/news signal feed | RSS in `alerts` route + HTML scrape route | `https://healthmap.org/feed/` and `https://healthmap.org/en/` | Active |
| ProMED Mail (PAYWALLED) | Originally intended rapid outbreak alerts | N/A (substituted) | Replaced in code path by WHO RSS feed | **Substituted** |
| IHME GHDx India (CSV unavailable) | Originally intended India burden CSV feed | N/A (substituted) | Replaced by OpenDengue CSV + Disease.sh India COVID endpoint | **Substituted** |
| ECDC Databases | Case distribution data for regional epidemiological context | REST JSON | `https://opendata.ecdc.europa.eu/covid19/casedistribution/json/` | Active (with timeout guard) |
| UK Gov Health Statistics (UKHSA Dashboard API) | COVID and influenza metrics for UK geographies | REST JSON | `https://api.ukhsa-dashboard.data.gov.uk/themes/infectious_disease/...` | Active |
| Open Targets | Disease-target genomic associations | GraphQL | `https://api.platform.opentargets.org/api/v4/graphql` | Active |
| PubChem PUG-REST | Drug compound metadata (CID, molecular formula) | REST JSON | `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{drug}/JSON` | Active |
| NCBI MeSH | Disease classification identifiers | REST JSON | `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=mesh&term={disease}&retmode=json&retmax=5` | Active |

### Substitution Notes

- **ProMED replacement**: ProMED access constraints/paywall made it unsuitable for stable hackathon ingestion; alerts route now uses WHO Disease Outbreak News RSS plus HealthMap feed.
- **IHME replacement**: IHME CSV availability was unreliable; India route now combines OpenDengue historical rows and Disease.sh India current COVID metrics.

## API Routes

All routes are `GET` under `app/api`.

| Route | Method | Parameters | What It Returns | Source |
|---|---|---|---|---|
| `/api/search` | GET | `disease?`, `region?` | Unified multi-source response envelope with `mode`, `query`, `timestamp`, `results` | Internal aggregator over all routes |
| `/api/alerts` | GET | `disease?`, `region?` | Filtered/fallback alert items with title/link/date/description/source | WHO RSS + HealthMap RSS |
| `/api/cdc` | GET | `disease?`, `region?` | Filtered CDC rows matching keyword strategy | CDC Open Data |
| `/api/classify` | GET | `disease` (required) | `mesh.ids` + `ontology` hits | NCBI MeSH + Open Targets search |
| `/api/disease` | GET | `disease?`, `region?` | COVID global/country stats; non-COVID returns `data: null` with note | Disease.sh |
| `/api/drugs` | GET | `disease?` | Candidate drug metadata array | PubChem |
| `/api/ecdc` | GET | `region?` | Filtered ECDC records (capped) | ECDC |
| `/api/flu` | GET | `disease?`, `region?` | FluView weekly data for current epiweek range | Delphi CMU Epidata / CDC FluView |
| `/api/genes` | GET | `disease?` | Top associated genes and scores | Open Targets |
| `/api/healthmap` | GET | `disease?`, `region?` | Scraped outbreak title/link entries | HealthMap website |
| `/api/india` | GET | `disease?` | `dengueHistorical` + `covidCurrent` India bundle | OpenDengue + Disease.sh India |
| `/api/uk` | GET | `disease?`, `region?` | UKHSA COVID/Influenza metric datasets | UKHSA Dashboard API |
| `/api/who` | GET | `region?`, `indicator?` | WHO indicator values filtered by ISO3 country | WHO GHO OData |

## Query Modes

`/api/search` supports three modes and determines the frontend view layer:

1. Disease only: `?disease=dengue`
- Returns disease-centric bundle: classification, genes, drugs, alerts, and disease/global context.

2. Region only: `?region=India`
- Returns region-centric bundle: WHO indicators, regional alerts, map/trend context, and active disease candidates.

3. Both: `?disease=dengue&region=India`
- Returns unified disease+region response combining disease enrichment and region-specific surveillance in one payload.

## Components A-E

### A. Disease Classification
- Implemented via `/api/classify`.
- Uses NCBI MeSH IDs and ontology hits from Open Targets.
- Frontend shows ontology name/description and badge list of MeSH IDs.

### B. Epidemiological Surveillance
- Implemented via `/api/cdc`, `/api/who`, `/api/ecdc`, `/api/flu`, `/api/alerts`, `/api/healthmap`, `/api/uk`, `/api/india`.
- Aggregated through `/api/search` using `Promise.allSettled` for resilient partial success.

### C. Genomic Associations
- Implemented via `/api/genes` using Open Targets GraphQL.
- Frontend shows top genes and scores plus network relationships.

### D. Therapeutic Insights
- Implemented via `/api/drugs` using disease-to-drug mapping and PubChem compound lookup.
- Frontend renders candidate drugs with CID and molecular formula.

### E. Visual Intelligence Layer
- Map: `OutbreakMap` (Leaflet / React-Leaflet)
- Trend: `TrendChart` (Recharts)
- Alerts: `AlertFeed`
- Relationship Graph: `GeneNetwork` (react-force-graph-2d)

## Architecture

Pipeline:

`User Query -> /api/search -> Promise.allSettled across source adapters -> unified JSON response -> frontend mode components`

Design properties:

- Source-level fault isolation: one failed source does not fail the whole request.
- Shared normalization helpers in `app/api/utils.js`.
- Keyword and alias matching for disease/region harmonization.

## Setup & Running Locally

1. Clone repository

```bash
git clone <your-repo-url>
cd medfusion
```

2. Install dependencies

```bash
npm install
```

3. Start dev server

```bash
npm run dev
```

4. Open app

`http://localhost:3000`

## Deployment

Deploy to Vercel:

1. Push repository to GitHub.
2. Import project in Vercel dashboard.
3. Framework should auto-detect as Next.js.
4. Build command: `npm run build` (default).
5. Output mode: Next.js default.
6. Deploy and attach custom domain if needed.

## Challenges & Solutions

1. ProMED paywalled
- Challenge: unstable/non-open access for hackathon-grade ingestion.
- Solution: replaced with WHO Disease Outbreak News RSS and HealthMap feed inside alerts pipeline.

2. IHME CSV 404 / availability issues
- Challenge: India CSV source unreliable for live ingestion.
- Solution: replaced India pipeline with OpenDengue historical CSV + Disease.sh India COVID snapshot.

3. ECDC timeout
- Challenge: large ECDC dataset caused long/hanging fetch behavior.
- Solution: added explicit AbortController timeout (20s in ECDC route) and timeout-enabled shared fetch utilities.

4. ICD-10 NLM API returning empty/inconsistent matches
- Challenge: disease classification quality/availability issues with original ICD-only approach.
- Solution: shifted classification layer to NCBI MeSH IDs + Open Targets ontology hits for robust non-empty outputs.

## Future Scope

- Real-time websocket updates for alert streams and trend refresh
- Expanded disease-to-drug mapping coverage beyond current seeded set
- ML-based outbreak risk prediction and anomaly scoring
- Mobile application experience for field/public-health operators
- User accounts with saved searches, watchlists, and notifications
- Deeper direct genomic integrations (for example OMIM and additional variant resources)

## Team
[placeholder]

## License
MIT
