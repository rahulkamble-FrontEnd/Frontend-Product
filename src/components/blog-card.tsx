"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useCallback } from "react";

export type BlogCardDisplay = {
  id: string;
  href: string;
  title: string;
  preview: string;
  dateLabel: string;
  status: string;
  imageUrl: string | null;
  imageAlt: string;
  imageTitle?: string;
  priority: boolean;
  eagerLoad: boolean;
};

type BlogCardProps = {
  card: BlogCardDisplay;
  imageFailed: boolean;
  onImageError: (id: string) => void;
};

function BlogCard({ card, imageFailed, onImageError }: BlogCardProps) {
  const canRenderImage = Boolean(card.imageUrl) && !imageFailed;

  const handleImageError = useCallback(() => {
    onImageError(card.id);
  }, [card.id, onImageError]);

  return (
    <Link
      href={card.href}
      className="block w-[min(82vw,280px)] shrink-0 snap-start overflow-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(41,35,30,0.08)] [content-visibility:auto] [contain-intrinsic-size:280px_360px] sm:w-auto sm:shrink"
    >
      <div className="relative h-40 w-full bg-[#f1ede8] sm:h-56">
        {canRenderImage ? (
          <Image
            src={card.imageUrl!}
            alt={card.imageAlt}
            title={card.imageTitle}
            fill
            priority={card.priority}
            loading={card.eagerLoad ? "eager" : "lazy"}
            unoptimized
            sizes="(max-width: 640px) 280px, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b1a79f]">
            No Image
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9b9088]">
          <span>{card.dateLabel}</span>
          <span className="rounded-full bg-[#f3eee7] px-2.5 py-0.5 text-[#7c716a]">{card.status}</span>
        </div>
        <h2 className="line-clamp-2 text-[20px] font-semibold leading-[1.2] text-[#302824] sm:text-[27px] sm:leading-[1.15]">
          {card.title}
        </h2>
        <p className="line-clamp-3 text-[13px] leading-5 text-[#7a7069] sm:text-sm sm:leading-6">
          {card.preview || "No blog content added yet."}
        </p>
      </div>
    </Link>
  );
}

export default memo(BlogCard);
