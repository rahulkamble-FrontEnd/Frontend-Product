"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import styles from "./terms-and-conditions.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function TermsAndConditionsPage() {
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
            Terms and Conditions
          </span>
        </div>
      </div>

      <div className={styles.mainPage}>
        <div>
          <h2 className={styles.title}>Terms & Conditions</h2>
        </div>
        <div className={styles.paragraph}>
          Hinshitsu Manufacturing Pvt Ltd, the owner and operator of
          customfurnish.com (referred to as “we”, “us”, or “our”), provides
          access to this website (the “Website”) subject to the terms and
          conditions set out below. By accessing, browsing, or purchasing from
          this Website, you agree to comply with and be bound by these terms. If
          you do not agree to these terms, you should not use the Website.
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>1. Use of the Website</div>
          <div className={styles.paragraph}>
            By using this Website, you represent that you are of legal age to
            form a binding contract and are not a person barred from receiving
            services under the laws of India or other applicable jurisdictions.
          </div>
          <div className={styles.paragraph}>
            We reserve the right to modify or discontinue any feature or service
            provided by the Website without notice or liability.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>2. Product Information and Pricing</div>
          <div className={styles.paragraph}>
            We strive to provide accurate and up-to-date information on our
            products. However, product availability, pricing, and other details
            are subject to change without prior notice.
          </div>
          <div className={styles.paragraph}>
            If there is an error in the pricing or product information on the
            Website, we reserve the right to refuse or cancel any orders placed
            for such products, even after your order confirmation has been sent.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>3. Custom Orders and Quotations</div>
          <div className={styles.paragraph}>
            For custom furniture orders, a formal quotation will be provided
            after discussing your specific requirements. The quotation will
            contain more detailed terms and conditions applicable to the custom
            order, including pricing, delivery timelines, and modifications.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>4. Order Acceptance and Fulfillment</div>
          <div className={styles.paragraph}>
            We reserve the right to accept or reject your order at any time for
            any reason. Order confirmations are subject to stock availability,
            correct pricing, and product details.
          </div>
          <div className={styles.paragraph}>
            If for any reason, we cannot fulfill your order, we will notify you
            promptly and refund any payments made.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>5. Delivery and Shipping</div>
          <div className={styles.paragraph}>
            We offer delivery to your doorstep. Delivery fees, if applicable,
            will be mentioned during the checkout process or included in your
            formal quotation.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>6. Intellectual Property</div>
          <div className={styles.paragraph}>
            All content on the Website, including but not limited to text,
            images, logos, and software, is the intellectual property of
            CustomFurnish.com or its suppliers and is protected by copyright
            laws. You may not reproduce, distribute, modify, or exploit the
            Website’s content without prior written permission from us.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>7. Trademarks</div>
          <div className={styles.paragraph}>
            Customfurnish.com, its logo, and any other trademarks displayed on
            the Website are our property or the property of our affiliates and
            partners. Any use of these trademarks without our permission is
            prohibited.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>8. External Links</div>
          <div className={styles.paragraph}>
            This Website may contain links to third-party websites or services
            that are not owned or controlled by customfurnish.com. We are not
            responsible for the content, privacy policies, or practices of any
            third-party websites.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>9. Liability Disclaimer</div>
          <div className={styles.paragraph}>
            Customfurnish.com will not be liable for any direct, indirect,
            incidental, or consequential damages arising out of your use of the
            Website. Your sole remedy is to discontinue using the Website.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>10. Governing Law and Jurisdiction</div>
          <div className={styles.paragraph}>
            These terms and conditions are governed by and construed in
            accordance with the laws of India. Any disputes arising from or
            related to your use of the Website shall be subject to the exclusive
            jurisdiction of the courts in Hyderabad, Telangana.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>11. Modifications to Terms</div>
          <div className={styles.paragraph}>
            We reserve the right to modify these terms and conditions at any
            time without prior notice. It is your responsibility to review the
            most current version of these terms each time you use the Website.
          </div>
        </div>

        <div className={styles.paraContainer}>
          <div className={styles.paraHeading}>12. Contact Information</div>
          <div className={styles.paragraph}>
            If you have any questions or concerns regarding these terms and
            conditions, please contact us at wecare@customfurnish.com
          </div>
        </div>
      </div>
    </div>
  );
}
