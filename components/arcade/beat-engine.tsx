"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronsUp, ChevronsDown, Hand, Footprints, RotateCcw, Crosshair, Swords } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ItemIcon } from "@/components/item-icon";
import { playSfx, type SfxKind } from "@/lib/audio";
import { MODE_TEXT, type SectionDef, type StagePlan } from "@/lib/games/stages";
import { dropsFor, itemName, MAX_DROPS_PER_BATTLE, type GearStats, type WeaponDef } from "@/lib/games/loadout";
import { ITEM_META } from "@/lib/items";
import type { GameId, ItemType, L } from "@/lib/types";
import type { Fighter, FloatText, Mine, Projectile, Spark, Strike } from "./types";
import { drawLighting, drawScene, GROUND_NEAR, HORIZON, VH, VW } from "./draw-scene";
import { drawFighter, drawTele } from "./draw-fighter";

export interface Scoring {
  hit: number;
  whiff: number;
  hurt: number;
  grunt: number;
  elite: number;
  boss: number;
  ally: number;
}

export interface BattleResult {
  sections: boolean[];
  passed: boolean;
  gain: number;
  loss: number;
  kills: number;
  maxCombo: number;
}

interface Props {
  gameId: GameId;
  level: number;
  weapons: WeaponDef[];
  gear?: GearStats;
  onGrantItem: (t: ItemType) => void;
  plan: StagePlan;
  strength: number;
  diff: { count: number; hazard: number; elite: number };
  scoring: Scoring;
  sfx: boolean;
  bossName: string;
  items: Record<ItemType, number>;
  onUseItem: (t: ItemType) => boolean;
  tr: (zh: string, en: string) => string;
  pick: (l: L) => string;
  onFinish: (r: BattleResult) => void;
}

type Phase = "intro" | "play" | "clear" | "dead" | "done";

interface Hud {
  hp: number;
  mhp: number;
  net: number;
  combo: number;
  sec: number;
  phase: Phase;
  time: number;
  bossHp: number;
  bossMax: number;
  left: number;
  boost: number;
  slow: number;
  allies: number;
  progress: number;
  weapon: number;
}

const KIND: Record<string, { hp: number; dmg: number; spd: number; scale: number }> = {
  grunt: { hp: 32, dmg: 7, spd: 52, scale: 1 },
  archer: { hp: 24, dmg: 7, spd: 44, scale: 1 },
  gunner: { hp: 24, dmg: 7, spd: 44, scale: 1 },
  grenadier: { hp: 30, dmg: 15, spd: 40, scale: 1 },
  cavalry: { hp: 54, dmg: 16, spd: 62, scale: 1.05 },
  elite: { hp: 82, dmg: 13, spd: 50, scale: 1.18 },
  boss: { hp: 240, dmg: 17, spd: 56, scale: 1.4 },
  gladiator: { hp: 62, dmg: 10, spd: 58, scale: 1.05 },
  beast: { hp: 50, dmg: 11, spd: 84, scale: 1 },
};

const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const groundY = (z: number) => HORIZON + 16 + z * (GROUND_NEAR - HORIZON - 16);
const scaleAt = (z: number) => 1.0 + z * 0.55;

function HoldButton({
  onDown,
  onUp,
  className,
  label,
  children,
}: {
  onDown: () => void;
  onUp?: () => void;
  className?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`touch-none select-none rounded-xl border border-border bg-secondary text-secondary-foreground shadow-sm active:scale-95 active:bg-primary active:text-primary-foreground ${className ?? ""}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={() => onUp?.()}
      onPointerCancel={() => onUp?.()}
      onLostPointerCapture={() => onUp?.()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export function BeatEngine(props: Props) {
  const propsRef = useRef(props);
  propsRef.current = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef({ l: false, r: false, u: false, d: false, crouch: false, jump: false, hand: false, foot: false });
  const api = useRef<{ revive: () => void; giveUp: () => void; item: (t: ItemType) => void; swap: () => void } | null>(null);
  const [hud, setHud] = useState<Hud>({
    hp: 100, mhp: 100, net: 0, combo: 0, sec: 0, phase: "intro", time: 0,
    bossHp: 0, bossMax: 0, left: 0, boost: 0, slow: 0, allies: 0, progress: 0, weapon: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = VW * dpr;
    canvas.height = VH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { gameId, plan } = propsRef.current;
    const total = plan.sections.length;
    let nextId = 1;

    const mk = (team: "p" | "e" | "a", kind: string, x: number, z: number): Fighter => {
      const { strength } = propsRef.current;
      const k = KIND[kind] ?? KIND.grunt;
      const isP = team === "p";
      const hpMul = isP ? 1 : team === "a" ? 0.8 : 0.75 + 0.55 * strength;
      const hp = isP ? 100 : Math.round(k.hp * hpMul);
      const ranged = team === "a" ? gameId === "normandy" : kind === "archer" || kind === "gunner" || kind === "grenadier";
      return {
        id: nextId++, team, kind, style: gameId, x, z, h: 0, vh: 0, hp, mhp: hp, dir: team === "e" ? -1 : 1,
        speed: isP ? 120 : k.spd * (0.85 + 0.3 * strength), dmg: k.dmg * (0.7 + 0.5 * strength),
        crouch: false, atk: 0, atkDur: 0.26, atkType: "", cd: rand(0.4, 1.2), flash: 0, inv: 0, tele: 0,
        teleType: "", teleMax: 0, guard: 0, walkT: 0, dead: 0, dash: 0, active: true, ranged,
        scale: isP ? 1 : k.scale, moving: false, glow: 0,
      };
    };

    const G = {
      t: 0, sec: 0, phase: "intro" as Phase, phaseT: 1.9,
      fighters: [] as Fighter[], proj: [] as Projectile[], strikes: [] as Strike[], mines: [] as Mine[],
      sparks: [] as Spark[], texts: [] as FloatText[],
      player: mk("p", "player", 60, 0.55),
      cam: 0, worldW: VW, shake: 0, gain: 0, loss: 0, combo: 0, comboT: 0, maxCombo: 0, kills: 0,
      results: [] as boolean[], toSpawn: 0, spawnT: 1, hazT: 2, secT: 0, boost: 0, slow: 0, allyT: 0,
      goalX: 0, minionT: 6, chain: 0, chainT: 0, finished: false, frame: 0,
      weapon: 0, drops: 0,
    };
    const weaponNow = (): WeaponDef => propsRef.current.weapons[G.weapon] ?? propsRef.current.weapons[0];
    const applyWeapon = () => {
      const w = weaponNow();
      G.player.wlen = w.len;
      G.player.ranged = w.ranged;
    };
    const swapWeapon = () => {
      const list = propsRef.current.weapons;
      if (list.length < 2 || G.phase !== "play") return;
      G.weapon = (G.weapon + 1) % list.length;
      applyWeapon();
      G.player.cd = Math.max(G.player.cd, 0.15);
      playSfx("pickup", propsRef.current.sfx);
      G.texts.push({ x: G.player.x, y: groundY(G.player.z) - 84, text: propsRef.current.pick(weaponNow().name), life: 0.9, color: "#f0d078" });
    };

    const sfx = (k: SfxKind) => playSfx(k, propsRef.current.sfx);
    const text = (x: number, y: number, s: string, color: string) => G.texts.push({ x, y, text: s, life: 0.9, color });
    const burst = (x: number, y: number, color: string, n: number, speed = 90) => {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2);
        G.sparks.push({ x, y, vx: Math.cos(a) * rand(20, speed), vy: Math.sin(a) * rand(20, speed) - 30, life: rand(0.25, 0.6), color, size: rand(1.5, 3) });
      }
    };
    const comboMult = () => Math.min(2, 1 + G.combo * 0.1);
    const foes = (f: Fighter) => G.fighters.filter((o) => (f.team === "e" ? o.team !== "e" : o.team === "e") && o.dead <= 0 && o.hp > 0 && (o.team !== "e" || o.active || true));
    const alive = () => G.fighters.filter((f) => f.team === "e" && f.dead <= 0 && f.hp > 0);

    const killValue = (f: Fighter) => {
      const s = propsRef.current.scoring;
      if (f.kind === "boss") return s.boss;
      if (f.kind === "elite") return s.elite;
      if (f.kind === "cavalry" || f.kind === "grenadier") return s.grunt * 1.5;
      return s.grunt;
    };

    const damage = (t: Fighter, amount: number, src: Fighter | null, type: "hand" | "foot" | "swing" | "hazard", knock = 8) => {
      if (t.dead > 0 || t.hp <= 0) return false;
      if (t.team === "p") {
        if (t.inv > 0) return false;
        const reduction = Math.min(0.6, (propsRef.current.gear?.def ?? 0) + (gameId === "gladiator" && G.boost > 0 ? 0.3 : 0));
        amount *= 1 - reduction;
        t.hp -= amount;
        t.inv = 0.55;
        t.flash = 0.12;
        G.shake = 6;
        G.loss += propsRef.current.scoring.hurt;
        G.combo = 0;
        sfx("hurt");
        text(t.x, groundY(t.z) - 60, `-${Math.round(amount)}`, "#ff6a5a");
        burst(t.x, groundY(t.z) - 26, "#d83a2a", 8);
        if (t.hp <= 0) {
          t.hp = 0;
          G.phase = "dead";
          sfx("lose");
        }
        return true;
      }
      let dmg = amount;
      if (t.guard > 0 && type === "hand") {
        dmg *= 0.12;
        burst(t.x + t.dir * 8, groundY(t.z) - 26, "#fff2b0", 6);
        sfx("hit");
        text(t.x, groundY(t.z) - 64, tr0("格擋", "Block"), "#f0d078");
      } else if (t.guard > 0 && type === "foot") {
        t.guard = 0;
        t.cd += 0.7;
        text(t.x, groundY(t.z) - 64, tr0("破防", "Guard break"), "#7ae0a0");
      }
      t.hp -= dmg;
      t.flash = 0.1;
      t.x += (src ? Math.sign(t.x - src.x) || 1 : 1) * knock;
      t.x = clamp(t.x, 8, G.worldW - 8);
      if (t.team === "e") t.active = true;
      if (src && src.team === "p") {
        G.combo += 1;
        G.comboT = 1.7;
        G.maxCombo = Math.max(G.maxCombo, G.combo);
        G.gain += propsRef.current.scoring.hit * comboMult();
        text(t.x, groundY(t.z) - 58, `${Math.round(dmg)}`, G.combo >= 4 ? "#ffd23a" : "#ffffff");
      }
      if (t.hp <= 0) {
        t.hp = 0;
        t.dead = 0.6;
        sfx("ko");
        burst(t.x, groundY(t.z) - 22, "#e8d0a0", 12);
        if (t.team === "e") {
          G.kills += 1;
          G.gain += killValue(t) * comboMult();
          text(t.x, groundY(t.z) - 74, `+${Math.round(killValue(t) * comboMult())}`, "#7ae0a0");
          if (src && src.team !== "e" && (t.kind === "boss" || G.drops < MAX_DROPS_PER_BATTLE)) {
            dropsFor(gameId, t.kind, propsRef.current.level).forEach((it, i) => {
              G.drops += 1;
              propsRef.current.onGrantItem(it);
              sfx("pickup");
              burst(t.x, groundY(t.z) - 30, "#ffd23a", 10, 70);
              G.texts.push({ x: t.x, y: groundY(t.z) - 96 - i * 14, text: `${tr0("獲得", "Found")} ${propsRef.current.pick(itemName(gameId, it, ITEM_META[it].name))}`, life: 1.6, color: "#ffd23a" });
            });
          }
        } else if (t.team === "a") {
          G.loss += propsRef.current.scoring.ally;
          text(t.x, groundY(t.z) - 70, tr0("隊友倒下", "Ally down"), "#ff8a7a");
        }
      }
      return true;
    };

    const tr0 = (zh: string, en: string) => propsRef.current.tr(zh, en);

    const spawnEnemy = (kind: string, x: number, z: number, active = true) => {
      const e = mk("e", kind, x, z);
      e.active = active;
      G.fighters.push(e);
      return e;
    };

    const startSection = (i: number, healPct = 0.25) => {
      const def: SectionDef = plan.sections[i];
      const { strength, bossName } = propsRef.current;
      G.sec = i;
      G.fighters = [];
      G.proj = [];
      G.strikes = [];
      G.mines = [];
      G.allyT = 0;
      const p = G.player;
      p.hp = Math.min(p.mhp, p.hp + p.mhp * healPct);
      p.x = 60;
      p.z = 0.55;
      p.h = 0;
      p.inv = 1;
      p.dead = 0;
      G.fighters.push(p);
      G.worldW = def.mode === "advance" ? 1500 : VW;
      G.goalX = G.worldW - 50;
      G.cam = 0;
      const dv = propsRef.current.diff;
      G.toSpawn = Math.max(2, Math.round(def.count * dv.count));
      G.spawnT = 1.2;
      G.hazT = 2.5 / dv.hazard;
      G.secT = def.time;
      G.minionT = 6;
      if (def.mode === "boss") {
        const b = spawnEnemy("boss", VW - 90, 0.5);
        b.ranged = gameId === "normandy";
        b.hp = b.mhp = Math.round(b.mhp * (0.8 + 0.3 * strength));
        void bossName;
        G.toSpawn = 0;
      }
      if (def.mode === "advance") {
        const total = Math.max(2, Math.round(def.count * dv.count));
        for (let n = 0; n < total; n++) {
          const x = 260 + ((G.worldW - 460) * (n + 0.5)) / total + rand(-30, 30);
          const kind = Math.random() < dv.elite ? "elite" : def.kinds[n % def.kinds.length];
          spawnEnemy(kind, x, rand(0.15, 0.95), false);
        }
        G.toSpawn = 0;
      }
      if (def.hazard === "mines") {
        const n = Math.round((def.mode === "advance" ? 9 : 4) * dv.hazard);
        for (let m = 0; m < n; m++) G.mines.push({ x: rand(150, G.worldW - 120), z: rand(0.15, 0.95), armed: true, boom: 0 });
      }
      G.phase = "intro";
      G.phaseT = 2.2;
      sfx("horn");
    };

    const resolveMelee = (p: Fighter, type: "hand" | "foot") => {
      const w = weaponNow();
      const reach = type === "hand" ? w.reach : 36;
      const maxTargets = type === "hand" ? w.targets : 1;
      const targets = foes(p)
        .filter((e) => (e.x - p.x) * p.dir > -8 && (e.x - p.x) * p.dir < reach && Math.abs(e.z - p.z) < 0.2)
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))
        .slice(0, maxTargets);
      return targets;
    };

    const playerAttack = (type: "hand" | "foot") => {
      const p = G.player;
      if (p.cd > 0 || p.atk > 0 || p.crouch) return;
      const boost = G.boost > 0 ? 1.6 : 1;
      const w = weaponNow();
      const shoot = type === "hand" && w.ranged;
      p.atkType = shoot ? "shoot" : type;
      p.atkDur = type === "hand" ? Math.min(0.28, w.cd + 0.04) : 0.34;
      p.atk = p.atkDur;
      p.cd = type === "hand" ? w.cd : 0.52;
      G.chain = G.chainT > 0 ? G.chain + 1 : 1;
      G.chainT = 0.7;
      const finisher = G.chain % 3 === 0;
      if (shoot) {
        sfx(gameId === "xiangyu" ? "slash" : "gun");
        const list = foes(p)
          .filter((e) => (e.x - p.x) * p.dir > 8 && (e.x - p.x) * p.dir < w.range && Math.abs(e.z - p.z) < 0.16)
          .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))
          .slice(0, w.targets);
        G.proj.push({ x: p.x + p.dir * 18, z: p.z, vx: p.dir * 1100, low: false, dmg: 0, life: 0.1, friendly: true });
        if (list.length) {
          list.forEach((e) => damage(e, 12 * w.dmg * boost, p, "hand", 6));
        } else {
          G.loss += propsRef.current.scoring.whiff;
        }
        return;
      }
      sfx(type === "foot" ? "kick" : gameId === "gladiator" ? "punch" : "slash");
      const targets = resolveMelee(p, type);
      if (!targets.length) {
        G.loss += propsRef.current.scoring.whiff;
        return;
      }
      const gear = propsRef.current.gear;
      const base = type === "hand" ? 10 * w.dmg * (1 + (gear?.hand ?? 0)) : 15 * (1 + (gear?.foot ?? 0));
      targets.forEach((t) => damage(t, base * boost * (finisher ? 1.6 : 1), p, type, type === "foot" ? 26 : finisher ? 22 : 9));
      if (finisher) {
        G.shake = 4;
        text(p.x, groundY(p.z) - 82, tr0("連擊!", "Combo!"), "#ffd23a");
      }
    };

    const chooseTele = (e: Fighter, adx: number): { type: "high" | "low" | "charge" | "shoot"; dur: number } | null => {
      const { strength } = propsRef.current;
      const dur = Math.max(0.3, 0.68 - 0.28 * strength) * (e.kind === "elite" ? 0.85 : 1);
      if (e.kind === "cavalry") return adx > 90 ? { type: "charge", dur: 0.75 } : null;
      if (e.kind === "beast") return adx < 230 && adx > 40 ? { type: "charge", dur: 0.5 } : adx <= 40 ? { type: "low", dur } : null;
      if (e.kind === "boss" && adx > 140 && !e.ranged && Math.random() < 0.5) return { type: "charge", dur: 0.7 };
      if (e.kind === "grenadier") return adx < 260 ? { type: "shoot", dur: 0.9 } : null;
      if (e.ranged) return adx > 70 && adx < 330 ? { type: Math.random() < 0.5 ? "high" : "low", dur: dur + 0.1 } : null;
      const reach = e.kind === "boss" ? 46 : 34;
      return adx < reach + 6 ? { type: Math.random() < 0.5 ? "high" : "low", dur } : null;
    };

    const perform = (e: Fighter, target: Fighter) => {
      const { strength } = propsRef.current;
      const type = e.teleType;
      e.tele = 0;
      e.teleType = "";
      const cooldown = Math.max(0.55, 1.6 - 0.55 * strength) + rand(0, 0.7);
      e.cd = cooldown;
      if (type === "charge") {
        e.dash = e.kind === "beast" ? 0.4 : 0.6;
        e.dir = target.x >= e.x ? 1 : -1;
        return;
      }
      if (e.kind === "grenadier") {
        G.strikes.push({ x: target.x + rand(-20, 20), z: target.z, t: 1, max: 1, r: 36, dmg: e.dmg, kind: "grenade" });
        e.atkType = "shoot";
        e.atkDur = 0.3;
        e.atk = 0.3;
        return;
      }
      if (e.ranged) {
        e.atkType = "shoot";
        e.atkDur = 0.3;
        e.atk = 0.3;
        sfx(gameId === "xiangyu" ? "slash" : "gun");
        G.proj.push({ x: e.x + e.dir * 16, z: e.z, vx: e.dir * (gameId === "xiangyu" ? 230 : 330), low: type === "low", dmg: e.dmg, life: 2, friendly: e.team === "a" });
        return;
      }
      e.atkType = "swing";
      e.atkDur = 0.28;
      e.atk = 0.28;
      sfx(gameId === "gladiator" ? "punch" : "slash");
      const reach = e.kind === "boss" ? 50 : 38;
      foes(e)
        .filter((t) => (t.x - e.x) * e.dir > -8 && (t.x - e.x) * e.dir < reach && Math.abs(t.z - e.z) < 0.17)
        .forEach((t) => {
          const avoided = type === "high" ? t.crouch : t.h > 10;
          if (!avoided) damage(t, e.dmg, e, "swing", 14);
          else if (t.team === "p") text(t.x, groundY(t.z) - 70, tr0("閃避", "Dodge"), "#7ae0a0");
        });
    };

    const updateAI = (e: Fighter, dt: number) => {
      if (e.dead > 0) {
        e.dead -= dt;
        if (e.dead <= 0) e.dead = -1;
        return;
      }
      e.flash -= dt;
      e.atk -= dt;
      e.guard -= dt;
      e.moving = false;
      if (!e.active) {
        if (Math.abs(e.x - G.player.x) < 360) e.active = true;
        else return;
      }
      const slow = e.team === "e" && G.slow > 0 ? 0.5 : 1;
      const d = dt * slow;
      e.cd -= d;
      const list = foes(e);
      if (!list.length) return;
      const target = list.reduce((a, b) => (Math.abs(a.x - e.x) + Math.abs(a.z - e.z) * 160 < Math.abs(b.x - e.x) + Math.abs(b.z - e.z) * 160 ? a : b));
      const dx = target.x - e.x;
      const adx = Math.abs(dx);
      const dz = target.z - e.z;

      if (e.dash > 0) {
        e.dash -= d;
        const sp = e.kind === "cavalry" ? 340 : e.kind === "beast" ? 280 : 300;
        e.x = clamp(e.x + e.dir * sp * d, 0, G.worldW);
        e.walkT += d * 2;
        e.moving = true;
        foes(e).forEach((t) => {
          if (e.dash > 0 && Math.abs(t.x - e.x) < 24 && Math.abs(t.z - e.z) < 0.15 && t.h < 12) {
            if (damage(t, e.dmg * 1.1, e, "swing", 22)) e.dash = 0;
          }
        });
        if (e.dash <= 0) e.cd = 1.4;
        return;
      }
      if (e.tele > 0) {
        e.tele -= d;
        e.dir = dx >= 0 ? 1 : -1;
        if (e.tele <= 0) perform(e, target);
        return;
      }
      e.dir = dx >= 0 ? 1 : -1;
      const zsp = 0.5 * d;
      if (Math.abs(dz) > 0.05) e.z = clamp(e.z + Math.sign(dz) * Math.min(Math.abs(dz), zsp), 0.02, 1);
      const keep = e.ranged ? 170 : e.kind === "cavalry" ? 150 : e.kind === "boss" ? 40 : 28;
      if (e.ranged && adx < 110) {
        e.x = clamp(e.x - e.dir * e.speed * 0.8 * d, 0, G.worldW);
        e.moving = true;
      } else if (adx > keep) {
        e.x = clamp(e.x + e.dir * e.speed * d, 0, G.worldW);
        e.moving = true;
      }
      if (e.moving) e.walkT += d;
      if (e.style === "gladiator" && e.kind !== "beast" && e.guard <= 0 && e.cd > 0.3 && adx < 70 && Math.random() < 0.006) e.guard = 0.9;
      if (e.cd <= 0 && Math.abs(dz) < 0.12 && e.guard <= 0) {
        const t = chooseTele(e, adx);
        if (t) {
          e.teleType = t.type;
          e.tele = e.teleMax = t.dur;
          sfx("warn");
        }
      }
    };

    const updatePlayer = (dt: number) => {
      const p = G.player;
      const k = input.current;
      p.flash -= dt;
      p.inv -= dt;
      p.cd -= dt;
      p.atk -= dt;
      p.glow = G.boost > 0 ? 1 : 0;
      const lock = p.atk > 0 ? 0.45 : 1;
      p.crouch = k.crouch && p.h <= 0.1;
      const spd = p.crouch ? 0.3 : lock;
      const dx = (k.r ? 1 : 0) - (k.l ? 1 : 0);
      const dz = (k.d ? 1 : 0) - (k.u ? 1 : 0);
      p.moving = dx !== 0 || dz !== 0;
      if (dx) p.dir = dx > 0 ? 1 : -1;
      p.x = clamp(p.x + dx * p.speed * spd * dt, 10, G.worldW - 10);
      p.z = clamp(p.z + dz * 0.75 * spd * dt, 0.02, 1);
      if (p.moving) p.walkT += dt;
      if (k.jump) {
        k.jump = false;
        if (p.h <= 0.1 && !p.crouch) {
          p.vh = 250;
          sfx("jump");
        }
      }
      if (p.h > 0 || p.vh > 0) {
        p.h += p.vh * dt;
        p.vh -= 820 * dt;
        if (p.h <= 0) {
          p.h = 0;
          p.vh = 0;
        }
      }
      if (k.hand) {
        k.hand = false;
        playerAttack("hand");
      }
      if (k.foot) {
        k.foot = false;
        playerAttack("foot");
      }
    };

    const clearSection = () => {
      G.results.push(true);
      G.phase = "clear";
      G.phaseT = 1.8;
      G.shake = 0;
      sfx("win");
      G.proj = [];
      G.strikes = [];
    };

    const finish = (passed: boolean) => {
      if (G.finished) return;
      G.finished = true;
      G.phase = "done";
      const sections = Array.from({ length: total }, (_, i) => G.results[i] === true);
      propsRef.current.onFinish({
        sections,
        passed,
        gain: Math.round(G.gain),
        loss: Math.round(G.loss),
        kills: G.kills,
        maxCombo: G.maxCombo,
      });
    };

    const updateWorld = (dt: number) => {
      const def = plan.sections[G.sec];
      const { strength } = propsRef.current;
      const p = G.player;
      G.chainT -= dt;
      G.comboT -= dt;
      if (G.comboT <= 0) G.combo = 0;
      if (G.boost > 0) G.boost -= dt;
      if (G.slow > 0) G.slow -= dt;
      if (G.allyT > 0) {
        G.allyT -= dt;
        if (G.allyT <= 0) G.fighters = G.fighters.filter((f) => f.team !== "a");
      }

      updatePlayer(dt);
      G.fighters.forEach((f) => {
        if (f.team !== "p") updateAI(f, dt);
      });
      G.fighters = G.fighters.filter((f) => f.team === "p" || f.dead >= 0);

      const aliveCount = alive().length;
      const limit = 2 + Math.floor(strength * 2.2);
      if (def.mode === "waves" || def.mode === "survive") {
        G.spawnT -= dt;
        if (G.spawnT <= 0 && (def.mode === "survive" || G.toSpawn > 0) && aliveCount < limit + (def.mode === "survive" ? 1 : 0)) {
          const kind =
            Math.random() < propsRef.current.diff.elite
              ? "elite"
              : def.kinds[Math.floor(Math.random() * def.kinds.length)];
          const side = Math.random() < 0.5 ? -24 : G.worldW + 24;
          spawnEnemy(kind, clamp(side, -24, G.worldW + 24), rand(0.12, 0.95));
          if (def.mode === "waves") G.toSpawn -= 1;
          G.spawnT = Math.max(0.5, 1.4 - 0.5 * strength) + rand(0, 0.6);
        }
      }
      if (def.mode === "boss") {
        G.minionT -= dt;
        const minions = alive().filter((f) => f.kind !== "boss").length;
        if (G.minionT <= 0 && minions < 2) {
          const kind = gameId === "xiangyu" ? "grunt" : gameId === "normandy" ? "gunner" : "gladiator";
          spawnEnemy(kind, Math.random() < 0.5 ? -24 : VW + 24, rand(0.15, 0.95));
          G.minionT = 9;
        }
      }
      if (def.mode === "survive") G.secT -= dt;

      if (def.hazard === "falling") {
        G.hazT -= dt;
        if (G.hazT <= 0) {
          G.strikes.push({ x: clamp(p.x + rand(-90, 90), 20, G.worldW - 20), z: clamp(p.z + rand(-0.3, 0.3), 0.08, 0.98), t: 1.05, max: 1.05, r: 30, dmg: 14 * (0.7 + 0.5 * strength), kind: "falling" });
          G.hazT = Math.max(0.7, 2.3 - strength * 0.7) / propsRef.current.diff.hazard + rand(0, 0.8);
        }
      }
      G.strikes.forEach((s) => {
        s.t -= dt;
        if (s.t <= 0) {
          sfx("boom");
          G.shake = Math.max(G.shake, 5);
          burst(s.x, groundY(s.z) - 6, s.kind === "grenade" || gameId === "normandy" ? "#ffb04a" : "#c8b890", 16, 120);
          G.fighters
            .filter((f) => f.team !== "e" && f.dead <= 0 && f.hp > 0)
            .forEach((f) => {
              if (Math.abs(f.x - s.x) < s.r && Math.abs(f.z - s.z) < 0.17 && f.h < 12) damage(f, s.dmg, null, "hazard", 0);
            });
        }
      });
      G.strikes = G.strikes.filter((s) => s.t > 0);

      G.mines.forEach((m) => {
        if (!m.armed) return;
        if (Math.abs(p.x - m.x) < 15 && Math.abs(p.z - m.z) < 0.09 && p.h < 8) {
          m.armed = false;
          sfx("boom");
          G.shake = 6;
          burst(m.x, groundY(m.z) - 6, "#ffb04a", 16, 120);
          damage(p, 18 * (0.7 + 0.5 * strength), null, "hazard", 0);
        }
      });
      G.mines = G.mines.filter((m) => m.armed);

      G.proj.forEach((pr) => {
        pr.x += pr.vx * dt;
        pr.life -= dt;
        if (pr.dmg <= 0) return;
        const victims = G.fighters.filter((f) => (pr.friendly ? f.team === "e" : f.team !== "e") && f.dead <= 0 && f.hp > 0);
        for (const v of victims) {
          if (Math.abs(v.x - pr.x) < 12 && Math.abs(v.z - pr.z) < 0.14) {
            const avoided = pr.low ? v.h > 10 : v.crouch;
            if (!avoided) damage(v, pr.dmg, null, "hazard", 10);
            else if (v.team === "p") text(v.x, groundY(v.z) - 70, tr0("閃避", "Dodge"), "#7ae0a0");
            pr.life = 0;
            break;
          }
        }
      });
      G.proj = G.proj.filter((pr) => pr.life > 0 && pr.x > -40 && pr.x < G.worldW + 40);

      G.cam = G.worldW > VW ? clamp(p.x - VW * 0.4, 0, G.worldW - VW) : 0;

      if (G.phase !== "play") return;
      let cleared = false;
      if (def.mode === "waves") cleared = G.toSpawn <= 0 && alive().length === 0;
      else if (def.mode === "advance") cleared = p.x >= G.goalX;
      else if (def.mode === "survive") cleared = G.secT <= 0;
      else cleared = !G.fighters.some((f) => f.kind === "boss" && f.dead <= 0 && f.hp > 0);
      if (cleared) clearSection();
    };

    const render = () => {
      const scene = plan.scene;
      ctx.save();
      if (G.shake > 0.3) ctx.translate(rand(-G.shake, G.shake) * 0.5, rand(-G.shake, G.shake) * 0.5);
      drawScene(ctx, scene, G.cam, G.t);
      const def = plan.sections[G.sec];

      if (def.mode === "advance") {
        const fx = G.goalX - G.cam;
        const fy = groundY(0.5);
        ctx.fillStyle = "#2a1c14";
        ctx.fillRect(fx, fy - 70, 3, 70);
        ctx.fillStyle = gameId === "xiangyu" ? "#c0302a" : gameId === "normandy" ? "#3a6ea5" : "#e0b040";
        ctx.beginPath();
        ctx.moveTo(fx + 3, fy - 70);
        ctx.lineTo(fx + 32 + Math.sin(G.t * 5) * 4, fy - 62);
        ctx.lineTo(fx + 3, fy - 50);
        ctx.fill();
      }

      G.mines.forEach((m) => {
        const mx = m.x - G.cam;
        const my = groundY(m.z);
        const s = scaleAt(m.z);
        if (gameId === "xiangyu") {
          ctx.fillStyle = "#3a3a3a";
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(mx + i * 6 * s - 3 * s, my);
            ctx.lineTo(mx + i * 6 * s, my - 8 * s);
            ctx.lineTo(mx + i * 6 * s + 3 * s, my);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = "#2a2c2a";
          ctx.beginPath();
          ctx.ellipse(mx, my - 2, 9 * s, 4 * s, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = Math.floor(G.t * 3) % 2 ? "#ff4a3a" : "#5a1a14";
          ctx.fillRect(mx - 1.5, my - 5 * s, 3, 3);
        }
      });

      G.strikes.forEach((s) => {
        const sx = s.x - G.cam;
        const sy = groundY(s.z);
        const k = 1 - s.t / s.max;
        ctx.strokeStyle = s.kind === "grenade" ? "rgba(255,170,60,0.9)" : "rgba(255,70,60,0.9)";
        ctx.fillStyle = s.kind === "grenade" ? "rgba(255,170,60,0.18)" : "rgba(255,70,60,0.2)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.r * scaleAt(s.z) * (0.5 + k * 0.5), s.r * 0.35 * scaleAt(s.z), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const fall = clamp((s.t / s.max) * 140, 0, 140);
        if (s.kind === "falling" && gameId === "xiangyu") {
          ctx.strokeStyle = "#e8e0c0";
          ctx.lineWidth = 1.5;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(sx + i * 8 - fall * 0.25, sy - fall - 6);
            ctx.lineTo(sx + i * 8 - fall * 0.25 + 3, sy - fall + 6);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = "#2a2a2a";
          ctx.beginPath();
          ctx.arc(sx, sy - fall, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const drawList = [...G.fighters].sort((a, b) => a.z - b.z);
      drawList.forEach((f) => {
        const sx = f.x - G.cam;
        const sy = groundY(f.z);
        const sc = scaleAt(f.z);
        if (sx < -60 || sx > VW + 60) return;
        drawFighter(ctx, f, sx, sy, sc, G.t);
        if (f.team !== "p" && f.dead <= 0 && f.hp < f.mhp && f.kind !== "boss") {
          const w = 26 * sc;
          const y = sy - 56 * sc * f.scale;
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(sx - w / 2, y, w, 3);
          ctx.fillStyle = f.team === "a" ? "#5ac88a" : "#e04a3a";
          ctx.fillRect(sx - w / 2, y, (w * f.hp) / f.mhp, 3);
        }
      });
      drawList.forEach((f) => {
        if (f.tele > 0) drawTele(ctx, f, f.x - G.cam, groundY(f.z), scaleAt(f.z), G.t);
      });

      G.proj.forEach((pr) => {
        const px = pr.x - G.cam;
        const py = groundY(pr.z) - (pr.low ? 8 : 30) * scaleAt(pr.z);
        if (pr.dmg <= 0 || pr.friendly) {
          ctx.strokeStyle = "rgba(255,230,140,0.95)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, groundY(pr.z) - 28 * scaleAt(pr.z));
          ctx.lineTo(px - Math.sign(pr.vx) * 120, groundY(pr.z) - 28 * scaleAt(pr.z));
          ctx.stroke();
        } else if (gameId === "xiangyu") {
          ctx.strokeStyle = "#e8e0c0";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - Math.sign(pr.vx) * 16, py);
          ctx.stroke();
          ctx.fillStyle = "#c8ccd4";
          ctx.fillRect(px - 1, py - 2, 4, 4);
        } else {
          ctx.fillStyle = "#ffe08a";
          ctx.fillRect(px - 5, py - 1.5, 10, 3);
        }
      });

      G.sparks.forEach((s) => {
        ctx.globalAlpha = clamp(s.life * 2.5, 0, 1);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - G.cam, s.y, s.size, s.size);
      });
      ctx.globalAlpha = 1;
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      G.texts.forEach((tx) => {
        ctx.globalAlpha = clamp(tx.life * 2, 0, 1);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.strokeText(tx.text, tx.x - G.cam, tx.y);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, tx.x - G.cam, tx.y);
      });
      ctx.globalAlpha = 1;

      if (G.slow > 0) {
        ctx.fillStyle = "rgba(120,170,255,0.12)";
        ctx.fillRect(0, 0, VW, VH);
      }
      if (G.player.flash > 0) {
        ctx.fillStyle = "rgba(255,40,30,0.22)";
        ctx.fillRect(0, 0, VW, VH);
      }
      drawLighting(ctx, scene);
      ctx.restore();
    };

    const publish = () => {
      const def = plan.sections[G.sec];
      const boss = G.fighters.find((f) => f.kind === "boss");
      const p = G.player;
      setHud({
        hp: Math.round(p.hp),
        mhp: p.mhp,
        net: Math.round(G.gain - G.loss),
        combo: G.combo,
        sec: G.sec,
        phase: G.phase,
        time: Math.max(0, Math.ceil(G.secT)),
        bossHp: boss ? boss.hp : 0,
        bossMax: boss ? boss.mhp : 0,
        left: def.mode === "waves" ? G.toSpawn + alive().length : alive().length,
        boost: Math.max(0, Math.ceil(G.boost)),
        slow: Math.max(0, Math.ceil(G.slow)),
        allies: G.fighters.filter((f) => f.team === "a" && f.dead <= 0).length,
        progress: def.mode === "advance" ? clamp(p.x / G.goalX, 0, 1) : 0,
        weapon: G.weapon,
      });
    };

    api.current = {
      revive: () => {
        if (G.phase !== "dead") return;
        if (!propsRef.current.onUseItem("chance")) return;
        G.player.hp = G.player.mhp * 0.7;
        sfx("heal");
        startSection(G.sec, 0);
        G.player.hp = G.player.mhp * 0.7;
      },
      giveUp: () => finish(false),
      swap: swapWeapon,
      item: (t) => {
        const p = G.player;
        if (G.phase !== "play") return;
        if (t === "energy" && p.hp >= p.mhp) return;
        if (t === "weapon" && G.boost > 0) return;
        if (t === "wisdom" && G.slow > 0) return;
        if (t === "help" && G.allyT > 0) return;
        if (!propsRef.current.onUseItem(t)) return;
        if (t === "weapon") {
          G.boost = 18;
          sfx("pickup");
        } else if (t === "energy") {
          p.hp = Math.min(p.mhp, p.hp + 55);
          sfx("heal");
          text(p.x, groundY(p.z) - 70, "+55", "#7ae0a0");
        } else if (t === "wisdom") {
          G.slow = 8;
          sfx("pickup");
        } else if (t === "help") {
          sfx("summon");
          G.allyT = 25;
          for (let i = 0; i < 2; i++) {
            const a = mk("a", "grunt", clamp(p.x - 30 - i * 24, 10, G.worldW - 10), clamp(p.z + (i ? 0.15 : -0.15), 0.05, 0.98));
            G.fighters.push(a);
          }
        }
      },
    };

    applyWeapon();
    const startGear = propsRef.current.gear;
    if (startGear) {
      G.player.mhp += startGear.hp;
      G.player.hp = G.player.mhp;
      G.player.speed *= 1 + startGear.spd;
    }
    startSection(0, 0);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      G.t += dt;
      G.frame += 1;
      G.shake = Math.max(0, G.shake - dt * 24);
      G.sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 260 * dt;
        s.life -= dt;
      });
      G.sparks = G.sparks.filter((s) => s.life > 0);
      G.texts.forEach((tx) => {
        tx.y -= 22 * dt;
        tx.life -= dt;
      });
      G.texts = G.texts.filter((tx) => tx.life > 0);

      if (G.phase === "intro") {
        G.phaseT -= dt;
        if (G.phaseT <= 0) G.phase = "play";
        G.player.moving = false;
      } else if (G.phase === "play") {
        updateWorld(dt);
      } else if (G.phase === "clear") {
        G.phaseT -= dt;
        G.fighters.forEach((f) => {
          if (f.dead > 0) f.dead -= dt;
        });
        if (G.phaseT <= 0) {
          if (G.sec + 1 >= total) finish(true);
          else startSection(G.sec + 1);
        }
      } else if (G.phase === "dead") {
        G.fighters.forEach((f) => {
          if (f.team === "p") f.dead = Math.max(0.2, f.dead);
        });
      }
      render();
      if (G.frame % 5 === 0) publish();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const keyMap: Record<string, keyof typeof input.current> = {
      ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r",
      ArrowUp: "u", w: "u", W: "u", ArrowDown: "d", s: "d", S: "d",
      c: "crouch", C: "crouch", Shift: "crouch",
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const m = keyMap[e.key];
      if (m) {
        input.current[m] = down;
        e.preventDefault();
        return;
      }
      if (!down) return;
      if (e.key === " " || e.key === "Spacebar") {
        input.current.jump = true;
        e.preventDefault();
      } else if (e.key === "j" || e.key === "z" || e.key === "J" || e.key === "Z") input.current.hand = true;
      else if (e.key === "k" || e.key === "x" || e.key === "K" || e.key === "X") input.current.foot = true;
      else if (e.key === "q" || e.key === "Q" || e.key === "e" || e.key === "E") swapWeapon();
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      api.current = null;
    };
    // The engine is created once per battle; live values are read through propsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { gameId, plan, tr, pick, items, bossName } = props;
  const def = plan.sections[Math.min(hud.sec, plan.sections.length - 1)];
  const mode = MODE_TEXT[def.mode];
  const handLabel = gameId === "xiangyu" ? tr("揮劍", "Slash") : gameId === "normandy" ? tr("射擊", "Shoot") : tr("拳擊", "Punch");
  const footLabel = gameId === "normandy" ? tr("踹擊", "Kick") : tr("踢擊", "Kick");
  const set = (k: "l" | "r" | "u" | "d" | "crouch", v: boolean) => {
    input.current[k] = v;
  };
  const tap = (k: "jump" | "hand" | "foot") => {
    input.current[k] = true;
  };
  const steer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const dead = 0.22;
    input.current.l = nx < -dead;
    input.current.r = nx > dead;
    input.current.u = ny < -dead;
    input.current.d = ny > dead;
  };
  const releasePad = () => {
    input.current.l = false;
    input.current.r = false;
    input.current.u = false;
    input.current.d = false;
  };
  const itemBtn = (type: ItemType, label: string, active: boolean) => (
    <Button
      key={type}
      type="button"
      variant="secondary"
      disabled={hud.phase !== "play" || items[type] < 1 || active}
      onClick={() => api.current?.item(type)}
      className="h-auto flex-1 flex-col gap-0.5 px-1 py-1.5 text-[11px]"
    >
      <ItemIcon type={type} className="size-4 text-primary" />
      <span>{label}</span>
      <span className="text-muted-foreground">x{items[type]}</span>
    </Button>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs">
        <div className="flex-1">
          <div className="mb-0.5 flex justify-between font-bold">
            <span>{tr("體力", "HP")}</span>
            <span>{hud.hp}/{hud.mhp}</span>
          </div>
          <Progress value={(hud.hp / hud.mhp) * 100} className="h-2" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-muted-foreground">{tr("戰場得分", "Battle score")}</span>
          <span className={`text-base font-black tabular-nums ${hud.net >= 0 ? "text-primary" : "text-destructive"}`}>
            {hud.net >= 0 ? "+" : ""}
            {hud.net}
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        <canvas
          ref={canvasRef}
          className="block aspect-video w-full"
          role="img"
          aria-label={tr("戰鬥場景", "Battle scene")}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 text-[11px] font-bold text-white drop-shadow">
          <div className="flex gap-1">
            {plan.sections.map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i < hud.sec ? "bg-primary" : i === hud.sec ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {hud.combo >= 2 && <span className="text-sm text-accent">{hud.combo} {tr("連擊", "COMBO")}</span>}
            {def.mode === "survive" && <span>{tr("剩餘", "Time")} {hud.time}s</span>}
            {def.mode === "waves" && <span>{tr("敵人", "Enemies")} {hud.left}</span>}
            {def.mode === "advance" && <span>{tr("進度", "Progress")} {Math.round(hud.progress * 100)}%</span>}
            {hud.boost > 0 && <span className="text-accent">{gameId === "gladiator" ? tr("護具強化", "Gear up") : tr("武器強化", "Weapon")} {hud.boost}s</span>}
            {hud.slow > 0 && <span className="text-primary">{tr("洞察", "Insight")} {hud.slow}s</span>}
            {hud.allies > 0 && <span className="text-primary">{tr("援軍", "Allies")} x{hud.allies}</span>}
          </div>
        </div>
        {def.mode === "boss" && hud.bossMax > 0 && (
          <div className="pointer-events-none absolute inset-x-6 bottom-2">
            <p className="mb-0.5 text-center text-[11px] font-bold text-white drop-shadow">{bossName}</p>
            <div className="h-2 overflow-hidden rounded-full bg-black/60">
              <div className="h-full bg-destructive" style={{ width: `${(hud.bossHp / hud.bossMax) * 100}%` }} />
            </div>
          </div>
        )}

        {hud.phase === "intro" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 p-4 text-center text-white">
            <p className="text-xs text-white/80">{pick(plan.scene.name)}</p>
            <p className="text-xs">{tr("第", "Part ")}{hud.sec + 1}/{plan.sections.length}{tr("節", "")}</p>
            <h3 className="text-2xl font-black text-balance">{pick(mode.title)}</h3>
            <p className="text-sm text-balance">{pick(mode.goal)}</p>
            {def.hazard !== "none" && (
              <p className="mt-1 rounded bg-destructive/80 px-2 py-0.5 text-xs">
                {def.hazard === "mines"
                  ? gameId === "xiangyu"
                    ? tr("地面有尖刺陷阱，請跳過", "Spike traps on the ground. Jump them")
                    : tr("地面埋有地雷，請跳過", "Mines on the ground. Jump them")
                  : gameId === "xiangyu"
                    ? tr("箭雨將至，看紅圈跳開", "Arrow rain: watch the red rings")
                    : tr("砲擊將至，看紅圈跳開", "Shelling: watch the red rings")}
              </p>
            )}
          </div>
        )}
        {hud.phase === "clear" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-center text-white">
            <h3 className="text-3xl font-black text-primary">{tr("本節完成", "Section clear")}</h3>
            <p className="text-sm">{tr("稍作喘息，體力回復一些", "A short breather. HP partly restored")}</p>
          </div>
        )}
        {hud.phase === "dead" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 text-center text-white">
            <h3 className="text-3xl font-black text-destructive">{tr("倒下了", "You fell")}</h3>
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Button disabled={items.chance < 1} onClick={() => api.current?.revive()}>
                <RotateCcw className="size-4" aria-hidden="true" />
                {tr("使用機會，重打本節", "Use Chance: retry this section")} x{items.chance}
              </Button>
              <Button variant="secondary" onClick={() => api.current?.giveUp()}>
                {tr("接受失敗", "Accept defeat")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {props.weapons.length > 1 && (
        <Button
          type="button"
          variant="outline"
          disabled={hud.phase !== "play"}
          onClick={() => api.current?.swap()}
          className="h-auto justify-between gap-2 px-3 py-2 text-xs"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <Swords className="size-4 text-primary" aria-hidden="true" />
            {gameId === "gladiator" ? tr("戰鬥風格", "Stance") : tr("目前武器", "Weapon")}: {pick((props.weapons[hud.weapon] ?? props.weapons[0]).name)}
          </span>
          <span className="text-muted-foreground">{gameId === "gladiator" ? tr("點擊換架式", "Tap to switch") : tr("點擊換武器", "Tap to switch")}</span>
        </Button>
      )}

      <div className="flex gap-1.5">
        {itemBtn("weapon", gameId === "normandy" ? tr("強化彈藥", "Ammo") : gameId === "gladiator" ? tr("護具強化", "Gear up") : tr("武器強化", "Weapon"), hud.boost > 0)}
        {itemBtn("energy", tr("回復體力", "Heal"), hud.hp >= hud.mhp)}
        {itemBtn("wisdom", tr("洞察", "Insight"), hud.slow > 0)}
        {itemBtn("help", tr("援軍", "Allies"), hud.allies > 0)}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div
          role="group"
          aria-label={tr("方向鍵", "Direction pad")}
          className="relative size-36 shrink-0 touch-none select-none rounded-full border border-border bg-secondary/60"
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            steer(e);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) steer(e);
          }}
          onPointerUp={releasePad}
          onPointerCancel={releasePad}
          onLostPointerCapture={releasePad}
          onContextMenu={(e) => e.preventDefault()}
        >
          <ArrowUp className="absolute left-1/2 top-2 size-6 -translate-x-1/2 text-muted-foreground" aria-hidden="true" />
          <ArrowDown className="absolute bottom-2 left-1/2 size-6 -translate-x-1/2 text-muted-foreground" aria-hidden="true" />
          <ArrowLeft className="absolute left-2 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <ArrowRight className="absolute right-2 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30" />
        </div>
        <div className="grid grid-cols-2 gap-1.5" aria-label={tr("動作鍵", "Action buttons")}>
          <HoldButton label={tr("跳閃", "Jump dodge")} className="flex h-[66px] w-[76px] flex-col items-center justify-center gap-0.5 text-xs font-bold" onDown={() => tap("jump")}>
            <ChevronsUp className="size-6" />
            {tr("跳閃", "Jump")}
          </HoldButton>
          <HoldButton label={handLabel} className="flex h-[66px] w-[76px] flex-col items-center justify-center gap-0.5 border-primary bg-primary/20 text-xs font-bold" onDown={() => tap("hand")}>
            {gameId === "normandy" ? <Crosshair className="size-6" /> : <Hand className="size-6" />}
            {handLabel}
          </HoldButton>
          <HoldButton label={tr("低閃", "Duck")} className="flex h-[66px] w-[76px] flex-col items-center justify-center gap-0.5 text-xs font-bold" onDown={() => set("crouch", true)} onUp={() => set("crouch", false)}>
            <ChevronsDown className="size-6" />
            {tr("低閃", "Duck")}
          </HoldButton>
          <HoldButton label={footLabel} className="flex h-[66px] w-[76px] flex-col items-center justify-center gap-0.5 border-accent bg-accent/20 text-xs font-bold" onDown={() => tap("foot")}>
            <Footprints className="size-6" />
            {footLabel}
          </HoldButton>
        </div>
      </div>
    </div>
  );
}
