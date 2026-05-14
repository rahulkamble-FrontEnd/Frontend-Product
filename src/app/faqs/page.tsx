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
    question: "What is CustomFurnish Materials?",
    answer:
      "CustomFurnish Materials is a platform where customers can explore premium interior materials, finishes, and design products for their home interiors.",
  },
  {
    question: "Can I purchase materials directly from the website?",
    answer:
      "No, materials cannot be purchased directly from the website. Customers can explore and select materials, and our interior design team will include them in the final interior quotation.",
  },
  {
    question: "How does the material selection process work?",
    answer:
      "Customers can browse materials, finishes, colors, and design options on the website. Once selected, our interior designers will assist in finalizing the materials for the project.",
  },
  {
    question: "Will the selected materials be included in the interior quotation?",
    answer:
      "Yes, the selected materials and finishes will be discussed with our design team and added to the final project quotation.",
  },
  {
    question: "Can I customize materials for my interiors?",
    answer:
      "Yes, customers can choose materials based on their design preferences, interior style, and budget requirements.",
  },
  {
    question: "Do you provide assistance in choosing materials?",
    answer:
      "Yes, our interior designers help customers select suitable materials based on functionality, aesthetics, and space requirements.",
  },
  {
    question: "Can I visit the experience centre to check materials physically?",
    answer:
      "Yes, customers can visit our Hyderabad experience centre to explore material samples and finish collections.",
  },
  {
    question: "What types of materials are available on the website?",
    answer:
      "We showcase laminates, wall decorative panels, flooring materials, hardware, lighting, glass, mirrors, fabrics, and premium interior finishes.",
  },
  {
    question: "Are the materials suitable for luxury home interiors?",
    answer:
      "Yes, our collections are carefully selected for modern, premium, and luxury residential interiors.",
  },
  {
    question: "Do you provide complete interior design services along with materials?",
    answer:
      "Yes, CustomFurnish provides complete customized home interior solutions along with material selection and execution.",
  },
  {
    question: "Can I get guidance from an interior designer after selecting materials?",
    answer:
      "Yes, our design team will coordinate with customers and suggest suitable combinations and finishes for the project.",
  },
  {
    question: "Where is your experience centre located?",
    answer:
      "Our Hyderabad experience centre is located at:\nPlot No - 190, Professor CR Rao Road, Opposite Old ALIND Factory Entrance Gate, Doyens Colony, Serilingampalle (M), Telangana - 500019.",
  },
  {
    question: "How can I contact CustomFurnish?",
    answer:
      "You can contact us through phone, email, or by visiting our experience centre during working hours.",
  },
  {
    question: "What are your working hours?",
    answer:
      "Our working hours are Monday to Saturday, from 10:00 AM to 7:00 PM.",
  },
];

function formatNumber(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function renderAnswer(answer: string) {
  if (answer.includes("\n")) {
    const lines = answer
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const [first, ...rest] = lines;
    if (
      rest.length === 1 &&
      first.endsWith(":") &&
      rest[0].length > 80
    ) {
      return (
        <>
          <p>{first}</p>
          <p>{rest[0]}</p>
        </>
      );
    }
    return (
      <div>
        <strong>{first}</strong>
        <ul>
          {rest.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    );
  }
  return <p>{answer}</p>;
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
