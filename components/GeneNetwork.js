"use client";

// Force-directed graph for disease-gene-drug relationships.
// Why: network view reveals multimodal links that are hard to see in tabular data.

import dynamic from "next/dynamic";
import { useMemo } from "react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

function buildGraph(disease, genes = [], drugs = []) {
  const diseaseNodeId = disease || "Disease";
  const nodes = [{ id: diseaseNodeId, type: "disease", group: "disease", label: diseaseNodeId }];
  const links = [];

  genes.slice(0, 15).forEach((gene) => {
    const id = gene?.symbol || gene?.name || gene?.geneId;
    if (!id) return;
    const score = Number(gene?.score || 0);
    nodes.push({
      id,
      type: "gene",
      group: "gene",
      score,
      symbol: gene?.symbol || id,
      fullName: gene?.name || gene?.approvedName || id,
      label: gene?.symbol || id,
    });
    links.push({
      source: id,
      target: diseaseNodeId,
      value: score || 0.1,
      type: "gene",
      color: "#7F77DD",
      width: Math.max(1.5, score * 6),
    });
  });

  drugs.slice(0, 10).forEach((drug) => {
    const id = drug?.drug;
    if (!id) return;
    nodes.push({ id, type: "drug", group: "drug", label: id });
    links.push({
      source: id,
      target: diseaseNodeId,
      value: 0.2,
      type: "drug",
      color: "#1D9E75",
      width: 2,
    });
  });

  return { nodes, links };
}

export default function GeneNetwork({ disease, genes = [], drugs = [], loading = false }) {
  const graphData = useMemo(() => buildGraph(disease, genes, drugs), [disease, genes, drugs]);

  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-slate-800/70" />;
  }

  if (graphData.nodes.length <= 1) {
    return <div className="rounded-2xl border border-slate-800 p-4 text-slate-300">Network data unavailable.</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-lg font-semibold text-cyan-200">Gene-Drug-Disease Network</h3>
      <div className="h-80 w-full overflow-hidden rounded-xl bg-transparent">
        <ForceGraph2D
          graphData={graphData}
          height={400}
          backgroundColor="transparent"
          nodeLabel={(node) => {
            if (node.type === "gene") {
              const score = Number(node?.score || 0).toFixed(3);
              return `${node?.symbol || node.id}\n${node?.fullName || node.id}\nScore: ${score}`;
            }
            return `${node.id} (${node.type || node.group})`;
          }}
          linkColor={(link) => link?.color || "#64748b"}
          linkWidth={(link) => link?.width || 1.5}
          linkVisibility={() => true}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const x = node.x || 0;
            const y = node.y || 0;
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (node.type === "disease") {
              const radius = 20;
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = "#dc2626";
              ctx.fill();
              ctx.fillStyle = "#f8fafc";
              ctx.fillText(String(node.label || node.id), x, y);
              return;
            }

            if (node.type === "gene") {
              const radius = Number(node.score || 0) * 15 + 8;
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = "#7F77DD";
              ctx.fill();
              ctx.fillStyle = "#e2e8f0";
              ctx.textBaseline = "top";
              ctx.fillText(String(node.label || node.id), x, y + radius + 2);
              return;
            }

            if (node.type === "drug") {
              const label = String(node.label || node.id);
              const paddingX = 6;
              const height = 18;
              const width = ctx.measureText(label).width + paddingX * 2;
              const radius = 6;
              const left = x - width / 2;
              const top = y - height / 2;

              ctx.beginPath();
              ctx.moveTo(left + radius, top);
              ctx.lineTo(left + width - radius, top);
              ctx.quadraticCurveTo(left + width, top, left + width, top + radius);
              ctx.lineTo(left + width, top + height - radius);
              ctx.quadraticCurveTo(left + width, top + height, left + width - radius, top + height);
              ctx.lineTo(left + radius, top + height);
              ctx.quadraticCurveTo(left, top + height, left, top + height - radius);
              ctx.lineTo(left, top + radius);
              ctx.quadraticCurveTo(left, top, left + radius, top);
              ctx.closePath();
              ctx.fillStyle = "#1D9E75";
              ctx.fill();
              ctx.fillStyle = "#f8fafc";
              ctx.fillText(label, x, y);
            }
          }}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={1.5}
        />
      </div>
    </div>
  );
}
