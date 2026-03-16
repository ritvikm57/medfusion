"use client";

// Alert feed card.
// Why: surfaces latest outbreak narratives from RSS/scraped alert sources.

export default function AlertFeed({ title = "Alerts", items = [], loading = false }) {
  if (loading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-slate-800/70" />;
  }

  if (!items?.length) {
    return <div className="rounded-2xl border border-slate-800 p-4 text-slate-300">Alert data unavailable.</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-lg font-semibold text-cyan-200">{title}</h3>
      <div className="max-h-72 space-y-3 overflow-auto pr-1">
        {items.map((item, index) => (
          <article key={`${item?.link || item?.title || "item"}-${index}`} className="rounded-xl bg-slate-950/70 p-3">
            <h4 className="text-sm font-semibold text-slate-100">{item?.title || "Untitled alert"}</h4>
            <p className="mt-1 text-xs text-slate-400">{item?.pubDate || "Date unavailable"}</p>
            <p className="mt-2 line-clamp-3 text-sm text-slate-300">{item?.description || "No summary."}</p>
            {item?.link ? (
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
