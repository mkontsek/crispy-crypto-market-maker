import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 p-6">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
          Crispy
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-100 md:text-5xl">
          Market-making control plane for simulated crypto venues
        </h1>
        <p className="max-w-2xl text-slate-400">
          Monitor quotes, inventory, fills, and PnL in real time through a Next.js
          dashboard backed by the Rust engine stream.
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-400 px-4 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
        >
          Sign in to demo
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
        >
          View dashboard
        </Link>
        <Link
          href="/history"
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
        >
          Historical data
        </Link>
      </section>
    </main>
  );
}
