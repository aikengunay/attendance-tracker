"use client";

import { useState } from "react";

export function ExportDownloadButton({
  sectionId,
  sectionCode,
}: {
  sectionId: string;
  sectionCode: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);

  async function onDownload() {
    setLoading(true);
    setError(null);
    setMeta(null);
    try {
      const res = await fetch(`/api/sections/${sectionId}/export`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Export failed");
        return;
      }
      const blob = await res.blob();
      const disp = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disp);
      const filename = match?.[1] ?? `attendance-${sectionCode}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      const written = res.headers.get("X-Export-Written-Marks") ?? "?";
      const unmatched = res.headers.get("X-Export-Unmatched-Students") ?? "0";
      const dates = res.headers.get("X-Export-Unmatched-Dates") ?? "0";
      setMeta(
        `Wrote ${written} marks · ${unmatched} unmatched students · ${dates} unmatched dates` +
          (Number(unmatched) > 0 || Number(dates) > 0
            ? " (see _export_notes sheet)"
            : ""),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onDownload}
        disabled={loading}
        className="w-fit rounded bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Building workbook…" : "Download .xlsx"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {meta ? <p className="text-sm text-zinc-600">{meta}</p> : null}
    </div>
  );
}
