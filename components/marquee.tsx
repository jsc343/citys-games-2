import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const list = items.length > 0 ? items : [""];
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm",
        className,
      )}
    >
      <Megaphone className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="relative min-w-0 flex-1 overflow-hidden" aria-label={list.join(" / ")}>
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap" aria-hidden="true">
          {[0, 1].map((n) => (
            <div key={n} className="flex gap-12">
              {list.map((t, i) => (
                <span key={`${n}-${i}`}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
