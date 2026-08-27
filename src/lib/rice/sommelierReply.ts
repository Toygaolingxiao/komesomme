import { GoogleGenAI } from "@google/genai";
import { nameMatch } from "./semanticScore";

const GEMINI_CHAT_MODEL = "gemini-3.6-flash";
const OPENAI_CHAT_MODEL = "gpt-4o-mini";
const MAX_REPLY_CHARS = 180;

const BANNED = ["最強", "圧倒的", "究極", "唯一無二", "爆発", "神", "無敵"];

export type SommelierMatchBrief = {
  name: string;
  prefecture: string;
  reason: string;
};

function fallbackReply(query: string, matches: SommelierMatchBrief[]): string {
  const top = matches[0];
  if (!top) {
    return "ご相談の内容に近い銘柄を探しています。言葉を少し変えて、もう一度聞いてみてください。";
  }
  if (nameMatch(query, top.name)) {
    const reason = top.reason.trim();
    const text = reason.includes(top.name)
      ? reason
      : `${top.name}は、${reason}`;
    return clipReply(text);
  }
  const cue = query.replace(/\s+/g, "").slice(0, 16);
  const text = cue
    ? `「${cue}」なら、${top.prefecture}の${top.name}です。${top.reason}`
    : `${top.prefecture}の${top.name}です。${top.reason}`;
  return clipReply(text);
}

function clipReply(text: string): string {
  if (text.length <= MAX_REPLY_CHARS) return text;
  const slice = text.slice(0, MAX_REPLY_CHARS);
  const stop = Math.max(slice.lastIndexOf("。"), slice.lastIndexOf("！"));
  if (stop >= 24) return slice.slice(0, stop + 1);
  return `${slice.slice(0, MAX_REPLY_CHARS - 1)}…`;
}

function looksBroken(text: string): boolean {
  if (text.length < 18) return true;
  if (/^(確認|候補|リスト)[：:]/.test(text)) return true;
  if (/^[0-9０-９]+\.\s/.test(text)) return true;
  if (
    /禁止事項|番号付き|禁止語|確認：|候補:|思考過程|ゲストの相談|出力は本文|結びついて/.test(
      text
    )
  ) {
    return true;
  }
  if (
    /thought process|confirmation questions?|prohibitions?|ONLY\s+\d+\s+sentences?|main text/i.test(
      text
    )
  ) {
    return true;
  }
  // Guest-facing copy is Japanese. A run of English is almost always a leaked rule.
  const latin = text.match(/[A-Za-z]{2,}/g) ?? [];
  if (latin.length >= 4 || latin.join("").length >= 16) return true;
  const opens = (text.match(/「/g) ?? []).length;
  const closes = (text.match(/」/g) ?? []).length;
  return opens !== closes;
}

function cleanReply(text: string, query: string, matches: SommelierMatchBrief[]): string {
  let next = text.replace(/\s+/g, " ").trim();
  for (const word of BANNED) {
    if (next.includes(word)) return fallbackReply(query, matches);
  }
  next = clipReply(next);
  if (looksBroken(next)) return fallbackReply(query, matches);
  return next;
}

function buildPrompt(query: string, matches: SommelierMatchBrief[]): string {
  const list = matches
    .map(
      (match, index) =>
        `${index + 1}. ${match.name}（${match.prefecture}）: ${match.reason}`
    )
    .join("\n");

  return `役割: 米ソムリエ。出力: 日本語の本文2文のみ。
候補以外の銘柄名は出さない。知らない相性は書かない。
相談が候補の銘柄を名指しし、料理や向きを聞いているなら、その銘柄の料理向きを答える。質問文を繰り返さない。
産地・地名なら、その土地の候補を味わいで短く勧める。
料理・酒・気分の言葉があれば、どちらかの文で拾う。
使わない語: ${BANNED.join("、")}

相談: ${query}

候補:
${list}`;
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as {
    text?: unknown;
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
  };
  const parts = record.candidates?.[0]?.content?.parts ?? [];
  const spoken = parts
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (spoken) return spoken;
  if (typeof record.text === "string" && record.text.trim()) return record.text.trim();
  return "";
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });
  const base = { temperature: 0.4, maxOutputTokens: 512 };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents: prompt,
      config: {
        ...base,
        thinkingConfig: { thinkingBudget: 0, includeThoughts: false },
      },
    });
    return extractGeminiText(response);
  } catch (cause) {
    console.warn("Gemini thinkingConfig rejected, retrying without it:", cause);
    const response = await ai.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents: prompt,
      config: base,
    });
    return extractGeminiText(response);
  }
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      temperature: 0.4,
      max_tokens: 220,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`${OPENAI_CHAT_MODEL}: ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

/**
 * Short spoken reply after retrieval. Never invents brands: the prompt may
 * only name the already-ranked matches. Failures fall back to Flavor Bridge.
 */
export async function generateSommelierReply(
  query: string,
  matches: SommelierMatchBrief[]
): Promise<string> {
  if (matches.length === 0) return fallbackReply(query, matches);

  const prompt = buildPrompt(query, matches);

  try {
    const raw = process.env.GEMINI_API_KEY?.trim()
      ? await generateWithGemini(prompt)
      : await generateWithOpenAI(prompt);
    if (!raw.trim()) return fallbackReply(query, matches);
    return cleanReply(raw, query, matches);
  } catch (cause) {
    console.error("Sommelier reply generation failed:", cause);
    if (process.env.GEMINI_API_KEY?.trim() && process.env.OPENAI_API_KEY?.trim()) {
      try {
        const raw = await generateWithOpenAI(prompt);
        if (raw.trim()) return cleanReply(raw, query, matches);
      } catch (fallbackCause) {
        console.error("OpenAI sommelier fallback failed:", fallbackCause);
      }
    }
    return fallbackReply(query, matches);
  }
}
