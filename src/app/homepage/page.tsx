import Link from "next/link";

const featureHighlights = [
  "Plan roadmaps that stay connected to day-to-day execution.",
  "Triage, assign, and ship issues from one fast workspace.",
  "Keep product, engineering, and leadership aligned with live context.",
];

export default function Homepage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] text-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/homepage" className="flex items-center gap-3 font-medium">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">
            L
          </span>
          <span>Linear</span>
        </Link>
        <div className="flex items-center gap-5 text-sm text-[#b4b4b8]">
          <Link className="transition-colors hover:text-white" href="/login">
            Log in
          </Link>
          <Link
            className="rounded-full bg-white px-4 py-2 font-medium text-black transition-opacity hover:opacity-90"
            href="/signup"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center">
        <p className="mb-5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#c9c9ce]">
          Clone-local Linear homepage
        </p>
        <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] md:text-7xl">
          Purpose-built for planning and building products
        </h1>
        <p className="mt-7 max-w-2xl text-balance text-lg leading-8 text-[#b4b4b8]">
          Exponential keeps Linear-style product work inside this clone, from
          public acquisition flows to the authenticated workspace.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-full bg-[#5E6AD2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#6875e8]"
            href="/signup"
          >
            Start building
          </Link>
          <Link
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/[0.04]"
            href="/login"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {featureHighlights.map((highlight) => (
          <article
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-left shadow-2xl shadow-black/20"
            key={highlight}
          >
            <div className="mb-5 h-1.5 w-10 rounded-full bg-[#5E6AD2]" />
            <p className="text-sm leading-6 text-[#d4d4d8]">{highlight}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
