'use client'

import React from 'react'

const OutbreakTimeline = ({ items = [], title = 'Outbreak Timeline', loading = false }) => {
  // Utility to strip HTML tags
  const stripHtmlTags = (html) => {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '')
  }

  // Utility to format date as "DD MMM YYYY"
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  }

  // Get source badge background color
  const getSourceBadgeColor = (source) => {
    if (!source) return 'bg-gray-600'
    const lower = source.toLowerCase()
    if (lower.includes('who')) return 'bg-blue-600'
    if (lower.includes('healthmap')) return 'bg-green-600'
    return 'bg-slate-600'
  }

  // Get dot color based on source
  const getDotColor = (source) => {
    if (!source) return 'bg-slate-400'
    const lower = source.toLowerCase()
    if (lower.includes('who')) return 'bg-blue-400'
    if (lower.includes('healthmap')) return 'bg-green-400'
    return 'bg-cyan-400'
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
        <div className="h-72 bg-slate-800 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
        <div className="flex items-center justify-center h-72 bg-slate-800 rounded-lg">
          <p className="text-slate-400 text-lg">No outbreak alerts found</p>
        </div>
      </div>
    )
  }

  // Timeline render
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="relative">
        {/* Vertical cyan line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-cyan-500"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {items.map((item, index) => {
            const date = item.pubDate || item.date
            const description = stripHtmlTags(item.description || '')
            const truncatedDesc = description.length > 150 ? description.substring(0, 150) + '...' : description

            return (
              <div key={index} className="relative pl-20">
                {/* Colored dot on timeline */}
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full ${getDotColor(item.source)} border-4 border-slate-900`}></div>

                {/* Item content */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-bold text-lg flex-1">{item.title}</h3>
                    {item.source && (
                      <span className={`${getSourceBadgeColor(item.source)} text-white text-xs font-semibold px-3 py-1 rounded ml-2 whitespace-nowrap`}>
                        {item.source}
                      </span>
                    )}
                  </div>
                  {date && <p className="text-slate-400 text-sm mb-2">{formatDate(date)}</p>}
                  {truncatedDesc && <p className="text-slate-300 text-sm">{truncatedDesc}</p>}
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm mt-3 inline-block">
                      Read more →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OutbreakTimeline
