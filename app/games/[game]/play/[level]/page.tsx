"use client";

import { useParams } from "next/navigation";
import { LevelPlayer } from "@/components/play/level-player";
import { GAME_IDS, type GameId } from "@/lib/types";

export default function PlayPage() {
  const params = useParams<{ game: string; level: string }>();
  const game = GAME_IDS.find((g) => g === params.game) as GameId | undefined;
  const level = Number(params.level);
  if (!game || !Number.isInteger(level)) {
    return <LevelPlayer gameId="xiangyu" level={0} />;
  }
  return <LevelPlayer gameId={game} level={level} />;
}
