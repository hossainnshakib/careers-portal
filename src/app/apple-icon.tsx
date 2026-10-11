import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const alt = "Careers";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f5fb" }}>
        <div style={{ width: 108, height: 108, borderRadius: 54, background: "#2f6bff" }} />
      </div>
    ),
    { ...size },
  );
}
