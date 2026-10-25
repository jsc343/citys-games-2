"use client";

import { useEffect } from "react";
import { useGame } from "@/contexts/game-context";
import type { Lang } from "@/lib/types";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CANVAS", "NOSCRIPT", "CODE"]);
const BATCH = 40;

interface NodeRecord {
  source: string;
  output: string;
}

const memory = new Map<string, string>();

function textNodes(root: Node): Text[] {
  const found: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      const value = node.nodeValue ?? "";
      if (!/[A-Za-z]{2,}/.test(value)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n = walker.nextNode();
  while (n) {
    found.push(n as Text);
    n = walker.nextNode();
  }
  return found;
}

/**
 * Translates visible English text into the chosen language. Chinese and
 * English use the built-in strings; every other language is translated on
 * demand and remembered so each phrase is only translated once.
 */
export function TranslateLayer() {
  const { lang } = useGame();

  useEffect(() => {
    const records = new WeakMap<Text, NodeRecord>();
    const tracked = new Set<Text>();

    const restore = () => {
      tracked.forEach((node) => {
        const rec = records.get(node);
        if (rec && node.isConnected && node.nodeValue === rec.output) {
          node.nodeValue = rec.source;
        }
      });
      tracked.clear();
    };

    if (lang === "zh" || lang === "en") {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let again = false;

    const translateBatch = async (target: Lang, texts: string[]) => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang: target, texts }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { translations?: string[] };
        data.translations?.forEach((value, i) => {
          if (typeof value === "string" && value && value !== texts[i]) {
            memory.set(`${target}|${texts[i]}`, value);
          }
        });
      } catch {
        // Network trouble: the English text simply stays on screen.
      }
    };

    const apply = (nodes: Text[]) => {
      for (const node of nodes) {
        const raw = node.nodeValue ?? "";
        const existing = records.get(node);
        if (existing && raw === existing.output) continue;
        const core = raw.trim();
        const translated = memory.get(`${lang}|${core}`);
        if (!translated) continue;
        const lead = raw.slice(0, raw.indexOf(core));
        const trail = raw.slice(raw.indexOf(core) + core.length);
        const output = `${lead}${translated}${trail}`;
        records.set(node, { source: raw, output });
        tracked.add(node);
        node.nodeValue = output;
      }
    };

    const run = async () => {
      if (running) {
        again = true;
        return;
      }
      running = true;
      do {
        again = false;
        const nodes = textNodes(document.body).filter((node) => {
          const rec = records.get(node);
          return !(rec && node.nodeValue === rec.output);
        });
        const pending = Array.from(
          new Set(
            nodes
              .map((n) => (n.nodeValue ?? "").trim())
              .filter((t) => t && !memory.has(`${lang}|${t}`)),
          ),
        );
        for (let i = 0; i < pending.length && !cancelled; i += BATCH) {
          await translateBatch(lang, pending.slice(i, i + BATCH));
          if (!cancelled) apply(nodes);
        }
        if (!cancelled) apply(nodes);
      } while (again && !cancelled);
      running = false;
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void run(), 250);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      observer.disconnect();
      restore();
    };
  }, [lang]);

  return null;
}
