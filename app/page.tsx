import Link from "next/link"
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import ThemeSwitcher from "@/app/components/ThemeSwitcher"
import AnimatedText from "@/app/components/AnimatedText"
import SignalWave from "@/app/components/SignalWave"
import HomeIntroOverlay from "@/app/components/HomeIntroOverlay"
import InstallPwaButton from "@/app/components/InstallPwaButton"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sand)] text-[var(--ink)]">
      <HomeIntroOverlay />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(240,198,106,0.7),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-18%] left-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(30,122,117,0.45),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute top-[30%] right-[30%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(228,95,90,0.45),transparent_70%)] blur-3xl animate-float-slow" />

      <header className="sticky top-0 z-40 border-b border-[var(--stone)] bg-[var(--paper)]/95 backdrop-blur">
        <div className="page-shell-wide flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--coral)]" />
            Civic Signal
          </div>
          <div className="flex items-center">
            <ThemeSwitcher placement="inline" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <InstallPwaButton />
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full border border-[var(--ink)] px-4 py-2 text-xs uppercase tracking-[0.2em]">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--paper)]">
                  Join
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/citizen"
                className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--paper)]"
              >
                Open app
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      <section className="relative page-shell-wide grid gap-10 pb-16 pt-8 sm:gap-12 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-10">
        <SignalWave />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent_70%)] blur-3xl animate-hero-spotlight" />
        </div>
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--stone)] bg-[var(--paper)] px-4 py-2 text-[0.65rem] font-condensed">
            <span className="h-2 w-2 rounded-full bg-[var(--teal)]" />
            Signal civic urgency
          </div>
          <h1 className="relative font-display text-4xl leading-tight md:text-6xl animate-hero-reveal">
            <AnimatedText text="Crowd-ranked civic issues," className="block" />
            <span className="relative block">
              <span className="bg-[linear-gradient(120deg,var(--teal),var(--sun),var(--coral))] bg-clip-text text-transparent animate-headline-sweep">
                so the city fixes what matters most.
              </span>
            </span>
          </h1>
          <p className="text-lg text-ink-soft">
            Civic Signal turns duplicate complaints into a shared signal. Residents upvote existing reports, and
            municipalities see a live, ranked queue tied to location, impact, and verified resolution.
          </p>
          <div className="flex flex-wrap gap-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-[var(--ink)] px-6 py-3 text-xs uppercase tracking-[0.25em] text-[var(--paper)] shadow-[var(--shadow-soft)]">
                  Start reporting
                </button>
              </SignUpButton>
            </SignedOut>
            <a
              href="#how"
              className="rounded-full border border-[var(--ink)] px-6 py-3 text-xs uppercase tracking-[0.25em]"
            >
              See workflow
            </a>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-condensed text-ink-soft">
            <span className="chip">Map-aware grouping</span>
            <span className="chip">Citizen verification</span>
            <span className="chip">Priority scoring</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-6 right-6 flex items-center gap-2 rounded-full bg-[var(--paper)] px-4 py-2 text-[0.65rem] uppercase tracking-[0.35em] shadow-[var(--shadow-soft)]">
            <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />
            Live signal queue
          </div>
          <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] p-6 shadow-sm">
            <div className="flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              <span>Citywide priority</span>
              <span className="text-[var(--teal)]">Updated live</span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                {
                  title: "Open manhole near Central Market",
                  score: "92.4",
                  ward: "Ward 12",
                  votes: "136 upvotes"
                },
                { title: "Burst water pipe on 7th Avenue", score: "87.2", ward: "Ward 4", votes: "114 upvotes" },
                { title: "Streetlight outage on River Road", score: "71.8", ward: "Ward 9", votes: "68 upvotes" }
              ].map((issue) => (
                <div key={issue.title} className="rounded-md border border-[var(--stone)] bg-[var(--sand)]/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--ink)]">{issue.title}</p>
                    <span className="text-xs font-semibold font-metric text-[var(--ink)]">{issue.score}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
                    <span>{issue.ward}</span>
                    <span>{issue.votes}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-md border border-[var(--stone)] bg-[linear-gradient(120deg,rgba(30,122,117,0.12),rgba(240,198,106,0.12),rgba(228,95,90,0.12))] p-4 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-soft animate-shimmer">
              Trending signals surge as more neighbors verify.
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative page-shell py-14 sm:py-16 lg:py-20">
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {[
            {
              title: "Smart reporting",
              copy: "Citizens add new reports or upvote existing ones. Duplicate detection keeps the signal clean."
            },
            {
              title: "Priority scoring",
              copy: "A civic priority score blends upvotes, reports, severity, and freshness to rank urgency."
            },
            {
              title: "Ward analytics",
              copy: "Officials view signals ward-by-ward with resolution verification from residents."
            }
          ].map((feature) => (
            <div key={feature.title} className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] p-6 shadow-sm">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Capability</p>
              <h2 className="mt-2 text-lg font-semibold">{feature.title}</h2>
              <p className="mt-3 text-sm text-ink-soft">{feature.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="relative page-shell pb-16 sm:pb-20">
        <div className="grid gap-10 rounded-md border border-[var(--stone)] bg-[linear-gradient(140deg,var(--paper),var(--surface-muted))] p-8 sm:p-10 lg:p-12 md:grid-cols-3">
          {[
            {
              step: "Step 1",
              title: "Report or upvote",
              copy: "Residents report new issues or reinforce existing ones with a single tap."
            },
            {
              step: "Step 2",
              title: "Rank by impact",
              copy: "The system scores every issue and surfaces the highest-impact problems first."
            },
            {
              step: "Step 3",
              title: "Resolve with clarity",
              copy: "Officials close the loop and citizens verify when problems are fixed."
            }
          ].map((step) => (
            <div key={step.title}>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{step.step}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm text-ink-soft">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="relative page-shell pb-20 lg:pb-24">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr] lg:gap-8">
          <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] p-8 shadow-sm">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Audience</p>
            <h3 className="mt-2 text-lg font-semibold">For residents</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li>See every issue in your neighborhood on one map.</li>
              <li>Track status updates in real time.</li>
              <li>Verify resolutions and keep leaders accountable.</li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-md border border-[var(--stone)] bg-[var(--paper)] p-8 shadow-sm">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Audience</p>
            <h3 className="mt-2 text-lg font-semibold">For city teams</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li>Prioritize by impact instead of queue order.</li>
              <li>View ward analytics to allocate resources smarter.</li>
              <li>Reduce duplicate work through shared signals.</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--stone)] py-8">
        <div className="page-shell flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-ink-soft">
          <span>Civic Signal</span>
          <span>Built for citizen-centric governance</span>
        </div>
      </footer>
    </main>
  )
}
