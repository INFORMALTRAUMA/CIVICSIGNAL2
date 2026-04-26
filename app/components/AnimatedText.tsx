"use client"

import { useMemo } from "react"

type AnimatedTextProps = {
  text: string
  className?: string
  stagger?: number
}

export default function AnimatedText({ text, className, stagger = 20 }: AnimatedTextProps) {
  const chars = useMemo(() => Array.from(text), [text])

  return (
    <span className={className} aria-label={text}>
      {chars.map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="char-reveal"
          style={{ animationDelay: `${index * stagger}ms` }}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  )
}
