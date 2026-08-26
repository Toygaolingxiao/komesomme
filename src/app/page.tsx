import { FlavorMatrix } from "@/components/FlavorMatrix";

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] w-full">
      <header className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8 lg:h-[72px]">
        <span className="text-sm font-medium tracking-tight text-zinc-100">KomeSomme</span>
        <nav className="flex items-center gap-5 text-sm text-zinc-400">
          <a
            href="#matrix"
            className="whitespace-nowrap transition hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8ad6b4]"
          >
            マトリクス
          </a>
        </nav>
      </header>

      <div id="matrix">
        <FlavorMatrix />
      </div>
    </main>
  );
}
