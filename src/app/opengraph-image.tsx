import { ImageResponse } from "next/og";

export const alt = "BNB Book Outlet — Matric & Intermediate books in Pakistan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #15100d 0%, #4a2c1a 100%)",
          color: "#f8f3ec",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              border: "6px solid #e0b56a",
              background: "#4a2c1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            BNB
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 800 }}>BNB Book Outlet</div>
            <div style={{ fontSize: 26, letterSpacing: 8, color: "#e0b56a" }}>MATRIC · INTERMEDIATE</div>
          </div>
        </div>
        <div style={{ marginTop: 50, fontSize: 38, maxWidth: 900, lineHeight: 1.3 }}>
          Textbooks, guides, notes & past papers for Class 9–12 — delivered across Pakistan.
        </div>
      </div>
    ),
    size,
  );
}
