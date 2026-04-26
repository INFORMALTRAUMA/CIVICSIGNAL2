import CitizenNav from "@/app/components/CitizenNav"

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--sand)] text-[var(--ink)]">
      <CitizenNav />
      <div className="transition-[padding] lg:pl-[var(--sidebar-width)]">
        {children}
      </div>
    </div>
  )
}
