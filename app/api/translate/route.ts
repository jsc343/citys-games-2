import { generateText } from "ai";
import { isLang, languageInfo } from "@/lib/languages";

export const maxDuration = 60;

const MAX_BATCH = 60;
const MAX_TEXT = 600;

const globalCache = globalThis as unknown as {
  __cgTranslations?: Map<string, string>;
};
const cache = (globalCache.__cgTranslations ??= new Map<string, string>());

export async function POST(req: Request) {
  let body: { lang?: unknown; texts?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!isLang(body.lang) || !Array.isArray(body.texts)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const lang = body.lang;
  const texts = (body.texts as unknown[])
    .filter((t): t is string => typeof t === "string")
    .slice(0, MAX_BATCH)
    .map((t) => t.slice(0, MAX_TEXT));

  const out: string[] = texts.map((t) => cache.get(`${lang}|${t}`) ?? "");
  const missing = texts
    .map((t, i) => ({ t, i }))
    .filter(({ i }) => out[i] === "");

  if (lang === "en" || lang === "zh") {
    return Response.json({ translations: texts });
  }

  if (missing.length > 0) {
    try {
      const target = languageInfo(lang).english;
      const { text } = await generateText({
        model: "google/gemini-2.5-flash",
        prompt:
          `Translate each UI string in the JSON array below from English into ${target}. ` +
          `This is for a mobile game app about historical heroes; keep names of people, ` +
          `"Pi", "City's Games(2)" and numbers as they are, and keep line breaks and punctuation style. ` +
          `Reply with ONLY a JSON array of strings, the same length and order as the input.\n\n` +
          JSON.stringify(missing.map((m) => m.t)),
      });
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      const parsed: unknown = JSON.parse(text.slice(start, end + 1));
      if (Array.isArray(parsed) && parsed.length === missing.length) {
        missing.forEach(({ t, i }, k) => {
          const v = parsed[k];
          if (typeof v === "string" && v.trim()) {
            cache.set(`${lang}|${t}`, v);
            out[i] = v;
          }
        });
      }
    } catch (err) {
      console.log("[v0] translate failed:", err instanceof Error ? err.message : err);
    }
  }

  return Response.json({
    translations: texts.map((t, i) => (out[i] !== "" ? out[i] : t)),
  });
}
