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
                Get in Touch With CustomFurnish
              </div>
              <div className={`${styles.commonText} ${styles.desc}`}>
                We are here to help you explore premium interior materials and
                modern design solutions for your dream home interiors.
              </div>
              <div className={`${styles.commonText} ${styles.desc}`}>
                Whether you are planning a new home, renovating your interiors,
                or looking for the right materials and finishes, our team is
                ready to assist you with expert guidance and customized
                recommendations.
              </div>
            </div>

            <div className={styles.commonContainer}>
              <div className={styles.heading}>Visit Our Experience Centre</div>
              <p className={styles.venueName}>CustomFurnish Materials</p>
              <div className={styles.addressLines}>
                <p>Plot No - 190, Professor CR Rao Road,</p>
                <p>Opposite Old ALIND Factory Entrance Gate,</p>
                <p>Doyens Colony, Serilingampalle (M),</p>
                <p>Telangana - 500019.</p>
              </div>
            </div>

            <div className={styles.commonContainer}>
              <div className={styles.heading}>Contact Information</div>
              <span className={styles.contactLine}>
                Phone:{" "}
                <a href="tel:+919014324646" className={styles.contactText}>
                  +91 9014324646
                </a>
              </span>
              <span className={styles.contactLine}>
                Email:{" "}
                <a
                  href="mailto:support@customfurnish.com"
                  className={styles.contactText}
                >
                  support@customfurnish.com
                </a>
              </span>
            </div>

            <div className={styles.commonContainer}>
              <div className={styles.heading}>Working Hours</div>
              <span className={styles.contactLine}>Monday – Saturday</span>
              <span className={styles.contactLine}>
                <span className={styles.contactTextStatic}>
                  10:00 AM – 7:00 PM
                </span>
              </span>
            </div>

            <div className={styles.commonContainer}>
              <div className={styles.heading}>Material Selection Assistance</div>
              <div className={`${styles.commonText} ${styles.desc}`}>
                Customers can explore and shortlist materials directly from our
                platform. Our interior design team will help finalize the
                selected materials and include them in the interior design
                quotation and execution process.
              </div>
            </div>

            <div className={styles.commonContainer}>
              <div className={styles.heading}>Why Visit CustomFurnish</div>
              <ul className={styles.contentList}>
                <li>Explore premium interior material collections</li>
                <li>Experience modern finishes and textures</li>
                <li>Get expert interior design guidance</li>
                <li>Discover customized material combinations</li>
                <li>Find inspiration for luxury home interiors</li>
              </ul>
            </div>

            <div className={styles.commonContainer}>
              <div className={styles.heading}>
                Let&rsquo;s Create Beautiful Interiors Together
              </div>
              <div className={`${styles.commonText} ${styles.desc}`}>
                At CustomFurnish, we focus on helping customers create elegant,
                functional, and modern living spaces with the right combination
                of premium materials and expert interior solutions.
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
            <h1>Visit Our Experience Centre</h1>
            <div className={styles.commonText} style={{ textAlign: "center" }}>
              Explore material samples and finishes, and consult with our team
              at our Hyderabad experience centre.
            </div>
          </div>

          <div className={styles.addressContainer}>
            <div className={styles.commonContainer} style={{ gap: 14 }}>
              <span className={styles.contactLine}>CustomFurnish Materials</span>
              <div
                className={styles.addressLines}
                style={{ textAlign: "center", maxWidth: "100%" }}
              >
                <p>Plot No - 190, Professor CR Rao Road,</p>
                <p>Opposite Old ALIND Factory Entrance Gate,</p>
                <p>Doyens Colony, Serilingampalle (M),</p>
                <p>Telangana - 500019.</p>
              </div>
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
                <span className={styles.contactTextStatic}>
                  Monday – Saturday, 10:00 AM – 7:00 PM
                </span>
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
