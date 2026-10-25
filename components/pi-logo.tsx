import { cn } from "@/lib/utils";

export function PiLogo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Pi"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full bg-primary font-display text-xl font-black leading-none text-primary-foreground",
        className,
      )}
    >
      {"\u03C0"}
    </span>
  );
}
