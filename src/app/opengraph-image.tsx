import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "CF Studio by CustomFurnish";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoSvg = await readFile(join(process.cwd(), "public", "cf-studio-logo.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logoSvg.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F0E4",
          borderBottom: "24px solid #4d2c1e",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={900} height={109} alt="" />
        <div
          style={{
            marginTop: 56,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#4d2c1e",
            textTransform: "uppercase",
          }}
        >
          Premium Interior Materials
        </div>
        <div style={{ marginTop: 18, fontSize: 28, color: "#6b5a4e" }}>
          Core Materials · Finishes · Wall Decoratives · Lighting · Hardware
        </div>
      </div>
    ),
    size,
  );
}
