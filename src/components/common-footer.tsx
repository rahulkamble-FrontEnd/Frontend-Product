import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function CommonFooter() {
  const companyLinks = [
    "About Us",
    "Careers",
    "Blogs",
    "Contact Us",
    "Consult Us",
  ];

  const serviceLinks = [
    "Kitchen Design",
    "Bedroom Interiors",
    "Living Room",
    "Office Interiors",
    "Full Home Interiors",
  ];

  const socialLinks = [
    { id: "IG", label: "Instagram" },
    { id: "FB", label: "Facebook" },
    { id: "YT", label: "YouTube" },
    { id: "LI", label: "LinkedIn" },
    { id: "TW", label: "Twitter" },
    { id: "PT", label: "Pinterest" },
    { id: "WA", label: "WhatsApp" },
  ];

  return (
    <footer
      className={`${plusJakartaSans.className} text-white`}
      style={{
        background:
          "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1680px] px-6 py-9 md:px-10">
        <div className="grid grid-cols-1 gap-8 border-b border-white/25 pb-8 md:grid-cols-[1.15fr_0.9fr_0.95fr_1.2fr]">
          <div className="space-y-8">
            <div className="text-[20px] font-semibold leading-normal tracking-[0%]">
              CustomFurnish
            </div>
            <p className="max-w-sm text-[14px] font-normal leading-5 tracking-[0%] text-white/90">
              CustomFurnish is India&apos;s leading platform for interior materials
              and customized home interiors. We combine design, quality materials,
              and execution to deliver dream homes faster.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {socialLinks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#121212] text-white"
                  aria-label={item.label}
                >
                  {item.id === "IG" && (
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1.2" />
                    </svg>
                  )}
                  {item.id === "FB" && (
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 8h2V5h-2a4 4 0 0 0-4 4v2H8v3h2v5h3v-5h2.3l.4-3H13V9a1 1 0 0 1 1-1z" />
                    </svg>
                  )}
                  {item.id === "YT" && (
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2.5" y="6.5" width="19" height="11" rx="3" />
                      <path d="m10 9 5 3-5 3z" />
                    </svg>
                  )}
                  {item.id === "LI" && (
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M8 10v6" />
                      <path d="M8 8h.01" />
                      <path d="M12 16v-3a2 2 0 0 1 4 0v3" />
                    </svg>
                  )}
                  {item.id === "TW" && (
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 5.9c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2.1-.8.5-1.6.8-2.5 1-1.4-1.5-3.8-1.5-5.2 0-.8.8-1.2 2-1 3.1-3-.1-5.8-1.5-7.7-3.9-1 1.7-.5 3.9 1.1 5-.6 0-1.2-.2-1.7-.5 0 1.9 1.3 3.6 3.1 4-.5.1-1.1.2-1.6.1.5 1.6 2 2.8 3.7 2.8A7.6 7.6 0 0 1 3 17.6a10.8 10.8 0 0 0 5.8 1.7c7 0 10.8-5.8 10.8-10.8v-.5c.8-.5 1.5-1.2 2-2z" />
                    </svg>
                  )}
                  {item.id === "PT" && (
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 .1-2.9l1.2-5c-.2-.5-.4-1.2-.4-1.9 0-1.8 1-3.2 2.3-3.2 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.8-1 4.3-.3 1.2.6 2.1 1.8 2.1 2.2 0 3.9-2.3 3.9-5.6 0-2.9-2.1-4.9-5.1-4.9-3.5 0-5.5 2.6-5.5 5.3 0 1 .4 2.2 1 2.8.1.1.1.2.1.3l-.4 1.5c-.1.2-.2.3-.4.2-1.5-.6-2.4-2.6-2.4-4.2 0-3.4 2.5-6.6 7.1-6.6 3.7 0 6.6 2.7 6.6 6.3 0 3.7-2.3 6.8-5.6 6.8-1.1 0-2.2-.6-2.5-1.2l-.7 2.7c-.3 1-.9 2.1-1.3 2.9.9.3 1.8.5 2.8.5A10 10 0 1 0 12 2z" />
                    </svg>
                  )}
                  {item.id === "WA" && (
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="8.5" />
                      <path d="M9.7 9.4c.2-.3.5-.4.8-.2l1.1.8c.3.2.4.5.2.8l-.4.7c.5 1 1.3 1.8 2.3 2.3l.7-.4c.3-.2.6-.1.8.2l.8 1.1c.2.3.1.6-.2.8-.6.4-1.3.6-2 .5-2.7-.4-4.9-2.6-5.3-5.3-.1-.7.1-1.4.5-2z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-[20px] font-semibold leading-normal tracking-[0%]">
              Company
            </div>
            <ul className="space-y-1.5 text-[14px] font-normal leading-8 tracking-[0%] text-white/90">
              {companyLinks.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-3 text-[20px] font-semibold leading-normal tracking-[0%]">
              Services
            </div>
            <ul className="space-y-1.5 text-[14px] font-normal leading-8 tracking-[0%] text-white/90">
              {serviceLinks.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>

          <div className="border-white/25 md:border-l md:pl-8">
            <p className="max-w-xs text-[14px] font-normal leading-8 tracking-[0%] text-white/90">
              Subscribe to our newsletter for the latest design trends, offers,
              and updates!
            </p>
            <div className="mt-4 text-[20px] font-semibold leading-normal tracking-[0%]">
              Newsletter
            </div>
            <div className="mt-3 flex max-w-xs items-center overflow-hidden rounded-md border border-white/40 bg-white/10">
              <input
                type="email"
                placeholder="Enter your Email Here"
                className="w-full bg-transparent px-3 py-2 text-[14px] font-normal leading-7 tracking-[0%] text-white placeholder:text-white/70 focus:outline-none"
              />
              <button
                type="button"
                className="bg-[#ef5a2b] px-3 py-2 text-[14px] font-semibold leading-7 tracking-[0%] text-white"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-5 text-[11px] text-white/90 md:flex-row md:items-center md:justify-between">
          <div>© 2026 CustomFurnish.com</div>
          <div>Terms & Conditions | Privacy Policy</div>
        </div>
      </div>
    </footer>
  );
}
