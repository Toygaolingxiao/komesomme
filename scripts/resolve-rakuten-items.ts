import { config as loadEnv } from "dotenv";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import { recommendRakutenItem } from "@/lib/rakuten/ichiba";
import { riceRakutenKeyword } from "@/lib/rakuten/keyword";

loadEnv({ path: ".env.local" });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const idFlag = args.find((arg) => arg.startsWith("--id="))?.slice(5);

  const targets = all
    ? riceProfiles
    : idFlag
      ? [findRiceProfile(idFlag)].filter((rice): rice is NonNullable<typeof rice> => Boolean(rice))
      : riceProfiles.slice(0, 5);

  if (targets.length === 0) {
    console.error("No matching rice profiles.");
    process.exit(1);
  }

  for (const [index, rice] of targets.entries()) {
    const keyword = riceRakutenKeyword(rice);
    const result = await recommendRakutenItem({
      keyword,
      brandName: rice.name,
    });
    console.log(
      JSON.stringify({
        id: rice.id,
        name: rice.name,
        keyword,
        ...result,
      })
    );
    if (index < targets.length - 1) await sleep(1100);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
