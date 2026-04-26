"use client"

import { useState } from "react"

type MapPickerProps = {
  value: { lat: number | ""; lng: number | "" }
  onChange: (next: { lat: number | ""; lng: number | "" }) => void
}

const inputClass =
  "rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-sm outline-none ring-[var(--teal)] focus:ring-2"

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const [error, setError] = useState<string | null>(null)

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setError(null)
        onChange({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        })
      },
      () => setError("Unable to fetch current location")
    )
  }

  return (
    <div className="space-y-4 border-t border-[var(--stone)] pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Location coordinates</p>
          <p className="mt-1 text-xs text-ink-soft">Enter latitude/longitude or use your current location.</p>
        </div>
        <button
          type="button"
          onClick={handleUseLocation}
          className="rounded-md border border-[var(--stone)] bg-[var(--paper)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--sand)]"
        >
          Use my location
        </button>
      </div>

      {error && <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Latitude
          <input
            name="lat"
            required
            value={value.lat}
            onChange={(event) => onChange({ lat: Number(event.target.value), lng: value.lng })}
            className={inputClass}
            placeholder="12.9716"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Longitude
          <input
            name="lng"
            required
            value={value.lng}
            onChange={(event) => onChange({ lat: value.lat, lng: Number(event.target.value) })}
            className={inputClass}
            placeholder="77.5946"
          />
        </label>
      </div>
    </div>
  )
}
