import { ImageResponse } from "next/og";
import { BRAND, logoDataUri } from "@/lib/brand";

// Social share card (OpenGraph + Twitter). Generated at build time.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ResumeIQ AI — AI resume analysis";

export default function OpengraphImage() {
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
          background: BRAND.ogBackground,
          backgroundImage:
            "radial-gradient(900px 500px at 50% 0%, rgba(99,102,241,0.28), transparent)",
          color: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={150} height={150} src={logoDataUri(150)} alt="" />
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 36,
          }}
        >
          ResumeIQ AI
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#A5B4FC",
            marginTop: 16,
          }}
        >
          {BRAND.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
