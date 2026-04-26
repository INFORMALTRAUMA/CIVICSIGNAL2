import { ImageResponse } from "next/og"

export const contentType = "image/png"

export default function Icon({ size = 512 }: { size?: number }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 30%, #f0c66a, #1e7a75 60%, #101512)",
          borderRadius: size > 256 ? 96 : 48
        }}
      >
        <div
          style={{
            width: "72%",
            height: "72%",
            borderRadius: "30%",
            border: "10px solid rgba(255,255,255,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff8ef",
            fontSize: size > 256 ? 190 : 72,
            fontWeight: 800,
            letterSpacing: "-0.04em"
          }}
        >
          CS
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
