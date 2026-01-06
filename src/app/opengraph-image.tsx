import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const alt = "Prism - Project Management for Everyone"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Image generation
export default async function Image() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: "#111",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 96, fontWeight: "bold", color: "#006239", marginBottom: 40 }}>
            PRISM
          </div>
          <div style={{ fontSize: 36, color: "#ccc" }}>Project Management for Everyone</div>
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error("Error generating OpenGraph image:", error)
    return new Response("Failed to generate OpenGraph image", { status: 500 })
  }
}

