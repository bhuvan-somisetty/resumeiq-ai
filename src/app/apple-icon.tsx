import { ImageResponse } from "next/og";
import { logoDataUri } from "@/lib/brand";

// Apple touch icon (iOS home screen / Safari). Rendered as PNG from the mark.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0E1A",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={150} height={150} src={logoDataUri(150)} alt="ResumeIQ AI" />
      </div>
    ),
    { ...size },
  );
}
