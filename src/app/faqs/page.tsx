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

// Same content as cf-angular-web/src/app/home/static items/frequently-asked-questions.ts
const questions: FaqItem[] = [
  {
    question: "What services does CustomFurnish.com offer?",
    answer:
      "We provide complete home interior solutions, including modular kitchens, wardrobes, custom furniture, space planning, and personalized design services.",
  },
  {
    question: "What makes CustomFurnish different from others?",
    answer:
      "We offer factory-to-home interiors, ensuring premium quality, cost-efficiency, and fast turnaround \u2014 including 21-day delivery on modular projects and full support covered under warranty.",
  },
  {
    question: "What is the 21-day delivery promise?",
    answer:
      "Once your design is approved by you and your site is ready for the interior work, we ensure installation within 21 working days for modular interiors \u2014 thanks to our in-house manufacturing and streamlined processes.",
  },
  {
    question: "What does \u201CFactory-to-Direct Interiors\u201D mean?",
    answer:
      "It means your interiors are built in our own factory \u2014 no middlemen, no delays. You get better prices, consistent quality, and faster delivery.",
  },
  {
    question: "How does the CustomFurnish design process work?",
    answer:
      "Our process includes:\n Free design consultation\n Site visit & measurement\n 3D design proposals\n Design finalization\n Manufacturing & installation",
  },
  {
    question: "Is the design customizable?",
    answer:
      "Yes! All our modular furniture, layouts, and finishes are fully customizable to suit your space, lifestyle, and budget.",
  },
  {
    question: "How much do home interiors cost?",
    answer:
      "The cost depends on the size of your home, scope of work, and materials selected. We share a clear and itemized estimate after your consultation.",
  },
  {
    question: "Can I get a free design consultation?",
    answer:
      "Yes, absolutely. Book a free consultation through our website and one of our expert designers will get in touch with you.",
  },
  {
    question: "Do you have experience centers I can visit?",
    answer:
      "Yes, our experience center is located in Hyderabad where you can explore material samples, finishes, and complete mock-ups of kitchens, wardrobes, and living spaces.",
  },
  {
    question: "In which cities do you operate?",
    answer:
      "We currently serve Hyderabad and nearby areas. If you're unsure, feel free to reach out and confirm service availability in your location.",
  },
  {
    question: "Who will manage my project?",
    answer:
      "Every project is assigned a dedicated project manager who will guide you through each step and ensure smooth execution.",
  },
  {
    question: "Do you handle both design and execution?",
    answer:
      "Yes, we offer end-to-end solutions \u2014 from interior design and space planning to manufacturing, delivery, and installation.",
  },
  {
    question: "What payment options are available?",
    answer: "We accept bank transfers, credit/debit cards, and UPI payments.",
  },
  {
    question: "What support do I get after installation?",
    answer:
      "You get full post-installation support including servicing, repairs (if needed), and assistance covered during the warranty period",
  },
];

function formatNumber(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function renderAnswer(answer: string) {
  if (answer.includes("\n")) {
    const lines = answer.split("\n");
    const [heading, ...rest] = lines;
    return (
      <div>
        <strong>{heading}</strong>
        <ul>
          {rest.map((line, i) => (
            <li key={i}>{line.trim()}</li>
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
