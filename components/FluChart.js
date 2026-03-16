'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const FluChart = ({ data = [], loading = false }) => {
  // Filter data where region === "nat" and sort by epiweek
  const filteredData = (data || [])
    .filter(item => item.region === 'nat')
    .sort((a, b) => {
      const weeka = parseInt(a.epiweek) || 0
      const weekb = parseInt(b.epiweek) || 0
      return weeka - weekb
    })

  // Loading state
  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-white mb-6">US Influenza Surveillance — Weighted ILI %</h2>
        <div className="h-64 bg-slate-800 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  // Empty state
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-white mb-6">US Influenza Surveillance — Weighted ILI %</h2>
        <div className="flex items-center justify-center h-64 bg-slate-800 rounded-lg">
          <p className="text-slate-400 text-lg">Flu surveillance data unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-slate-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">US Influenza Surveillance — Weighted ILI %</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="epiweek" 
            tick={{ fill: '#94a3b8' }}
          />
          <YAxis 
            label={{ value: 'Weighted ILI %', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            tick={{ fill: '#94a3b8' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Line 
            type="monotone" 
            dataKey="wili" 
            stroke="#22d3ee" 
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default FluChart
