import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function CommonFooter() {
  const companyLinks = [
    "About us",
    "Careers",
    "Blogs",
    "Contact us",
    "Internal Portal",
    "FAQs",
  ];

  const serviceLinks = [
    "Bed Room Design",
    "Kitchen Design",
    "Living Room Design",
    "Dining Room Design",
    "Puja Room Design",
    "Partition Design",
    "Study Room Design",
    "Office Room Design",
    "VR Experience",
  ];

  const socialLinks = ["IG", "FB", "YT", "LI", "TW", "PT", "WA"];

  return (
    <footer
      className={`${plusJakartaSans.className} text-white`}
      style={{
        background:
          "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1680px] px-6 py-10 md:px-10">
        <div className="grid grid-cols-1 gap-8 border-b border-white/25 pb-8 md:grid-cols-[1.1fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <div className="text-[20px] font-semibold leading-normal tracking-[0%]">
              CustomFurnish
            </div>
            <p className="max-w-sm text-[16px] font-normal leading-8 tracking-[0%] text-white/90">
              CustomFurnish.com delivers customized home interiors with expert
              craftsmanship and seamless design solutions.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-white/40 bg-black/35 text-[10px] font-bold"
                  aria-label={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-[20px] font-semibold leading-normal tracking-[0%]">
              Company
            </div>
            <ul className="space-y-2 text-[16px] font-normal leading-8 tracking-[0%] text-white/90">
              {companyLinks.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-3 text-[20px] font-semibold leading-normal tracking-[0%]">
              Services
            </div>
            <ul className="space-y-2 text-[16px] font-normal leading-8 tracking-[0%] text-white/90">
              {serviceLinks.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>

          <div className="border-white/25 md:border-l md:pl-8">
            <p className="max-w-xs text-[18px] font-normal leading-7 tracking-[0%] text-white/90">
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
                className="w-full bg-transparent px-3 py-2 text-[16px] font-normal leading-8 tracking-[0%] text-white placeholder:text-white/70 focus:outline-none"
              />
              <button
                type="button"
                className="bg-[#ef5a2b] px-3 py-2 text-[16px] font-semibold leading-8 tracking-[0%] text-white"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-5 text-[11px] text-white/90 md:flex-row md:items-center md:justify-between">
          <div>© 2026 CustomFurnish.com | All Rights Reserved.</div>
          <div className="flex items-center gap-5">
            <span>Terms and Conditions</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
