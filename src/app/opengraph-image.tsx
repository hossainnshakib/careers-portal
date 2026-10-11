import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Careers — browse open roles across our brands";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#f2f5fb", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: "#2f6bff" }} />
          <span style={{ fontSize: 52, fontWeight: 800, color: "#0b1220", letterSpacing: -1.5 }}>Careers</span>
        </div>
        <p style={{ marginTop: 32, fontSize: 36, color: "#0b1220", fontWeight: 700 }}>Good work starts here.</p>
        <p style={{ marginTop: 12, fontSize: 26, color: "#5a6478" }}>Browse open roles across our brands. No account needed.</p>
      </div>
    ),
    { ...size },
  );
}
