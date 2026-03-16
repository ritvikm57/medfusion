'use client'

import React from 'react'

const SourceFooter = ({ results = {} }) => {
  const sources = [
    { label: 'WHO GHO', key: 'who', url: 'https://www.who.int/data/gho' },
    { label: 'CDC FluView', key: 'flu', url: 'https://gis.cdc.gov/grasp/fluview/' },
    { label: 'Disease.sh', key: 'disease', url: 'https://disease.sh' },
    { label: 'ECDC', key: 'ecdc', url: 'https://www.ecdc.europa.eu' },
    { label: 'UKHSA', key: 'uk', url: 'https://ukhsa-dashboard.data.gov.uk' },
    { label: 'Open Targets', key: 'genes', url: 'https://platform.opentargets.org' },
    { label: 'PubChem', key: 'drugs', url: 'https://pubchem.ncbi.nlm.nih.gov' },
    { label: 'NCBI MeSH', key: 'classify', url: 'https://www.ncbi.nlm.nih.gov/mesh' },
    { label: 'HealthMap', key: 'alerts', url: 'https://healthmap.org' },
    { label: 'PubMed', key: 'pubmed', url: 'https://pubmed.ncbi.nlm.nih.gov' },
  ]

  // Determine badge color based on source status
  const getBadgeColor = (source) => {
    const sourceData = results?.[source.key]

    // Has error field -> red
    if (sourceData?.error) return 'bg-red-600'

    // Has data array with length > 0 and no error -> green
    if (Array.isArray(sourceData?.data) && sourceData.data.length > 0 && !sourceData.error) {
      return 'bg-green-600'
    }

    // Otherwise (empty data or no data) -> red
    return 'bg-red-600'
  }

  return (
    <div className="w-full">
      <p className="text-xs text-slate-500 mb-2">Data Sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${getBadgeColor(source)} text-white text-xs font-semibold px-3 py-1 rounded hover:opacity-80 transition-opacity`}
          >
            {source.label}
          </a>
        ))}
      </div>
    </div>
  )
}

export default SourceFooter
