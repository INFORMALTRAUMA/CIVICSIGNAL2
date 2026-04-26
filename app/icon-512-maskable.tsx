import { ImageResponse } from "next/og"

export const contentType = "image/png"

export default function Icon512Maskable() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e7a75"
        }}
      >
        <div
          style={{
            width: "78%",
            height: "78%",
            borderRadius: "22%",
            background: "#fff8ef",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#101512",
            fontSize: 190,
            fontWeight: 800,
            letterSpacing: "-0.04em"
          }}
        >
          CS
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
