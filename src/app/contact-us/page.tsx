"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import styles from "./contact-us.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Google Maps embed for the Hyderabad showroom (same place ID + key as
// cf-angular-web/src/app/common/config.ts -> GOOGLE_API_KEY).
const SHOWROOM_PLACE_ID = "ChIJJ7hDUkWTyzsROE_a0XKyoGw";
const GOOGLE_MAPS_API_KEY = "AIzaSyBwTOnrNCB_ECtTRU4bGIJdyf8fp7AhdFY";
const SHOWROOM_EMBED_URL = `https://www.google.com/maps/embed/v1/place?q=place_id:${SHOWROOM_PLACE_ID}&key=${GOOGLE_MAPS_API_KEY}`;
const SHOWROOM_DIRECTIONS_URL =
  "https://www.google.com/maps/dir//CustomFurnish,+Plot+No+-+190,+Professor+CR+Rao+Rd,+opposite+Old+ALIND+Factory+Entrance+Gate,+Doyens+Colony,+Serilingampalle+(M),+Hyderabad,+Telangana+500019/";

// Submit through our own Next.js API route (src/app/api/contact-us/route.ts).
// That route does the cross-origin call to Django + handles CSRF/cookies on
// the server side, so the form works the same way from dev (localhost) and
// from any production domain without browser CORS blocking us.
const CONTACT_API_URL = "/api/contact-us";

// Same validation as cf-angular-web/src/app/home/components/contact-us-page.
const MOBILE_PATTERN = /^((\+91-?)|0)?[0-9]{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  name: string;
  email: string;
  mobile: string;
  location: string;
  message: string;
};

type TouchedState = Partial<Record<keyof FormState, boolean>>;

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const initialForm: FormState = {
  name: "",
  email: "",
  mobile: "",
  location: "",
  message: "",
};

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim()) errors.name = "full name is required";
  if (!form.email.trim()) errors.email = "email is required";
  else if (!EMAIL_PATTERN.test(form.email))
    errors.email = "please enter a vaild email";
  if (!form.mobile.trim()) errors.mobile = "phone number is required";
  else if (!MOBILE_PATTERN.test(form.mobile))
    errors.mobile = "please enter a valid phone number";
  if (!form.location.trim()) errors.location = "location is required";
  return errors;
}

const socialLinks = [
  {
    id: "IG",
    label: "Instagram",
    href: "https://www.instagram.com/customfurnish/",
  },
  { id: "FB", label: "Facebook", href: "https://www.facebook.com/customfurnish" },
  {
    id: "YT",
    label: "YouTube",
    href: "https://www.youtube.com/@Customfurnish",
  },
  {
    id: "LI",
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/customfurnish-official",
  },
  { id: "TW", label: "Twitter / X", href: "https://x.com/CustomFurnish1" },
  {
    id: "PT",
    label: "Pinterest",
    href: "https://www.pinterest.com/customfurnishin/",
  },
];

function SocialIcon({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    width: 22,
    height: 22,
  } as const;
  switch (id) {
    case "IG":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.2" />
        </svg>
      );
    case "FB":
      return (
        <svg {...common}>
          <path d="M14 8h2V5h-2a4 4 0 0 0-4 4v2H8v3h2v5h3v-5h2.3l.4-3H13V9a1 1 0 0 1 1-1z" />
        </svg>
      );
    case "YT":
      return (
        <svg {...common}>
          <rect x="2.5" y="6.5" width="19" height="11" rx="3" />
          <path d="m10 9 5 3-5 3z" />
        </svg>
      );
    case "LI":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M8 10v6" />
          <path d="M8 8h.01" />
          <path d="M12 16v-3a2 2 0 0 1 4 0v3" />
        </svg>
      );
    case "TW":
      return (
        <svg {...common}>
          <path d="M22 5.9c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2.1-.8.5-1.6.8-2.5 1-1.4-1.5-3.8-1.5-5.2 0-.8.8-1.2 2-1 3.1-3-.1-5.8-1.5-7.7-3.9-1 1.7-.5 3.9 1.1 5-.6 0-1.2-.2-1.7-.5 0 1.9 1.3 3.6 3.1 4-.5.1-1.1.2-1.6.1.5 1.6 2 2.8 3.7 2.8A7.6 7.6 0 0 1 3 17.6a10.8 10.8 0 0 0 5.8 1.7c7 0 10.8-5.8 10.8-10.8v-.5c.8-.5 1.5-1.2 2-2z" />
        </svg>
      );
    case "PT":
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 .1-2.9l1.2-5c-.2-.5-.4-1.2-.4-1.9 0-1.8 1-3.2 2.3-3.2 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.8-1 4.3-.3 1.2.6 2.1 1.8 2.1 2.2 0 3.9-2.3 3.9-5.6 0-2.9-2.1-4.9-5.1-4.9-3.5 0-5.5 2.6-5.5 5.3 0 1 .4 2.2 1 2.8.1.1.1.2.1.3l-.4 1.5c-.1.2-.2.3-.4.2-1.5-.6-2.4-2.6-2.4-4.2 0-3.4 2.5-6.6 7.1-6.6 3.7 0 6.6 2.7 6.6 6.3 0 3.7-2.3 6.8-5.6 6.8-1.1 0-2.2-.6-2.5-1.2l-.7 2.7c-.3 1-.9 2.1-1.3 2.9.9.3 1.8.5 2.8.5A10 10 0 1 0 12 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ContactUsPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] = useState<TouchedState>({});
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const errors = useMemo(() => validate(form), [form]);
  const isInvalid = Object.keys(errors).length > 0;
  const isSubmitting = status.kind === "submitting";

  const update =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };

  const onBlur = (field: keyof FormState) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const showError = (field: keyof FormState) =>
    touched[field] && errors[field];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      mobile: true,
      location: true,
      message: true,
    });
    if (isInvalid) return;

    setStatus({ kind: "submitting" });

    // Payload shape matches cf-angular-web/src/app/home/components/contact-us-page/
    // contact-us-page.component.ts -> submitForm() so the same Python
    // schedule-design-session endpoint can be reused as-is.
    const payload = {
      userName: form.name,
      userMail: form.email,
      phoneNumber: form.mobile,
      city: form.location,
      comments: form.message,
      isLandingPage: null,
    };

    try {
      const res = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Our local API route always returns JSON with { ok, error?, ... }.
      let body: { ok?: boolean; error?: string } = {};
      try {
        body = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        body = {};
      }

      if (!res.ok || body.ok === false) {
        throw new Error(
          body.error ||
            `Request failed with status ${res.status} ${res.statusText}`.trim(),
        );
      }

      // Matches the Angular success branch: reset form + show success toast.
      setForm(initialForm);
      setTouched({});
      setStatus({
        kind: "success",
        message:
          "Thank you for contacting us. We will get in touch with you within 24 hours.",
      });
    } catch (err) {
      // Matches the Angular error branch: showError(error.message).
      setStatus({
        kind: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Something went wrong. Please try again.",
      });
    }
  };

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
            Contact us
          </span>
        </div>
      </div>

      <div className={styles.sub}>
        <div className={styles.subContainer}>
          <div className={styles.commonContainer} style={{ gap: 36 }}>
            <h2 className={styles.title}>Contact us</h2>

            <div className={styles.commonContainer}>
              <div className={styles.heading}>
                Get in Touch with CustomFurnish
              </div>
              <div className={`${styles.commonText} ${styles.desc}`}>
                We&rsquo;re here to help you bring your dream interiors to
                life! Whether you have questions about our products, need
                design assistance, or want to visit our showroom, our team is
                ready to assist you.
              </div>
            </div>

            <div className={styles.commonContainer}>
              <div className={styles.heading}>Call Us</div>
              <div className={`${styles.commonText} ${styles.desc}`}>
                Need immediate assistance? Our customer support team is happy
                to help.
              </div>
              <span className={styles.contactLine}>
                Phone:{" "}
                <a href="tel:+919014324646" className={styles.contactText}>
                  +91 9014324646
                </a>
              </span>
              <span className={styles.contactLine}>
                Available:{" "}
                <span className={styles.contactTextStatic}>10 AM to 8 PM</span>
              </span>

              <div className={styles.heading} style={{ marginTop: 16 }}>
                Email Us
              </div>
              <div className={`${styles.commonText} ${styles.desc}`}>
                Have a query? Drop us an email, and we&rsquo;ll get back to
                you as soon as possible.
              </div>
              <span className={styles.contactLine}>
                <span className={styles.bussinessText}>For Business</span>{" "}
                Partnerships:{" "}
                <a
                  href="mailto:marketing@customfurnish.com"
                  className={styles.contactText}
                >
                  marketing@customfurnish.com
                </a>
              </span>
              <span className={styles.contactLine}>
                For Careers:{" "}
                <a
                  href="mailto:careers@customfurnish.com"
                  className={styles.contactText}
                >
                  careers@customfurnish.com
                </a>
              </span>
              <span className={styles.contactLine}>
                For Others:{" "}
                <a
                  href="mailto:wecare@customfurnish.com"
                  className={styles.contactText}
                >
                  wecare@customfurnish.com
                </a>
              </span>

              <div className={styles.commonContainer} style={{ marginTop: 16 }}>
                <div className={styles.heading}>Follow us on Social Media</div>
                <div className={`${styles.commonText} ${styles.desc}`}>
                  Stay updated on our latest collections, offers, and interior
                  design tips!
                </div>
                <div className={styles.iconsContainer}>
                  {socialLinks.map((s) => (
                    <a
                      key={s.id}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                    >
                      <span className={styles.socialMediaBtn}>
                        <SocialIcon id={s.id} />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form
            className={styles.commonContainer}
            onSubmit={handleSubmit}
            noValidate
          >
            <div className={styles.formContainer}>
              <span className={styles.labelText}>Full Name *</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Enter full name"
                value={form.name}
                onChange={update("name")}
                onBlur={onBlur("name")}
                aria-invalid={Boolean(showError("name"))}
              />
              {showError("name") && (
                <div className={styles.fieldError}>{errors.name}</div>
              )}
            </div>

            <div className={styles.formContainer}>
              <span className={styles.labelText}>Email Address *</span>
              <input
                className={styles.input}
                type="email"
                placeholder="Enter email Address"
                value={form.email}
                onChange={update("email")}
                onBlur={onBlur("email")}
                aria-invalid={Boolean(showError("email"))}
              />
              {showError("email") && (
                <div className={styles.fieldError}>{errors.email}</div>
              )}
            </div>

            <div className={styles.formContainer}>
              <span className={styles.labelText}>Phone Number *</span>
              <input
                className={styles.input}
                type="tel"
                inputMode="numeric"
                placeholder="Enter your phone number"
                maxLength={13}
                value={form.mobile}
                onChange={update("mobile")}
                onBlur={onBlur("mobile")}
                aria-invalid={Boolean(showError("mobile"))}
              />
              {showError("mobile") && (
                <div className={styles.fieldError}>{errors.mobile}</div>
              )}
            </div>

            <div className={styles.formContainer}>
              <span className={styles.labelText}>Location *</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Enter your location"
                value={form.location}
                onChange={update("location")}
                onBlur={onBlur("location")}
                aria-invalid={Boolean(showError("location"))}
              />
              {showError("location") && (
                <div className={styles.fieldError}>{errors.location}</div>
              )}
            </div>

            <div className={styles.formContainer}>
              <span className={styles.labelText}>Message</span>
              <textarea
                className={styles.textarea}
                placeholder="Enter your message here"
                rows={4}
                value={form.message}
                onChange={update("message")}
                onBlur={onBlur("message")}
              />
            </div>

            <button
              type="submit"
              disabled={isInvalid || isSubmitting}
              className={
                isInvalid || isSubmitting
                  ? styles.buttonDisabled
                  : styles.button
              }
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>

            {status.kind === "success" && (
              <div
                className={`${styles.formStatus} ${styles.formStatusSuccess}`}
                role="status"
              >
                {status.message}
              </div>
            )}
            {status.kind === "error" && (
              <div
                className={`${styles.formStatus} ${styles.formStatusError}`}
                role="alert"
              >
                {status.message}
              </div>
            )}
          </form>
        </div>

        <div className={`${styles.subContainer} ${styles.subContainerColumn}`}>
          <div className={styles.headingContainer}>
            <h1>Visit Our Experience Center</h1>
            <div className={styles.commonText} style={{ textAlign: "center" }}>
              Explore our collections, experience our quality firsthand, and
              consult with our experts at our showroom.
            </div>
          </div>

          <div className={styles.addressContainer}>
            <div className={styles.commonContainer} style={{ gap: 14 }}>
              <span className={styles.contactLine}>Showroom Address</span>
              <span className={styles.commonText} style={{ lineHeight: "24px" }}>
                Plot No - 190, Professor CR Rao Road, Opposite Old ALIND
                Factory Entrance Gate, Doyens Colony, Serilingampalle (M),
                Telangana-500019.
              </span>
              <span className={styles.contactLine}>
                Mobile:{" "}
                <a
                  href="tel:+919014324646"
                  className={styles.contactText}
                  style={{ textDecoration: "underline" }}
                >
                  +91 9014324646
                </a>
              </span>
              <span className={styles.contactLine}>
                Timings:{" "}
                <span className={styles.contactTextStatic}>10 AM to 8 PM</span>
              </span>
              <a
                href={SHOWROOM_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directionsButton}
              >
                Get Directions
              </a>
            </div>

            <div className={styles.map}>
              <iframe
                src={SHOWROOM_EMBED_URL}
                title="CustomFurnish Showroom location"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
