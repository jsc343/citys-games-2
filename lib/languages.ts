import type { Lang } from "@/lib/types";

export interface LanguageInfo {
  id: Lang;
  label: string;
  bcp: string;
  english: string;
  rtl?: boolean;
}

export const LANGUAGES: LanguageInfo[] = [
  { id: "zh", label: "繁體中文", bcp: "zh-TW", english: "Traditional Chinese" },
  { id: "en", label: "English", bcp: "en-US", english: "English" },
  { id: "ja", label: "日本語", bcp: "ja-JP", english: "Japanese" },
  { id: "ko", label: "한국어", bcp: "ko-KR", english: "Korean" },
  { id: "es", label: "Español", bcp: "es-ES", english: "Spanish" },
  { id: "fr", label: "Français", bcp: "fr-FR", english: "French" },
  { id: "de", label: "Deutsch", bcp: "de-DE", english: "German" },
  { id: "pt", label: "Português", bcp: "pt-BR", english: "Brazilian Portuguese" },
  { id: "ru", label: "Русский", bcp: "ru-RU", english: "Russian" },
  { id: "id", label: "Bahasa Indonesia", bcp: "id-ID", english: "Indonesian" },
  { id: "vi", label: "Tiếng Việt", bcp: "vi-VN", english: "Vietnamese" },
  { id: "th", label: "ไทย", bcp: "th-TH", english: "Thai" },
  { id: "ar", label: "العربية", bcp: "ar-SA", english: "Arabic", rtl: true },
  { id: "hi", label: "हिन्दी", bcp: "hi-IN", english: "Hindi" },
  { id: "tr", label: "Türkçe", bcp: "tr-TR", english: "Turkish" },
  { id: "fil", label: "Filipino", bcp: "fil-PH", english: "Filipino" },
  { id: "it", label: "Italiano", bcp: "it-IT", english: "Italian" },
  { id: "nl", label: "Nederlands", bcp: "nl-NL", english: "Dutch" },
  { id: "pl", label: "Polski", bcp: "pl-PL", english: "Polish" },
  { id: "uk", label: "Українська", bcp: "uk-UA", english: "Ukrainian" },
  { id: "ms", label: "Bahasa Melayu", bcp: "ms-MY", english: "Malay" },
  { id: "bn", label: "বাংলা", bcp: "bn-BD", english: "Bengali" },
];

export function languageInfo(lang: Lang): LanguageInfo {
  return LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[1];
}

export function speechLang(lang: Lang): string {
  return languageInfo(lang).bcp;
}

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && LANGUAGES.some((l) => l.id === value);
}
