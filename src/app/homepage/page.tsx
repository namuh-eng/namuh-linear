import Link from "next/link";

const capabilities = [
  "Plan product roadmaps with opinionated cycles and initiatives.",
  "Track issues, projects, and customer requests in one focused workspace.",
  "Keep teams aligned with fast navigation, inbox triage, and contextual views.",
];

export const metadata = {
  title: "Linear homepage | Exponential",
  description:
    "A clone-local Linear-style marketing homepage for unauthenticated visitors.",
};

export default function Homepage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--editorial-bg)] text-[var(--editorial-ink-1)]">
      <section className="relative isolate mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,rgba(113,128,255,0.22),transparent_58%)]" />
        <nav
          className="flex items-center justify-between text-sm"
          aria-label="Homepage"
        >
          <Link
            href="/homepage"
            className="flex items-center gap-3 font-semibold"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--editorial-ink-1)] text-[var(--editorial-bg)]">
              L
            </span>
            <span>Linear</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-[var(--editorial-ink-2)] transition-colors hover:bg-[var(--editorial-hover)]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[var(--editorial-ink-1)] px-4 py-2 font-medium text-[var(--editorial-bg)] transition-opacity hover:opacity-85"
            >
              Sign up
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-[var(--editorial-line)] bg-[var(--editorial-surface)] px-3 py-1 text-sm text-[var(--editorial-ink-3)] shadow-[var(--editorial-shadow-sm)]">
              Project and issue tracking, built for modern software teams
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Linear is a purpose-built system for planning and building
              products.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[var(--editorial-ink-3)]">
              Explore a local Linear-style homepage without leaving the clone.
              Start a workspace, return to login, or review the product surface
              from this first-party marketing route.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[var(--editorial-accent)] px-6 py-3 text-sm font-semibold text-[var(--editorial-accent-ink)] shadow-[var(--editorial-shadow-md)] transition-opacity hover:opacity-90"
              >
                Start building
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-[var(--editorial-line-strong)] bg-[var(--editorial-surface)] px-6 py-3 text-sm font-semibold text-[var(--editorial-ink-1)] transition-colors hover:bg-[var(--editorial-surface-2)]"
              >
                Log in to Linear
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--editorial-line)] bg-[var(--editorial-surface)] p-4 shadow-[var(--editorial-shadow-lg)]">
            <div className="rounded-[1.35rem] border border-[var(--editorial-line-soft)] bg-[var(--editorial-surface-2)] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Product workspace</p>
                  <p className="text-xs text-[var(--editorial-ink-4)]">
                    Roadmap · Issues · Cycles
                  </p>
                </div>
                <span className="rounded-full bg-[var(--editorial-ok-soft)] px-3 py-1 text-xs font-medium text-[var(--editorial-ok)]">
                  On track
                </span>
              </div>
              <div className="space-y-3">
                {capabilities.map((capability, index) => (
                  <div
                    key={capability}
                    className="rounded-2xl border border-[var(--editorial-line)] bg-[var(--editorial-surface)] p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-[var(--editorial-accent-soft)] text-xs font-semibold text-[var(--editorial-accent)]">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">
                        {index === 0 ? "Plan" : index === 1 ? "Track" : "Align"}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-[var(--editorial-ink-3)]">
                      {capability}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
