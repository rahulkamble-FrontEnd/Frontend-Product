"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import styles from "./faqs.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

type FaqItem = {
  question: string;
  answer: string;
};

const questions: FaqItem[] = [
  {
    question: "What is CF Studio?",
    answer:
      "CF Studio is CustomFurnish's exclusive online material selection platform, designed to make your interior design journey easier and more convenient.\n\nIt showcases the wide range of products, materials, finishes, colours, textures, hardware and accessories available at CustomFurnish, allowing you to explore the options and select what best suits your home.\n\nYou can browse the entire collection from the comfort of your home, at any time, compare different styles and shortlist your preferences before meeting your designer.",
  },
  {
    question: "How does CF Studio make the selection process easier?",
    answer:
      "Instead of spending hours browsing through physical catalogues at our Experience Centre, you can explore the available options online and shortlist the materials and finishes you like.\n\nYour selections will be shared with your CustomFurnish designer, who will guide you through the shortlisted options and help you make the right choices for your home. You can view the physical samples of your shortlisted items at our Experience Centre before making your final selections.\n\nThis saves time and makes your design meetings more focused, efficient and productive.",
  },
  {
    question: "Does CF Studio display prices for materials and finishes?",
    answer:
      "No. CF Studio is a material exploration and selection platform, not a pricing or quotation tool.\n\nOnce your materials and finishes are finalized with your designer, they will be incorporated into your 3D designs using our design software.\n\nThe applicable pricing will then be calculated automatically, and an updated quotation will be generated based on your finalized designs, materials and specifications.",
  },
];

function formatNumber(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function renderAnswer(answer: string) {
  const paragraphs = answer
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>);
}

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

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
            FAQs
          </span>
        </div>
      </div>

      <div className={styles.sub}>
        <h1 className={styles.mainHeading}>
          Frequently Asked Questions &ndash; CustomFurnish.com
        </h1>

        <div className={styles.contentWrapper}>
          {questions.map((item, i) => {
            const isOpen = openIndex === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <div key={i} className={styles.panel}>
                <button
                  id={buttonId}
                  type="button"
                  className={styles.panelHeader}
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <div className={styles.headerSec}>
                    <span
                      className={`${styles.number} ${
                        isOpen ? styles.numberActive : styles.numberInactive
                      }`}
                    >
                      {formatNumber(i + 1)}
                    </span>
                    <span
                      className={
                        isOpen ? styles.heading : styles.inactiveHeading
                      }
                    >
                      {item.question}
                    </span>
                  </div>
                  <span
                    className={`${styles.toggleIcon} ${
                      isOpen ? "" : styles.toggleIconInactive
                    }`}
                    aria-hidden="true"
                  >
                    {isOpen ? "\u2212" : "+"}
                  </span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                  className={`${styles.panelBody} ${
                    isOpen ? styles.panelBodyOpen : ""
                  }`}
                >
                  {renderAnswer(item.answer)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
