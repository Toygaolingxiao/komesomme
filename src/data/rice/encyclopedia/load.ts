import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type {
  RiceEncyclopediaArticle,
  RiceEncyclopediaManifestEntry,
} from "@/types/riceEncyclopedia";

const ROOT = path.join(process.cwd(), "src/data/rice/encyclopedia");
const ARTICLES_DIR = path.join(ROOT, "articles");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");

export function encyclopediaManifest(): RiceEncyclopediaManifestEntry[] {
  if (!existsSync(MANIFEST_PATH)) return [];
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as {
    entries?: RiceEncyclopediaManifestEntry[];
  };
  return Array.isArray(raw.entries) ? raw.entries : [];
}

export function loadEncyclopediaArticle(
  id: string,
): RiceEncyclopediaArticle | null {
  const file = path.join(ARTICLES_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as RiceEncyclopediaArticle;
}

export function listEncyclopediaArticleIds(): string[] {
  if (!existsSync(ARTICLES_DIR)) return [];
  return readdirSync(ARTICLES_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""));
}
