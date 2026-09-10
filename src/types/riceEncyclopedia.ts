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

export type EncyclopediaFactStatus = "unverified" | "partial" | "verified";

export type EncyclopediaSourceKind =
  | "naro"
  | "pref_gov"
  | "kokken"
  | "brand_official"
  | "maff"
  | "other_official";

export type EncyclopediaEditorialSource = {
  id: string;
  organization: string;
  title: string;
  /** Official / quasi-official URL — required; never invent. */
  url: string;
  accessed_on: string;
  source_kind: EncyclopediaSourceKind;
  notes?: string;
};

export type EncyclopediaClaimStatus =
  | "verified"
  | "partial"
  | "unverified"
  | "removed"
  | "tradition";

export type EncyclopediaClaim = {
  id: string;
  field_path: string;
  claim_text: string;
  status: EncyclopediaClaimStatus;
  source_ids: string[];
  notes?: string;
  verified_at?: string;
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
  /** Set when human/GPT revision overwrote Gemini draft copy. */
  revisedAt?: string;
  revisionSource?: string;
  /** Fact-check rollup for the article. */
  factStatus?: EncyclopediaFactStatus;
  /** SHA-256 prefix of editorial body fields. */
  contentHash?: string;
  /** Default official source ids from registry.json. */
  sourceIds?: string[];
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
