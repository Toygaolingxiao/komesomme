/**
 * Upsert catalogue ids/names into yahoo_shopping_affiliate_links.
 * Does not overwrite promo_url. Run 0006 in the SQL Editor first.
 *
 *   npm run yahoo:sync
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import { syncYahooAffiliateBrandRows } from "@/lib/affiliate/yahooPromo";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  try {
    const result = await syncYahooAffiliateBrandRows();
    console.log(`upserted ${result.upserted} rows, ${result.filled} have promo_url`);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    if (message === "table missing" || /does not exist|schema cache/i.test(message)) {
      console.error(
        "Table missing. Run supabase/migrations/0006_yahoo_shopping_affiliate_links.sql in the SQL Editor, then retry.",
      );
      process.exit(1);
    }
    throw cause;
  }
}

main().catch((cause) => {
  console.error(cause);
  process.exit(1);
});
