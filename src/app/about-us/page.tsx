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
            <p className={styles.aboutTagline}>
              Redefining Modern Interior Material Selection
            </p>
            <p className={styles.aboutContentTxt}>
              <span style={{ fontWeight: 700 }}>CustomFurnish Materials</span>{" "}
              is a curated platform designed to help homeowners explore premium
              interior materials, finishes, and modern design solutions for
              customized home interiors.
            </p>
            <p className={styles.aboutContentTxt}>
              From laminates, wall decorative panels, flooring, lighting, glass,
              mirrors, hardware, and premium finishes to modern decorative
              solutions, we showcase carefully selected interior materials
              suitable for contemporary and luxury living spaces.
            </p>
            <p className={styles.aboutContentTxt}>
              Our platform simplifies the material selection process by helping
              customers discover, compare, and shortlist materials for their
              dream home interiors. Once materials are selected, our interior
              design team assists in integrating them into the final interior
              design quotation and execution process.
            </p>
            <p className={styles.aboutContentTxt}>
              At CustomFurnish, we believe the right materials play a major role
              in creating elegant, functional, and timeless interiors. Every
              collection is selected with a focus on quality, aesthetics,
              durability, and modern design trends.
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
            Our Manufacturing Facility
          </h1>
          <div className={`${styles.discoverContainer} ${styles.reverse}`}>
            <div className={styles.discoverContent}>
              <p className={styles.discoverContentTxt}>
                One of the biggest strengths of CustomFurnish is our in-house
                manufacturing capability. Our factory infrastructure helps us
                maintain better quality control, customized production, and
                seamless execution for interior projects.
              </p>
              <p className={styles.discoverContentTxt}>
                With advanced manufacturing processes and skilled craftsmanship,
                we ensure that every interior element is developed with
                precision, consistency, and premium finishing standards.
              </p>
              <p className={styles.discoverContentTxt}>
                Our manufacturing support allows us to:
              </p>
              <ul className={styles.contentList}>
                <li>Deliver customized interior solutions</li>
                <li>Maintain premium quality standards</li>
                <li>Ensure better material finishing</li>
                <li>Reduce execution delays</li>
                <li>Provide design flexibility for customers</li>
              </ul>
              <p className={styles.discoverContentTxt}>
                This combination of design expertise and manufacturing capability
                helps us deliver interiors that are modern, functional, and
                personalized to customer requirements.
              </p>
            </div>
            <div className={styles.youtubeCard}>
              <iframe
                src="https://www.youtube.com/embed/koMk-HIOYYE"
                title="Our manufacturing facility"
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
            What We Offer
          </h1>
          <ul className={`${styles.contentList} ${styles.contentListTwoCol}`}>
                <li>Premium interior material collections</li>
                <li>Modern finishes and decorative solutions</li>
                <li>Flooring and wall decorative materials</li>
                <li>Lighting, glass, and mirror collections</li>
                <li>Hardware and interior accessories</li>
                <li>Material inspiration for modern homes</li>
                <li>Customized material selection assistance</li>
                <li>End-to-end interior execution support</li>
              </ul>
              <h2 className={styles.discoverSubheading}>
                Why Choose CustomFurnish
              </h2>
          <div className={styles.discoverContainer}>
            <div className={styles.discoverContent}>
              <p className={styles.discoverContentTxt}>
                <span className={styles.reasonTitle}>
                  Premium Material Collections
                </span>
                We showcase carefully curated interior materials designed for
                modern and luxury homes.
              </p>
              <p className={styles.discoverContentTxt}>
                <span className={styles.reasonTitle}>Expert Design Guidance</span>
                Our experienced interior designers help customers choose suitable
                materials based on design style, functionality, and budget.
              </p>
              <p className={styles.discoverContentTxt}>
                <span className={styles.reasonTitle}>Customized Solutions</span>
                Every home is unique, and we focus on providing personalized
                material and design recommendations.
              </p>
              <p className={styles.discoverContentTxt}>
                <span className={styles.reasonTitle}>Modern Design Approach</span>
                We stay updated with evolving interior trends, finishes, and
                contemporary material innovations.
              </p>
              <p className={styles.discoverContentTxt}>
                <span className={styles.reasonTitle}>Seamless Execution</span>
                From material selection to final execution, our team ensures a
                smooth and organized interior journey.
              </p>
            </div>
            <div className={styles.whyChooseImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about-us.png"
                alt="CustomFurnish design consultation with material samples"
              />
            </div>
          </div>

          <div className={styles.visionSection}>
            <h2 className={styles.visionHeading}>Our Vision</h2>
            <div className={styles.visionBlock}>
              <p className={styles.visionText}>
                Our vision is to simplify interior material discovery and help
                homeowners create beautiful living spaces with the right
                combination of premium materials, thoughtful design, and expert
                craftsmanship.
              </p>
              <p className={styles.visionText}>
                We aim to make modern interior solutions more accessible,
                inspiring, and customer-focused through innovation, quality, and
                design excellence.
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
