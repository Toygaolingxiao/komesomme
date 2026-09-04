/**
 * Upsert catalogue ids/names into Yahoo official-affiliate short-link tables.
 * Does not overwrite promo_url.
 *
 *   npm run yahoo:sync
 *   npm run yahoo:sync:furusato
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import {
  syncYahooAffiliateBrandRows,
  syncYahooFurusatoAffiliateBrandRows,
} from "@/lib/affiliate/yahooPromo";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const furusato = process.argv.includes("--furusato");

async function main() {
  try {
    const result = furusato
      ? await syncYahooFurusatoAffiliateBrandRows()
      : await syncYahooAffiliateBrandRows();
    console.log(
      `${furusato ? "furusato" : "shopping"} upserted ${result.upserted} rows, ${result.filled} have promo_url`,
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    if (message === "table missing" || /does not exist|schema cache/i.test(message)) {
      const file = furusato
        ? "0012_yahoo_furusato_affiliate_links.sql"
        : "0006_yahoo_shopping_affiliate_links.sql";
      console.error(`Table missing. Run supabase/migrations/${file} in the SQL Editor, then retry.`);
      process.exit(1);
    }
    throw cause;
  }
}

main().catch((cause) => {
  console.error(cause);
  process.exit(1);
});
