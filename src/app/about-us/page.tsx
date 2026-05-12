"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Montserrat } from "next/font/google";
import styles from "./about-us.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600"],
});

const S3 = "https://s3-ap-southeast-1.amazonaws.com/kustommadecmp";

const achievements = [
  { imgUrl: "/images/about-us/achievements-1.webp" },
  { imgUrl: "/images/about-us/achievements-2.webp" },
];

export default function AboutUsPage() {
  const [popupIndex, setPopupIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const close = useCallback(() => setPopupIndex(null), []);
  const next = useCallback(
    () =>
      setPopupIndex((i) =>
        i === null ? 0 : (i + 1) % achievements.length,
      ),
    [],
  );
  const prev = useCallback(
    () =>
      setPopupIndex((i) =>
        i === null ? 0 : (i - 1 + achievements.length) % achievements.length,
      ),
    [],
  );

  useEffect(() => {
    if (popupIndex === null) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [popupIndex, close, next, prev]);

  return (
    <div className={`${jakarta.className} ${styles.container}`}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>
          <Link className={styles.headerText} href="/">
            Home
          </Link>
          <span className={styles.headerText}>/</span>
          <span
            className={styles.headerText}
            style={{ fontWeight: 600, color: "var(--text-primary)" }}
          >
            About Us
          </span>
        </div>
      </div>

      <div>
        <div className={styles.aboutSection}>
          <div className={styles.aboutContent}>
            <h3 className={styles.aboutHeadingTxt}>About Us</h3>
            <p className={styles.aboutContentTxt}>
              At <span style={{ fontWeight: 700 }}>CustomFurnish</span>, we are
              dedicated to transforming your living spaces with our
              comprehensive range of interior solutions. Our offerings include
              full house interiors, modular kitchens, wardrobes, retrofit
              kitchens, and false ceilings, all designed to meet your unique
              style and functional needs. We also provide services such as
              wooden flooring and wallpapers to add the perfect finishing
              touches to your home. Our commitment to quality and customer
              satisfaction is evident in every project we undertake, ensuring
              that your home reflects your personal taste and lifestyle.
            </p>
          </div>
          <div className={styles.aboutImage}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${S3}/images/about-us/showroom.webp`}
              alt="Living Room"
            />
          </div>
        </div>
      </div>

      <div>
        <div className={styles.excellenceSection}>
          <h1
            className={`${montserrat.className} ${styles.discoverSectionHeader}`}
          >
            Crafting Excellence: A Look Inside Our Factory
          </h1>
          <div className={`${styles.discoverContainer} ${styles.reverse}`}>
            <div className={styles.discoverContent}>
              <p className={styles.discoverContentTxt}>
                At <span style={{ fontWeight: 700 }}>CustomFurnish</span>, we
                are among the few interior design firms with an{" "}
                <span style={{ fontWeight: 700 }}>
                  in-house manufacturing facility
                </span>
                , ensuring superior quality and faster delivery. Unlike others
                who outsource, we control every step of production.{" "}
                <span style={{ fontWeight: 700 }}>
                  For Hyderabad customers, we offer some of the lowest prices
                </span>
                , thanks to reduced transportation costs from our local
                factory. Plus, we use{" "}
                <span style={{ fontWeight: 700 }}>
                  premium BWP (Boiling Water Proof) plywood
                </span>
                , ensuring durability and water resistance—something most
                competitors don&rsquo;t offer.{" "}
                <span style={{ fontWeight: 700 }}>
                  Watch our factory video
                </span>{" "}
                to see how we bring your interiors to life with cutting-edge
                technology and craftsmanship.
              </p>
            </div>
            <div className={styles.youtubeCard}>
              <iframe
                src="https://www.youtube.com/embed/koMk-HIOYYE"
                title="A Look Inside Our Factory"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className={styles.discoverSection}>
          <h1
            className={`${montserrat.className} ${styles.discoverSectionHeader}`}
          >
            Discover MyDeziner
          </h1>
          <div className={`${styles.discoverContainer} ${styles.reverse}`}>
            <div className={styles.youtubeCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.mydezinerImg}
                src={`${S3}/images/about-us/mydeziner.webp`}
                alt="MyDeziner"
              />
            </div>
            <div className={styles.discoverContent}>
              <p className={styles.discoverContentTxt}>
                Imagine designing your interiors with just a few clicks!{" "}
                <span style={{ fontWeight: 700 }}>MyDeziner</span> is our
                revolutionary <span style={{ fontWeight: 700 }}>3D</span>{" "}
                design platform that empowers you to visualize and customize
                your space in real time. Whether you&rsquo;re selecting
                furniture, experimenting with color combinations, or arranging
                layouts, MyDeziner offers an intuitive and immersive
                experience. With a vast library of designs and customization
                options, you can see your dream space take shape before making
                a purchase. Say goodbye to guesswork and hello to confident,
                hassle-free home design!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className={styles.achievementsSection}>
          <h1
            className={`${montserrat.className} ${styles.achievementsHeader}`}
          >
            Our Achievements &amp; Recognitions
          </h1>
          <div className={styles.achievementsImage}>
            {achievements.map((achievement, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={`${S3}${achievement.imgUrl}`}
                alt="Achievements"
                onClick={() => setPopupIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {popupIndex !== null && (
        <div
          className={styles.lightboxOverlay}
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            className={styles.lightboxClose}
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
          <button
            className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous"
            type="button"
          >
            &#8249;
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.lightboxImg}
            src={`${S3}${achievements[popupIndex].imgUrl}`}
            alt="Achievement"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className={`${styles.lightboxNav} ${styles.lightboxNext}`}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next"
            type="button"
          >
            &#8250;
          </button>
        </div>
      )}
    </div>
  );
}
