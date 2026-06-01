"use client";

import Image from "next/image";
import Link from "next/link";

export type RelevantArticleCardProps = {
  title: string;
  imageUrl: string | null;
  imageAlt: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
  sizes?: string;
};

function mergeClasses(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function CardInner({
  title,
  imageUrl,
  imageAlt,
  priority,
  unoptimized,
  sizes,
}: Pick<
  RelevantArticleCardProps,
  "title" | "imageUrl" | "imageAlt" | "priority" | "unoptimized" | "sizes"
>) {
  return (
    <>
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            unoptimized={unoptimized}
            sizes={sizes ?? "(max-width: 640px) 50vw, 33vw"}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#e8dfd0] text-[10px] font-semibold uppercase tracking-widest text-[#9b9088]">
            No image
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 bg-[#977543] px-2 py-2 text-center sm:py-2.5">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-white sm:text-sm sm:leading-tight">
          {title}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-2.5 z-[1] flex justify-center sm:bottom-3.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#AE8953] px-3 py-1 text-[10px] font-semibold text-white shadow-sm sm:px-4 sm:py-1.5 sm:text-xs">
          Read Now
          <span aria-hidden>→</span>
        </span>
      </div>
    </>
  );
}

export function RelevantArticleCard({
  title,
  imageUrl,
  imageAlt,
  href,
  onClick,
  className,
  priority,
  unoptimized,
  sizes,
}: RelevantArticleCardProps) {
  const cardClassName = mergeClasses(
    "group relative block min-h-[250px] w-full overflow-hidden rounded-[14px] shadow-[4px_4px_4.1px_0_rgba(0,0,0,0.25)] sm:min-h-[332px] sm:rounded-[18px]",
    (href || onClick) && "cursor-pointer",
    className,
  );

  const inner = (
    <CardInner
      title={title}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      priority={priority}
      unoptimized={unoptimized}
      sizes={sizes}
    />
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={mergeClasses(cardClassName, "text-left")}>
        {inner}
      </button>
    );
  }

  return <article className={cardClassName}>{inner}</article>;
}
