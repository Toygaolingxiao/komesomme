import { encode } from "uqr";

const INK = "#2A221A";
const GOLD = "#C9952E";

/**
 * Brand-tinted QR (rounded modules + soft gold finder eyes).
 * Local only — no third-party beautify API.
 */
export function shareCardQrDataUrl(pageUrl: string): string {
  const { size, data } = encode(pageUrl, { ecc: "M" });
  const cell = 5;
  const pad = 2;
  const dim = (size + pad * 2) * cell;
  const r = cell * 0.42;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}">`,
    `<rect width="100%" height="100%" rx="${cell * 1.2}" fill="#FFFDF8"/>`,
  ];

  for (let y = 0; y < size; y += 1) {
    const row = data[y];
    for (let x = 0; x < size; x += 1) {
      if (!row[x]) continue;
      const cx = (x + pad) * cell + cell / 2;
      const cy = (y + pad) * cell + cell / 2;
      const inFinder =
        (x < 7 && y < 7) ||
        (x >= size - 7 && y < 7) ||
        (x < 7 && y >= size - 7);
      const fill = inFinder ? GOLD : INK;
      parts.push(
        `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}"/>`
      );
    }
  }

  parts.push("</svg>");
  return `data:image/svg+xml;base64,${Buffer.from(parts.join("")).toString("base64")}`;
}
