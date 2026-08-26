import { NextResponse } from "next/server";

/**
 * AI RAG recommend endpoint (streaming). Stub for Phase 1 wiring.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", message: "RAG recommend stream coming soon." },
    { status: 501 }
  );
}
