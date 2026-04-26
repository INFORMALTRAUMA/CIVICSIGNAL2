"use client"

import { useEffect, useRef } from "react"

export default function SignalWave() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let raf = 0
    const handleMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        node.style.setProperty("--wave-x", `${x * 30}px`)
        node.style.setProperty("--wave-y", `${y * 30}px`)
      })
    }

    node.addEventListener("pointermove", handleMove)
    return () => {
      node.removeEventListener("pointermove", handleMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      <div className="absolute -top-20 left-10 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(30,122,117,0.35),transparent_70%)] blur-3xl" style={{ transform: "translate(var(--wave-x,0), var(--wave-y,0))" }} />
      <div className="absolute top-24 right-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(240,198,106,0.4),transparent_70%)] blur-3xl" style={{ transform: "translate(calc(var(--wave-x,0) * -1), var(--wave-y,0))" }} />
      <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(228,95,90,0.35),transparent_70%)] blur-3xl" style={{ transform: "translate(calc(var(--wave-x,0) * 0.6), calc(var(--wave-y,0) * -0.6))" }} />
    </div>
  )
}
