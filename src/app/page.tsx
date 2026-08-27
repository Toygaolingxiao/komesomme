import { FlavorMatrix } from "@/components/FlavorMatrix";

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] w-full text-[var(--km-ink)]">
      <header className="mx-auto flex h-16 max-w-[1400px] items-center justify-between border-b border-[var(--km-border)] px-4 md:px-8 lg:h-[72px]">
        <span className="text-sm font-semibold tracking-tight text-[var(--km-ink)]">
          KomeSomme
        </span>
        <nav className="flex items-center gap-5 text-sm text-[var(--km-muted)]">
          <a
            href="#matrix"
            className="whitespace-nowrap transition hover:text-[var(--km-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--km-accent)]"
          >
            味わいの地図
          </a>
        </nav>
      </header>

      <div id="matrix">
        <FlavorMatrix />
      </div>
    </main>
  );
}
