"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCT_IMAGE_BASE_URL } from "@/lib/s3-image-base";

/** S3 object names under `video/` (must match bucket keys exactly, in both prod and test buckets). */
const HOME_VIDEO_FILES = [
  "1.mp4",
  "2.mp4",
  "3.mp4",
  "4.mp4",
  "5.mp4",
  "6.mp4",
  "7.mp4",
  "8.mp4",
  "9.mp4",
  "10.mp4",
];

function homeVideoUrl(fileName: string) {
  return `${PRODUCT_IMAGE_BASE_URL}/video/${encodeURIComponent(fileName)}`;
}

const HOME_VIDEOS = HOME_VIDEO_FILES.map((file, index) => ({
  key: file,
  url: homeVideoUrl(file),
  label: `Home done by CustomFurnish ${index + 1}`,
}));

function wrapVideoIndex(index: number) {
  const total = HOME_VIDEOS.length;
  return ((index % total) + total) % total;
}

export function HomesDoneVideos() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  const showVideo = (index: number) => setActiveIndex(wrapVideoIndex(index));

  const isOpen = activeIndex !== null;
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((i) => (i === null ? i : wrapVideoIndex(i - 1)));
      if (event.key === "ArrowRight") setActiveIndex((i) => (i === null ? i : wrapVideoIndex(i + 1)));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (HOME_VIDEOS.length === 0) return null;

  const activeVideo = activeIndex !== null ? HOME_VIDEOS[activeIndex] : null;

  return (
    <>
      <section className="bg-[#F8F0E4] py-10 sm:py-12">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-12 lg:px-16 2xl:px-20">
          <div className="relative mb-6">
            <div className="mx-auto max-w-[1449px] text-center">
              <h3 className="text-[24px] font-bold leading-[30px] text-[#977543] sm:text-[36px] sm:leading-[40px]">
                Homes done by CustomFurnish
              </h3>
              <p className="mt-2 text-xs text-[#8B6E46] sm:text-sm">
                Take a walkthrough of homes we have delivered.
              </p>
            </div>
            <div className="mt-3 flex justify-end gap-2 sm:absolute sm:bottom-0 sm:right-0 sm:mt-0 sm:top-1/2 sm:-translate-y-1/2">
              <button
                type="button"
                onClick={() => scroll("left")}
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#9f7a47] text-white aspect-square hover:bg-[#8A6A3A] transition-colors sm:h-10 sm:w-10"
                aria-label="Scroll home videos left"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#9f7a47] text-white aspect-square hover:bg-[#8A6A3A] transition-colors sm:h-10 sm:w-10"
                aria-label="Scroll home videos right"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="mx-auto mt-6 flex w-full max-w-[1449px] gap-3 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-8 sm:gap-5"
          >
            {HOME_VIDEOS.map((video, index) => (
              <article
                key={video.key}
                className="group relative h-[230px] w-[170px] flex-shrink-0 cursor-pointer overflow-hidden rounded-[20px] bg-[#585858] shadow-[0_6px_14px_rgba(0,0,0,0.18)] sm:h-[320px] sm:w-[248px] sm:rounded-[28px]"
                onClick={() => showVideo(index)}
                onMouseEnter={(event) => {
                  const el = event.currentTarget.querySelector("video");
                  el?.play().catch(() => undefined);
                }}
                onMouseLeave={(event) => {
                  const el = event.currentTarget.querySelector("video");
                  if (!el) return;
                  el.pause();
                  el.currentTime = 0.1;
                }}
              >
                <video
                  src={`${video.url}#t=0.1`}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={video.label}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white sm:h-14 sm:w-14">
                    <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeVideo && activeIndex !== null && (
        <div
          className="fixed inset-0 z-[720] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setActiveIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeVideo.label}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl bg-white p-2 sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xl leading-none text-white transition hover:bg-black/75"
              aria-label="Close video"
            >
              ×
            </button>
            {HOME_VIDEOS.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => showVideo(activeIndex - 1)}
                  className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#9f7a47] text-white shadow-md transition hover:bg-[#8A6A3A] sm:left-5 sm:h-12 sm:w-12"
                  aria-label="Previous video"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => showVideo(activeIndex + 1)}
                  className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#9f7a47] text-white shadow-md transition hover:bg-[#8A6A3A] sm:right-5 sm:h-12 sm:w-12"
                  aria-label="Next video"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>
            ) : null}
            <div className="relative h-[55vh] w-full overflow-hidden rounded-xl bg-black sm:h-[78vh]">
              <video
                key={activeVideo.key}
                src={activeVideo.url}
                controls
                autoPlay
                playsInline
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
