"use client";

import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGame } from "@/contexts/game-context";
import { LANGUAGES } from "@/lib/languages";

export function LanguageButton() {
  const { lang, setLang, tr } = useGame();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={tr("選擇語言", "Choose language")}
        >
          <Globe className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tr("選擇語言", "Choose language")}</DialogTitle>
          <DialogDescription>
            {tr(
              "介面文字會切換為你選的語言；遊戲內的旁白語音目前僅支援中文與英文。",
              "The interface switches to the language you pick; in-game spoken narration is only available in Chinese and English for now.",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {LANGUAGES.map((o) => (
            <Button
              key={o.id}
              variant={lang === o.id ? "default" : "secondary"}
              className="justify-between"
              onClick={() => setLang(o.id)}
            >
              <span className="flex flex-col items-start">
                <span>{o.label}</span>
                {o.id !== "zh" && o.id !== "en" && (
                  <span className="text-[10px] opacity-70">{o.english}</span>
                )}
              </span>
              {lang === o.id && <Check className="size-4" />}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
