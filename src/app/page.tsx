import { DiscoverDailyHint } from "@/components/editorial/DiscoverDailyHint";
import { FlavorMatrix } from "@/components/FlavorMatrix";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <main className="km-home flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-clip text-[var(--km-ink)] lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <SiteHeader active="map" />

      <div id="matrix" className="min-w-0 w-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <FlavorMatrix />
      </div>

      <DiscoverDailyHint />
    </main>
  );
}
