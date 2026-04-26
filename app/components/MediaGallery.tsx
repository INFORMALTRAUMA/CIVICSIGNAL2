"use client"

import { useMemo, useState } from "react"

export type MediaItem = {
  id: string
  public_url: string
  media_type: string
}

type MediaGalleryProps = {
  items: MediaItem[]
}

export default function MediaGallery({ items }: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const activeItem = useMemo(() => {
    if (activeIndex === null) return null
    return items[activeIndex] ?? null
  }, [activeIndex, items])

  const close = () => setActiveIndex(null)
  const goPrev = () => {
    if (activeIndex === null) return
    setActiveIndex((activeIndex + items.length - 1) % items.length)
  }
  const goNext = () => {
    if (activeIndex === null) return
    setActiveIndex((activeIndex + 1) % items.length)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) =>
          item.media_type.startsWith("video/") ? (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveIndex(index)}
              className="group relative overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)]"
            >
              <video className="h-40 w-full object-cover" src={item.public_url} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs uppercase tracking-[0.3em] text-white opacity-0 transition group-hover:opacity-100">
                Play
              </div>
            </button>
          ) : (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveIndex(index)}
              className="group relative overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)]"
            >
              <img src={item.public_url} alt="Issue media" className="h-40 w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs uppercase tracking-[0.3em] text-white opacity-0 transition group-hover:opacity-100">
                View
              </div>
            </button>
          )
        )}
      </div>

      {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
            <div className="relative w-full max-w-4xl">
              <button
                type="button"
                onClick={close}
                className="absolute right-0 top-0 rounded-full bg-[var(--paper)] px-4 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Close
              </button>
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goPrev}
                className="rounded-full border border-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
              >
                Prev
              </button>
              <div className="flex-1 rounded-md bg-black p-3">
                {activeItem.media_type.startsWith("video/") ? (
                  <video controls className="max-h-[70vh] w-full rounded-md" src={activeItem.public_url} />
                ) : (
                  <img src={activeItem.public_url} alt="Issue media" className="max-h-[70vh] w-full rounded-md object-contain" />
                )}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="rounded-full border border-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
