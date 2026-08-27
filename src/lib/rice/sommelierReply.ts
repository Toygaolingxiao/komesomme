import { GoogleGenAI } from "@google/genai";

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
  const cue = query.replace(/\s+/g, "").slice(0, 16);
  const text = cue
    ? `「${cue}」なら、${top.prefecture}の${top.name}です。${top.reason}`
    : `${top.prefecture}の${top.name}です。${top.reason}`;
  return text.length > MAX_REPLY_CHARS ? `${text.slice(0, MAX_REPLY_CHARS - 1)}…` : text;
}

function cleanReply(text: string, query: string, matches: SommelierMatchBrief[]): string {
  let next = text.replace(/\s+/g, " ").trim();
  for (const word of BANNED) {
    if (next.includes(word)) return fallbackReply(query, matches);
  }
  if (next.length > MAX_REPLY_CHARS) {
    next = `${next.slice(0, MAX_REPLY_CHARS - 1)}…`;
  }
  return next;
}

function buildPrompt(query: string, matches: SommelierMatchBrief[]): string {
  const list = matches
    .map(
      (match, index) =>
        `${index + 1}. ${match.name}（${match.prefecture}）: ${match.reason}`
    )
    .join("\n");

  return `あなたは米ソムリエです。ゲストの相談に、日本語で2文だけ答えてください。
口調はやさしく、短く、具体的に。銘柄は次の候補だけを使います。新しい銘柄名は作らないでください。
ゲストの相談に出てくる具体的な言葉（料理・酒・食後・果物など）を、必ずどちらかの文で拾ってください。
「和食に合う」「食卓に寄り添う」だけの一般論は禁止です。
候補に書いてある味わいと、相談の言葉だけを結びつける。知らない相性の事実は作らないでください。
禁止語: ${BANNED.join("、")}
絵文字は使いません。

相談: ${query}

候補:
${list}`;
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as { text?: unknown; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  if (typeof record.text === "string" && record.text.trim()) return record.text;
  const parts = record.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part.text ?? "").join("").trim();
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_CHAT_MODEL,
    contents: prompt,
    config: { temperature: 0.4, maxOutputTokens: 220 },
  });

  return extractGeminiText(response);
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
