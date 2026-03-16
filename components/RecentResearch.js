'use client'

import React from 'react'

const RecentResearch = ({ papers = [], loading = false }) => {
  // Loading state
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-xl font-bold text-white mb-4">Recent Research Papers</h2>
        <div className="space-y-3">
          <div className="h-20 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-20 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-20 bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!papers || papers.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-xl font-bold text-white mb-4">Recent Research Papers</h2>
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">No recent research found</p>
        </div>
      </div>
    )
  }

  // Display up to 5 papers
  const displayPapers = papers.slice(0, 5)

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-xl font-bold text-white mb-4">Recent Research Papers</h2>
      <div className="space-y-4">
        {displayPapers.map((paper, index) => (
          <div key={index} className="border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors">
            {/* Title as link */}
            <a 
              href={paper.link || `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-semibold block mb-2 break-words"
            >
              {paper.title}
            </a>

            {/* Authors */}
            {paper.authors && (
              <p className="text-slate-400 text-xs mb-2 truncate">
                {paper.authors}
              </p>
            )}

            {/* Journal and date badge + PubMed badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {paper.journal && (
                <span className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded">
                  {paper.journal} {paper.pubdate ? `• ${paper.pubdate}` : ''}
                </span>
              )}
              <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                PubMed
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentResearch
