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
  const nodes = [{ id: diseaseNodeId, group: "disease" }];
  const links = [];

  genes.slice(0, 15).forEach((gene) => {
    const id = gene?.symbol || gene?.name || gene?.geneId;
    if (!id) return;
    nodes.push({ id, group: "gene", score: gene?.score || 0 });
    links.push({ source: diseaseNodeId, target: id, value: gene?.score || 0.1 });
  });

  drugs.slice(0, 10).forEach((drug) => {
    const id = drug?.drug;
    if (!id) return;
    nodes.push({ id, group: "drug" });
    links.push({ source: diseaseNodeId, target: id, value: 0.2 });
  });

  return { nodes, links };
}

function colorByGroup(group) {
  if (group === "disease") return "#22d3ee";
  if (group === "gene") return "#38bdf8";
  if (group === "drug") return "#f59e0b";
  return "#94a3b8";
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
      <div className="h-80 w-full overflow-hidden rounded-xl bg-slate-950">
        <ForceGraph2D
          graphData={graphData}
          nodeAutoColorBy="group"
          nodeLabel={(node) => `${node.id} (${node.group})`}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = String(node.id);
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillStyle = colorByGroup(node.group);
            ctx.fillText(label, node.x || 0, node.y || 0);
          }}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={1.5}
        />
      </div>
    </div>
  );
}
