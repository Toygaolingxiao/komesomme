/**
 * AI-assisted editorial encyclopedia for each brand.
 * Not official lab data. Purchase prices are qualitative guidance only.
 */

export type EncyclopediaFeature = {
  title: string;
  body: string;
};

export type EncyclopediaCookingTip = {
  title: string;
  body: string;
};

export type RiceEncyclopediaArticle = {
  id: string;
  name: string;
  /** Hiragana / katakana reading when known. */
  reading: string;
  headline: string;
  origin: string;
  features: EncyclopediaFeature[];
  cookingTips: EncyclopediaCookingTip[];
  servingIdeas: string[];
  /** Qualitative purchase guidance — no scraped mall prices. */
  purchaseNotes: string;
  /** Editorial caveats / uncertainty. */
  caveats: string;
  confidence: "high" | "medium" | "low";
  generatedAt: string;
  model: string;
};

export type RiceEncyclopediaManifestEntry = {
  id: string;
  name: string;
  reading: string;
  prefecture: string;
  region: string;
  headline: string;
  confidence: RiceEncyclopediaArticle["confidence"];
  sweetness: number;
  hardness: number;
  stickiness: number;
};
