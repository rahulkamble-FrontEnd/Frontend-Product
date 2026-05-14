"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useState } from "react";
import { subscribeNewsletter } from "@/lib/api";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
});

type CommonFooterProps = {
  hideNewsletter?: boolean;
};

type FooterLink = { label: string; href?: string };

/** Match `/categories/[slug]` + banner key normalization in `app/categories/[slug]/page.tsx`. */
function slugifyFooterCategoryLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SHOP_NAV_LABELS = [
  "Core materials",
  "Laminates",
  "Wall Decorative",
  "Counter Tops",
  "Flooring & Tiles",
  "Lighting",
] as const;

export default function CommonFooter({ hideNewsletter = false }: CommonFooterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus("error");
      setMessage("email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setMessage("please enter valid email");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await subscribeNewsletter(email);
      setStatus("success");
      setMessage("Thank you for subscribing!");
      setEmail("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setStatus("error");
      setMessage(errorMessage);
    }
  };

  const companyLinks: FooterLink[] = [
    { label: "About us", href: "/about-us" },
    { label: "Blogs" },
    { label: "Contact us", href: "/contact-us" },
    { label: "FAQs", href: "/faqs" },
  ];

  const shopLinks: FooterLink[] = SHOP_NAV_LABELS.map((label) => ({
    label,
    href: `/categories/${slugifyFooterCategoryLabel(label)}`,
  }));

  const experienceCentreAddress =
    "Plot No - 190, Professor CR Rao Road, Opposite Old ALIND Factory Entrance Gate, Doyens Colony, Serilingampalle (M), Telangana-500019.";

  const experienceCentreMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(experienceCentreAddress)}`;

  const linkClass = "transition-opacity hover:text-white hover:opacity-100";

  const renderFooterLink = (link: FooterLink) => {
    if (!link.href) {
      return link.label;
    }
    if (link.href.startsWith("http")) {
      return (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link href={link.href} className={linkClass}>
        {link.label}
      </Link>
    );
  };

  const socialLinks = [
    {
      id: "IG",
      label: "Instagram",
      url: "https://www.instagram.com/customfurnish/",
      iconSrc: "/logo-social/Link.svg",
    },
    {
      id: "FB",
      label: "Facebook",
      url: "https://www.facebook.com/customfurnish",
      iconSrc: "/logo-social/Link-1.svg",
    },
    {
      id: "YT",
      label: "YouTube",
      url: "https://www.youtube.com/@Customfurnish",
      iconSrc: "/logo-social/Link-2.svg",
    },
    {
      id: "LI",
      label: "LinkedIn",
      url: "https://www.linkedin.com/company/customfurnish-official",
      iconSrc: "/logo-social/Link-3.svg",
    },
    {
      id: "TW",
      label: "Twitter",
      url: "https://x.com/CustomFurnish1",
      iconSrc: "/logo-social/Link-4.svg",
    },
    {
      id: "PT",
      label: "Pinterest",
      url: "https://in.pinterest.com/customfurnishin/",
      iconSrc: "/logo-social/Link-5.svg",
    },
    {
      id: "WA",
      label: "WhatsApp",
      url: "https://api.whatsapp.com/send/?phone=916301734646&text&type=phone_number&app_absent=0",
      iconSrc: "/logo-social/Link-6.svg",
    },
  ] as const;

  const footerMainGridClassName = hideNewsletter
    ? "grid grid-cols-1 gap-x-8 gap-y-8 border-b border-white/25 pb-8 md:grid-cols-2 lg:grid-cols-3 xl:mx-auto xl:w-fit xl:max-w-full xl:grid-cols-[minmax(260px,min(100%,380px))_auto_auto_minmax(280px,min(100%,420px))] xl:items-start xl:gap-x-10 2xl:gap-x-12"
    : "grid grid-cols-1 gap-x-8 gap-y-8 border-b border-white/25 pb-8 md:grid-cols-2 lg:grid-cols-3 xl:mx-auto xl:w-fit xl:max-w-full xl:grid-cols-[minmax(260px,min(100%,380px))_auto_auto_minmax(280px,min(100%,400px))_minmax(300px,320px)] xl:items-start xl:gap-x-10 2xl:gap-x-12";

  return (
    <footer
      className={`${plusJakartaSans.className} text-white`}
      style={{
        background:
          "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1680px] px-6 pb-9 pt-12 sm:px-8 sm:pt-14 md:px-10 md:pt-14 lg:px-12 xl:px-16 2xl:px-24">
        <div className={footerMainGridClassName}>
          <div className="flex flex-col gap-8 md:col-span-2 lg:col-span-1 xl:col-span-1">
            <div className="flex max-w-full flex-col gap-6">
            <Link
              href="/"
              className="inline-flex max-w-full min-w-0 items-center"
            >
              <Image
                src="/customfurnish-logo.svg"
                alt="CustomFurnish"
                width={309}
                height={28}
                className="pointer-events-none block h-5 w-auto max-w-full object-contain object-left sm:h-6"
              />
            </Link>
            <p
              className="max-w-[min(100%,20rem)] text-left text-[14px] font-normal tracking-[0%] text-white/90 xl:max-w-[22rem]"
              style={{ lineHeight: "26px" }}
            >
              CustomFurnish.com offers premium interior materials and modern design solutions for
              elegant and customized living spaces.
            </p>
            </div>
            <div className="flex flex-nowrap items-center gap-1.5 xl:gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[2px] transition-opacity hover:opacity-80 xl:h-9 xl:w-9"
                  aria-label={item.label}
                >
                  <Image
                    src={item.iconSrc}
                    alt=""
                    width={40}
                    height={42}
                    className="h-full w-full object-cover object-center"
                  />
                </a>
              ))}
            </div>
          </div>

          <div className="md:pl-6 lg:pl-10 xl:pl-0 2xl:pl-2">
            <div className="mb-3 text-[20px] font-semibold leading-normal tracking-[0%]">
              Company
            </div>
            <ul className="space-y-1.5 text-[14px] font-normal leading-8 tracking-[0%] text-white/90">
              {companyLinks.map((link) => (
                <li key={link.label}>{renderFooterLink(link)}</li>
              ))}
            </ul>
          </div>

          <div className="pl-2 md:pl-4 xl:pl-5">
            <div className="mb-3 text-[20px] font-semibold leading-normal tracking-[0%]">
              Shop
            </div>
            <ul className="space-y-1.5 text-[14px] font-normal leading-8 tracking-[0%] text-white/90">
              {shopLinks.map((link) => (
                <li key={link.label}>{renderFooterLink(link)}</li>
              ))}
            </ul>
          </div>

          <div className="w-full max-w-[340px] pl-2 md:pl-4 xl:max-w-[360px] xl:pl-5">
            <div className="mb-3 text-[20px] font-semibold leading-normal tracking-[0%]">
              Experience Centre
            </div>
            <div className="rounded border border-white/60 p-3.5 text-[13px] font-normal leading-snug tracking-[0%] text-white/90">
              <div className="flex gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-5 w-5 shrink-0 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-white">
                    Hyderabad
                  </div>
                  <p className="mt-2">{experienceCentreAddress}</p>
                  <a
                    href={experienceCentreMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-white underline decoration-white/80 underline-offset-2 transition-opacity hover:opacity-90"
                  >
                    Get Directions
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {!hideNewsletter && (
            <div className="flex w-full max-w-[300px] min-w-0 flex-col items-stretch justify-self-start text-left md:justify-self-end lg:col-span-2 xl:col-span-1">
              <div className="text-[20px] font-semibold leading-tight tracking-[0%] text-white">
                Stay Updated
              </div>
              <p className="mt-2 text-[14px] font-normal leading-[1.45] tracking-[0%] text-white/90">
                Get the latest interior material trends and design updates
              </p>
              <form
                onSubmit={handleSubscribe}
                style={{ width: 300 }}
                className="mt-4 box-border flex min-w-0 flex-col gap-2 rounded-none border border-white bg-transparent px-1.5 py-2 sm:flex-row sm:items-center sm:gap-1.5 sm:px-1.5 sm:py-2"
              >
                <input
                  type="email"
                  placeholder="Enter your Email Here"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="box-border h-[33px] min-h-[33px] w-full min-w-0 rounded-none border-0 bg-white/60 px-2 text-[12px] font-normal leading-none text-[#2d2620] placeholder:text-[#4a3d32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-white/90 sm:flex-1 sm:text-[13px]"
                  disabled={status === "loading"}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="box-border h-[32px] min-h-[32px] w-full shrink-0 whitespace-nowrap rounded-none border-0 bg-[#EF2B04] px-2.5 text-[11px] font-semibold leading-none tracking-[0%] text-white transition-opacity hover:opacity-95 disabled:opacity-50 sm:w-auto sm:px-2.5"
                >
                  {status === "loading" ? "..." : "Subscribe"}
                </button>
              </form>
              {status === "error" && (
                <div style={{ color: "red", marginTop: "10px", fontSize: "14px" }}>
                  {message}
                </div>
              )}
              {status === "success" && (
                <div style={{ color: "#4BB543", marginTop: "10px", fontSize: "14px" }}>
                  {message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-5 text-[11px] text-white/90 md:flex-row md:items-center md:justify-between">
          <div>© 2026 CustomFurnish.com | All Rights Reserved.</div>
          <div className="flex items-center gap-1">
            <Link href="/terms-and-conditions" className="hover:text-white hover:underline">
              Terms & Conditions
            </Link>
            <span>|</span>
            <Link href="/privacy-policy" className="hover:text-white hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
