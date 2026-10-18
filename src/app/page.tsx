import { FlavorMatrix } from "@/components/FlavorMatrix";
import { SiteHeader } from "@/components/SiteHeader";
import { riceProfiles } from "@/data/rice/catalog";
import { RICE_REGIONS } from "@/lib/rice/regions";

export default function HomePage() {
  return (
    <main className="km-home flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-clip text-[var(--km-ink)] lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <SiteHeader active="map" />

      <div id="matrix" className="min-w-0 w-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <FlavorMatrix initialProfiles={riceProfiles} initialRegions={[...RICE_REGIONS]} />
      </div>
    </main>
  );
}
