"use client";

// Alert feed card.
// Why: surfaces latest outbreak narratives from RSS/scraped alert sources.

function stripHtml(text) {
  return String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeAlert(item) {
  const title = item?.title || item?.topic || "";
  const date = item?.pubDate || item?.date || null;
  const isUkhsaShape = !item?.title && Boolean(item?.topic);

  if (!title) return null;

  const summary = isUkhsaShape
    ? [item?.topic, item?.date, item?.metric_value].filter(Boolean).join(" | ") || "No summary."
    : stripHtml(item?.description) || "No summary.";

  return {
    key: item?.link || `${title}-${date || "no-date"}`,
    title,
    date,
    summary,
    link: item?.link || null,
  };
}

export default function AlertFeed({ title = "Alerts", items = [], loading = false }) {
  if (loading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-slate-800/70" />;
  }

  const normalizedItems = (items || []).map(normalizeAlert).filter(Boolean);

  if (!normalizedItems.length) {
    return <div className="rounded-2xl border border-slate-800 p-4 text-slate-300">Alert data unavailable.</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-lg font-semibold text-cyan-200">{title}</h3>
      <div className="max-h-72 space-y-3 overflow-auto pr-1">
        {normalizedItems.map((item, index) => (
          <article key={`${item.key}-${index}`} className="rounded-xl bg-slate-950/70 p-3">
            <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
            <p className="mt-1 text-xs text-slate-400">{item.date || "Date unavailable"}</p>
            <p className="mt-2 line-clamp-3 text-sm text-slate-300">{item.summary}</p>
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-cyan-300 hover:text-cyan-200"
              >
                View source
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
