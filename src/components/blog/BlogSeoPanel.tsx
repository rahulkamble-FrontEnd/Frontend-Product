"use client";

import { useMemo } from "react";
import { analyzeBlogSeo } from "@/lib/seo-score";
import { blogPublicPath } from "@/lib/blog-path";
import type { BlogItem } from "@/lib/api";

type Props = {
  title: string;
  metaDescription: string;
  bodyHtml: string;
  focusKeyword: string;
  previewBlog?: Pick<BlogItem, "slug" | "category"> | null;
};

function hasMeaningfulText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length > 0;
}

export function BlogSeoPanel({ title, metaDescription, bodyHtml, focusKeyword, previewBlog }: Props) {
  const analysis = useMemo(
    () => analyzeBlogSeo({ title, metaDescription, bodyHtml, focusKeyword }),
    [title, metaDescription, bodyHtml, focusKeyword]
  );
  const isPristine = !title.trim() && !metaDescription.trim() && !focusKeyword.trim() && !hasMeaningfulText(bodyHtml);

  const previewPath = previewBlog ? blogPublicPath(previewBlog) : null;

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500">SEO snapshot</h3>
      </div>

      {previewPath && (
        <p className="break-all text-xs text-gray-600">
          <span className="font-bold text-gray-500">Public URL: </span>
          <span className="font-mono text-gray-800">{previewPath}</span>
        </p>
      )}

      <ul className="grid gap-1 text-xs text-gray-700 sm:grid-cols-2">
        <li>Words: <strong>{analysis.wordCount}</strong></li>
        <li>Meta length: <strong>{analysis.metaLength}</strong> chars</li>
        <li>Keyword in title: <strong>{analysis.keywordInTitle ? "Yes" : "No"}</strong></li>
        <li>Keyword in meta: <strong>{analysis.keywordInMeta ? "Yes" : "No"}</strong></li>
        <li>Keyword in body: <strong>{analysis.keywordInBody ? "Yes" : "No"}</strong></li>
        <li>Readability: <strong>{analysis.readabilityScore}</strong> — {analysis.readabilityLabel}</li>
      </ul>

      {!isPristine && analysis.issues.length > 0 && (
        <ul className="list-inside list-disc space-y-1 text-xs text-gray-600">
          {analysis.issues.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
