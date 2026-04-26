"use client"

import { useEffect, useState } from "react"

type Ward = {
  id: string
  name: string
  code: string | null
  city: string
}

type WardSelectProps = {
  value: string
  onChange: (next: string) => void
  id?: string
  className?: string
}

export default function WardSelect({ value, onChange, id, className }: WardSelectProps) {
  const [wards, setWards] = useState<Ward[]>([])

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/wards")
      const payload = await response.json()
      if (response.ok) {
        setWards(payload.data ?? [])
      }
    }
    load()
  }, [])

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={
        className ??
        "w-full rounded-full border border-[var(--ink)] bg-[var(--paper)] px-4 py-2 text-xs sm:w-auto"
      }
    >
      <option value="">All wards</option>
      {wards.map((ward) => (
        <option key={ward.id} value={ward.id}>
          {ward.name}{ward.code ? ` (${ward.code})` : ""}
        </option>
      ))}
    </select>
  )
}
