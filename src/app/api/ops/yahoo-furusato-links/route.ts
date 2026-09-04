import { createYahooLinksHandlers } from "@/lib/ops/yahooLinksHandlers";

export const runtime = "nodejs";

export const { GET, POST, PATCH } = createYahooLinksHandlers("furusato");
