import { Dices, Lightbulb, Swords, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemType } from "@/lib/types";

const ICONS = {
  weapon: Swords,
  energy: Zap,
  wisdom: Lightbulb,
  help: Users,
  chance: Dices,
} as const;

export function ItemIcon({
  type,
  className,
}: {
  type: ItemType;
  className?: string;
}) {
  const Icon = ICONS[type];
  return <Icon className={cn("size-5", className)} aria-hidden="true" />;
}
