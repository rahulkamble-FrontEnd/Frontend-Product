"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import styles from "./privacy-policy.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
            Privacy Policy
          </span>
        </div>
      </div>

      <div className={styles.mainPage}>
        <div>
          <h2 className={styles.title}>Privacy Policy</h2>
        </div>
        <div className={styles.paragraph}>
          At CustomFurnish, we are committed to making your shopping experience
          comfortable, safe, and convenient. Protecting your privacy is one of
          our top priorities. Our Privacy Policy explains how we collect, use,
          and protect your personal information.
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>1. Information We Collect</div>
          <div className={styles.paragraph}>
            When you visit our site, we collect information from you when you
            register, place an order, subscribe to newsletters, or fill out
            forms. Information such as your name, email, address, and phone
            number may be collected. You may browse our site anonymously as
            well.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>2. How We Use Your Information</div>
          <div className={styles.subHeading}>
            We use the information we collect to:
          </div>
          <div className={styles.paragraph}>
            <ul className={styles.bulletPoints}>
              <li>Process your orders and deliver products.</li>
              <li>Personalize your shopping experience.</li>
              <li>Improve our website based on feedback.</li>
              <li>
                Send you updates, promotions, and relevant information about our
                products.
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>3. Protecting Your Information</div>
          <div className={styles.paragraph}>
            We implement secure protocols to protect your personal data,
            including SSL encryption to safeguard your sensitive information
            during transactions. Your payment details are handled through secure
            third-party gateways, and we do not store payment data on our
            servers after the transaction is completed.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>4. Cookies</div>
          <div className={styles.paragraph}>
            We use cookies to enhance your experience, manage your shopping
            cart, and collect anonymous data about site traffic. You can choose
            to disable cookies through your browser settings, but doing so may
            limit your access to certain features of our website.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>5. Sharing Your Information</div>
          <div className={styles.paragraph}>
            We do not sell or trade your personal information. Your data may be
            shared with trusted partners who assist in processing orders,
            payments, and deliveries. These partners are contractually obliged
            to maintain the confidentiality of your data.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>6. Your Rights</div>
          <div className={styles.paragraph}>
            Depending on your region, you may have rights to access, correct, or
            delete your personal data. To exercise these rights, please contact
            us at wecare@customfurnish.com. We will respond to such requests
            within the legal timeframes.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>7. Data Retention</div>
          <div className={styles.paragraph}>
            We retain your information as long as necessary to fulfill your
            requests and manage our business operations. You may request
            deletion of your data at any time by contacting us.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>8. Third-Party Links</div>
          <div className={styles.paragraph}>
            Our website may include links to third-party sites. We are not
            responsible for the content or privacy practices of these external
            sites.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>9. Liability Disclaimer</div>
          <div className={styles.paragraph}>
            CustomFurnish.com makes every effort to ensure the privacy and
            security of the information you provide. However, we cannot
            guarantee that unauthorized access, hacking, data loss, or other
            breaches will never occur. By using our website, you agree that
            CustomFurnish.com shall not be held liable for any direct, indirect,
            incidental, consequential, or punitive damages, including but not
            limited to:
          </div>
          <ul className={styles.bulletPoints}>
            <li>
              Unauthorized access to your personal information or the misuse of
              your data.
            </li>
            <li>
              Interruptions, bugs, errors, or omissions that affect the
              functionality of the website.
            </li>
            <li>Issues resulting from third-party links or advertisements on the site.</li>
          </ul>
          <div className={styles.paragraph}>
            We strive to maintain the highest security standards, but users
            acknowledge that they use the website at their own risk.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>10. Updates to the Policy</div>
          <div className={styles.paragraph}>
            We reserve the right to modify this policy. Any changes will be
            reflected on this page. Please review periodically to stay informed
            about how we are protecting your information.
          </div>
          <div className={styles.paragraph} style={{ display: "flex" }}>
            <div style={{ fontWeight: 600, paddingRight: "5px" }}>
              Contact Us
            </div>
            <div>
              For questions regarding this policy, please contact us at
              wecare@customfurnish.com.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
