"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { pi } from "@/lib/pi";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { DEFAULT_CONFIG } from "@/lib/default-config";
import {
  checkinReward,
  dayKey,
  previousWeekKey,
  rollCaps,
  settleLevel,
  swapRate,
  weekKey,
  type SettleSummary,
} from "@/lib/economy";
import {
  defaultProfile,
  defaultProgress,
  defaultSocial,
  makeInviteCode,
  mergeProfile,
  mergeProgress,
  mergeSocial,
  type AppState,
  type Friend,
  type Profile,
  type Progress,
  type SliceKey,
  type Social,
} from "@/lib/state";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { GAMES, pickEnding, totalAlignment } from "@/lib/games";
import { errorReason, getJson, postJson } from "@/lib/client-api";
import type {
  AnnouncementPublic,
  Difficulty,
  GameConfig,
  GameId,
  InboxItem,
  ItemType,
  L,
  Lang,
} from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  reason?: string;
}

export interface FinishInput {
  game: GameId;
  level: number;
  results: boolean[];
  optionIdx: number;
  difficulty: Difficulty;
  battle?: { gain: number; loss: number; passed: boolean };
  fee?: number;
}

export interface FinishSummary extends SettleSummary {
  itemReward?: ItemType;
  unlockedNext: boolean;
  ending?: {
    id: string;
    title: L;
    text: L;
    isNew: boolean;
    bonus: number;
  };
}

interface SyncResponse {
  config: GameConfig;
  announcements: AnnouncementPublic[];
  inbox: InboxItem[];
}

interface GameContextValue {
  ready: boolean;
  saveFailed: boolean;
  uid: string;
  username: string;
  inviteCode: string;
  lang: Lang;
  tr: (zh: string, en: string) => string;
  pick: (l: L) => string;
  setLang: (lang: Lang) => void;
  config: GameConfig;
  announcements: AnnouncementPublic[];
  profile: Profile;
  progress: Progress;
  social: Social;
  setSettings: (patch: Partial<Profile["settings"]>) => void;
  saveAccount: (mode: "trial" | "pi", data: { name: string; email: string; hash: string }) => void;
  buyItem: (type: ItemType) => ActionResult;
  sellItem: (type: ItemType) => ActionResult;
  swapItem: (from: ItemType, to: ItemType) => ActionResult;
  tokensToPoints: (tokens: number) => ActionResult;
  consumeItem: (type: ItemType) => boolean;
  grantItem: (type: ItemType) => void;
  spendPoints: (n: number) => boolean;
  refundPoints: (n: number) => void;
  finishLevel: (input: FinishInput) => FinishSummary;
  checkin: () => ActionResult & { reward?: number; streak?: number };
  claimAchievement: (id: string) => ActionResult;
  claimEvent: (id: string) => Promise<ActionResult>;
  claimWeekly: () => Promise<ActionResult & { points?: number; tokens?: number; rank?: number }>;
  redeemInvite: (code: string) => Promise<ActionResult>;
  addFriend: (code: string) => Promise<ActionResult>;
  removeFriend: (uid: string) => void;
  giftItem: (friend: Friend, type: ItemType) => Promise<ActionResult>;
  giftsLeft: number;
  syncNow: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

const SLICES: SliceKey[] = ["profile", "progress", "social"];
const MIN_GLOBAL_GAP = 2300;
const MIN_KEY_GAP = 5300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function earn(profile: Profile, n: number, countsTowardCap = true): Profile {
  if (n <= 0) return profile;
  return {
    ...profile,
    points: profile.points + n,
    caps: countsTowardCap
      ? { ...profile.caps, weekEarned: profile.caps.weekEarned + n }
      : profile.caps,
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = usePiAuth();
  const uid = user?.uid ?? "preview-guest";
  const username = user?.username ?? "Guest";
  const inviteCode = useMemo(() => makeInviteCode(uid), [uid]);

  const bonus = DEFAULT_CONFIG.welfare.startBonus;
  const stateRef = useRef<AppState>({
    profile: defaultProfile(bonus),
    progress: defaultProgress(),
    social: defaultSocial(),
  });
  const [state, setState] = useState<AppState>(stateRef.current);
  const [loaded, setLoaded] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const loadedRef = useRef(false);
  const dirtyRef = useRef<Set<SliceKey>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyWrite = useRef<Record<string, number>>({});
  const lastGlobalWrite = useRef(0);
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    timerRef.current = null;
    if (!loadedRef.current || flushing.current) return;
    flushing.current = true;
    try {
      for (const key of SLICES) {
        if (!dirtyRef.current.has(key)) continue;
        const wait = Math.max(
          0,
          MIN_GLOBAL_GAP - (Date.now() - lastGlobalWrite.current),
          MIN_KEY_GAP - (Date.now() - (lastKeyWrite.current[key] ?? 0)),
        );
        if (wait > 0) await sleep(wait);
        dirtyRef.current.delete(key);
        try {
          await pi.userState.set(
            key,
            stateRef.current[key] as unknown as Record<string, unknown>,
          );
          lastKeyWrite.current[key] = Date.now();
          lastGlobalWrite.current = Date.now();
          setSaveFailed(false);
        } catch {
          dirtyRef.current.add(key);
          setSaveFailed(true);
          break;
        }
      }
    } finally {
      flushing.current = false;
      if (dirtyRef.current.size > 0 && !timerRef.current) {
        timerRef.current = setTimeout(() => void flush(), 9000);
      }
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => void flush(), 5500);
  }, [flush]);

  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      const prev = stateRef.current;
      const next = fn(prev);
      if (next === prev) return;
      stateRef.current = next;
      for (const key of SLICES) {
        if (next[key] !== prev[key]) dirtyRef.current.add(key);
      }
      setState(next);
      if (loadedRef.current) scheduleFlush();
    },
    [scheduleFlush],
  );

  // Load saved data from the player's Pi account.
  const { data: saved, error: loadError } = useSWR(
    ["user-state", uid],
    async () => {
      const [profile, progress, social] = await Promise.all([
        pi.userState.get("profile"),
        pi.userState.get("progress"),
        pi.userState.get("social"),
      ]);
      return {
        profile: profile?.blob ?? null,
        progress: progress?.blob ?? null,
        social: social?.blob ?? null,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: true,
      errorRetryInterval: 8000,
    },
  );

  useEffect(() => {
    if (!saved || loadedRef.current) return;
    const profile = rollCaps(mergeProfile(saved.profile, bonus));
    const next: AppState = {
      profile,
      progress: mergeProgress(saved.progress),
      social: mergeSocial(saved.social),
    };
    stateRef.current = next;
    setState(next);
    loadedRef.current = true;
    // Build phase: each new day the point balance is reset to the daily grant amount.
    // A brand-new player's starting bonus counts as that day's grant.
    const grantCfg = DEFAULT_CONFIG.welfare;
    if (grantCfg.dailyGrantActive) {
      const today = dayKey();
      if (!saved.profile) {
        next.profile = { ...next.profile, dailyGrant: { last: today } };
      } else if (next.profile.dailyGrant.last !== today) {
        next.profile = {
          ...next.profile,
          points: grantCfg.dailyGrantAmount,
          dailyGrant: { last: today },
        };
        dirtyRef.current.add("profile");
      }
      stateRef.current = next;
      setState(next);
    }
    if (!saved.profile) dirtyRef.current.add("profile");
    if (!saved.progress) dirtyRef.current.add("progress");
    if (!saved.social) dirtyRef.current.add("social");
    if (dirtyRef.current.size > 0) scheduleFlush();
    setLoaded(true);
  }, [saved, bonus, scheduleFlush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && dirtyRef.current.size > 0) {
        void flush();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  const ready = loaded || Boolean(loadError);
  const profile = state.profile;
  const lang = profile.settings.lang;

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const tr = useCallback((zh: string, en: string) => (lang === "zh" ? zh : en), [lang]);
  const pick = useCallback((l: L) => (lang === "zh" ? l.zh : l.en), [lang]);

  // Inbox items delivered by the server (gifts, invite rewards, exchange credits).
  const applyInbox = useCallback(
    (items: InboxItem[]) => {
      if (items.length === 0) return;
      update((s) => {
        let p = s.profile;
        for (const it of items) {
          if (it.points) p = earn(p, it.points, it.kind === "invite" || it.kind === "event");
          if (it.tokens) p = { ...p, tokens: p.tokens + it.tokens };
          if (it.item) {
            p = {
              ...p,
              items: { ...p.items, [it.item.type]: p.items[it.item.type] + it.item.qty },
            };
          }
        }
        return { ...s, profile: p };
      });
      for (const it of items) {
        const parts: string[] = [];
        if (it.points) parts.push(`+${it.points.toLocaleString()}`);
        if (it.tokens) parts.push(`+${it.tokens} token`);
        if (it.item) parts.push(`${it.item.type} x${it.item.qty}`);
        toast(
          it.text ??
            (it.kind === "gift"
              ? tr("收到好友贈禮", "Gift from a friend")
              : it.kind === "exchange"
                ? tr("Pi 兌換已入帳", "Pi exchange credited")
                : tr("獲得獎勵", "Reward received")),
          { description: parts.join("  ") },
        );
      }
    },
    [update, tr],
  );

  const { data: sync, mutate: mutateSync } = useSWR(
    ready ? ["sync", uid] : null,
    async () => {
      const s = stateRef.current;
      const p = s.profile;
      return postJson<SyncResponse>("/api/app/sync", {
        uid,
        username,
        email: p.account?.pi?.email || p.account?.trial?.email || "",
        inviteCode,
        snapshot: {
          points: p.points,
          tokens: p.tokens,
          items: p.items,
          totalScore: p.totalScore,
          bestScore: p.bestScore,
          cleared: p.cleared,
          plays: p.plays,
          wins: p.wins,
          week: p.caps.week || weekKey(),
          weekScore: p.caps.weekScore,
          gameStats: p.gameStats,
          invitedBy: p.invite.invitedBy,
          progress: {
            xiangyu: { cleared: s.progress.xiangyu.cleared, endings: s.progress.xiangyu.endings },
            normandy: { cleared: s.progress.normandy.cleared, endings: s.progress.normandy.endings },
            gladiator: { cleared: s.progress.gladiator.cleared, endings: s.progress.gladiator.endings },
          },
        },
      });
    },
    {
      refreshInterval: 45000,
      dedupingInterval: 8000,
      revalidateOnFocus: true,
      onSuccess: (res) => applyInbox(res.inbox ?? []),
    },
  );

  const lastSyncNow = useRef(0);
  const syncNow = useCallback(() => {
    if (Date.now() - lastSyncNow.current < 6000) return;
    lastSyncNow.current = Date.now();
    void mutateSync();
  }, [mutateSync]);

  const config = sync?.config ?? DEFAULT_CONFIG;
  const announcements = sync?.announcements ?? [];

  const setLang = useCallback(
    (l: Lang) =>
      update((s) => ({
        ...s,
        profile: { ...s.profile, settings: { ...s.profile.settings, lang: l } },
      })),
    [update],
  );

  const setSettings = useCallback(
    (patch: Partial<Profile["settings"]>) =>
      update((s) => ({
        ...s,
        profile: { ...s.profile, settings: { ...s.profile.settings, ...patch } },
      })),
    [update],
  );

  const saveAccount = useCallback(
    (mode: "trial" | "pi", data: { name: string; email: string; hash: string }) =>
      update((s) => ({
        ...s,
        profile: { ...s.profile, account: { ...s.profile.account, [mode]: data } },
      })),
    [update],
  );

  const buyItem = useCallback(
    (type: ItemType): ActionResult => {
      const entry = config.shop[type];
      const p = stateRef.current.profile;
      if (!entry.active) return { ok: false, reason: "inactive" };
      if (p.points < entry.price) return { ok: false, reason: "points" };
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          points: s.profile.points - entry.price,
          items: { ...s.profile.items, [type]: s.profile.items[type] + 1 },
        },
      }));
      return { ok: true };
    },
    [config, update],
  );

  const sellItem = useCallback(
    (type: ItemType): ActionResult => {
      const p = stateRef.current.profile;
      if (p.items[type] < 1) return { ok: false, reason: "stock" };
      const value = config.shop[type].buyback;
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          points: s.profile.points + value,
          items: { ...s.profile.items, [type]: s.profile.items[type] - 1 },
        },
      }));
      return { ok: true };
    },
    [config, update],
  );

  const swapItem = useCallback(
    (from: ItemType, to: ItemType): ActionResult => {
      if (from === to) return { ok: false, reason: "same" };
      const rate = swapRate(config, from, to);
      const p = stateRef.current.profile;
      if (p.items[from] < rate.give) return { ok: false, reason: "stock" };
      if (!config.shop[to].active) return { ok: false, reason: "inactive" };
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          items: {
            ...s.profile.items,
            [from]: s.profile.items[from] - rate.give,
            [to]: s.profile.items[to] + rate.get,
          },
        },
      }));
      return { ok: true };
    },
    [config, update],
  );

  const tokensToPoints = useCallback(
    (tokens: number): ActionResult => {
      const n = Math.floor(tokens);
      const p = stateRef.current.profile;
      if (n < 1 || p.tokens < n) return { ok: false, reason: "stock" };
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          tokens: s.profile.tokens - n,
          points: s.profile.points + n * config.piExchange.pointsPerToken,
        },
      }));
      return { ok: true };
    },
    [config, update],
  );

  const consumeItem = useCallback(
    (type: ItemType): boolean => {
      if (stateRef.current.profile.items[type] < 1) return false;
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          items: { ...s.profile.items, [type]: s.profile.items[type] - 1 },
        },
      }));
      return true;
    },
    [update],
  );

  const grantItem = useCallback(
    (type: ItemType) => {
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          items: { ...s.profile.items, [type]: s.profile.items[type] + 1 },
        },
      }));
    },
    [update],
  );

  const spendPoints = useCallback(
    (n: number): boolean => {
      if (stateRef.current.profile.points < n) return false;
      update((s) => ({
        ...s,
        profile: { ...s.profile, points: s.profile.points - n },
      }));
      return true;
    },
    [update],
  );

  const refundPoints = useCallback(
    (n: number) => {
      if (n <= 0) return;
      update((s) => ({
        ...s,
        profile: { ...s.profile, points: s.profile.points + n },
      }));
    },
    [update],
  );

  const completeInvite = useCallback(async () => {
    try {
      const res = await postJson<{ ok: boolean; points?: number }>(
        "/api/app/invite-complete",
        { uid },
      );
      if (res.ok) {
        update((s) => ({
          ...s,
          profile: {
            ...earn(s.profile, res.points ?? 0),
            invite: { ...s.profile.invite, completedFirst: true },
          },
        }));
        toast(tr("邀請獎勵已發放", "Invite reward granted"), {
          description: `+${(res.points ?? 0).toLocaleString()}`,
        });
      }
    } catch {
      // The reward is retried after the next cleared level.
    }
  }, [uid, update, tr]);

  const finishLevel = useCallback(
    (input: FinishInput): FinishSummary => {
      const prev = stateRef.current;
      const def = GAMES[input.game];
      const gp = prev.progress[input.game];
      const dp = gp.byDiff[input.difficulty];
      const cleared = dp.cleared.includes(input.level);
      const option = def.levels[input.level - 1].options[input.optionIdx];

      const { profile: settled, summary } = settleLevel(prev.profile, config, {
        difficulty: input.difficulty,
        results: input.results,
        firstClear: !cleared,
        replay: cleared,
        choiceBonus: option.pts > 0 ? option.pts : 0,
        battle: input.battle,
        fee: input.fee,
      });

      let profile: Profile = {
        ...settled,
        plays: settled.plays + 1,
        wins: settled.wins + (summary.passed ? 1 : 0),
        cleared: settled.cleared + (summary.passed ? 1 : 0),
        bestScore: Math.max(settled.bestScore, summary.score),
        totalScore: settled.totalScore + summary.score,
        gameStats: {
          ...settled.gameStats,
          [input.game]: {
            plays: settled.gameStats[input.game].plays + 1,
            passes: settled.gameStats[input.game].passes + (summary.passed ? 1 : 0),
            scoreSum: settled.gameStats[input.game].scoreSum + summary.score,
          },
        },
      };

      let progress = prev.progress;
      let itemReward: ItemType | undefined;
      let ending: FinishSummary["ending"];
      const firstClearPass = summary.passed && !cleared;

      if (summary.passed) {
        const best = Math.max(dp.best[input.level] ?? 0, summary.score);
        let nextGp = {
          ...gp,
          best: { ...gp.best, [input.level]: Math.max(gp.best[input.level] ?? 0, summary.score) },
          byDiff: {
            ...gp.byDiff,
            [input.difficulty]: { ...dp, best: { ...dp.best, [input.level]: best } },
          },
        };
        if (firstClearPass) {
          nextGp = {
            ...nextGp,
            cleared: gp.cleared.includes(input.level) ? gp.cleared : [...gp.cleared, input.level],
            byDiff: {
              ...nextGp.byDiff,
              [input.difficulty]: {
                ...nextGp.byDiff[input.difficulty],
                cleared: [...dp.cleared, input.level],
              },
            },
            choices: { ...gp.choices, [input.level]: input.optionIdx },
          };
          if (option.item) {
            itemReward = option.item;
            profile = {
              ...profile,
              items: { ...profile.items, [option.item]: profile.items[option.item] + 1 },
            };
          }
        }
        progress = { ...progress, [input.game]: nextGp };

        if (firstClearPass && input.level === def.levels.length) {
          const align = totalAlignment(input.game, progress);
          const picked = pickEnding(input.game, align);
          const claimKey = `${input.game}:${picked.id}`;
          const isNew = !nextGp.endings.includes(picked.id);
          const grant = !profile.claimed.endings.includes(claimKey);
          const endingBonus = grant ? config.welfare.endingBonus : 0;
          if (isNew) {
            progress = {
              ...progress,
              [input.game]: { ...nextGp, endings: [...nextGp.endings, picked.id] },
            };
          }
          if (grant) {
            profile = earn(profile, endingBonus);
            profile = {
              ...profile,
              claimed: { ...profile.claimed, endings: [...profile.claimed.endings, claimKey] },
            };
          }
          ending = {
            id: picked.id,
            title: picked.title,
            text: picked.text,
            isNew,
            bonus: endingBonus,
          };
        }
      }

      update((s) => ({ ...s, profile, progress }));

      if (summary.passed && !profile.invite.completedFirst && profile.invite.invitedBy) {
        void completeInvite();
      }
      syncNow();

      return {
        ...summary,
        itemReward,
        unlockedNext: firstClearPass && input.level < def.levels.length,
        ending,
      };
    },
    [config, update, completeInvite, syncNow],
  );

  const checkin = useCallback((): ActionResult & { reward?: number; streak?: number } => {
    const s = stateRef.current;
    const today = dayKey();
    if (s.social.checkin.last === today) return { ok: false, reason: "done" };
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const streak = s.social.checkin.last === dayKey(y) ? s.social.checkin.streak + 1 : 1;
    const reward = checkinReward(streak, config.welfare.checkinMultiplier);
    update((st) => ({
      ...st,
      profile: earn(rollCaps(st.profile), reward),
      social: { ...st.social, checkin: { last: today, streak } },
    }));
    return { ok: true, reward, streak };
  }, [config, update]);

  const claimAchievement = useCallback(
    (id: string): ActionResult => {
      const s = stateRef.current;
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (!a) return { ok: false, reason: "missing" };
      if (s.profile.claimed.achievements.includes(id)) return { ok: false, reason: "claimed" };
      if (!a.check(s.profile, s.progress, s.social)) return { ok: false, reason: "locked" };
      update((st) => ({
        ...st,
        profile: {
          ...earn(st.profile, a.points),
          tokens: st.profile.tokens + a.tokens,
          claimed: {
            ...st.profile.claimed,
            achievements: [...st.profile.claimed.achievements, id],
          },
        },
      }));
      return { ok: true };
    },
    [update],
  );

  const claimEvent = useCallback(
    async (id: string): Promise<ActionResult> => {
      if (stateRef.current.profile.claimed.events.includes(id)) {
        return { ok: false, reason: "claimed" };
      }
      try {
        const res = await postJson<{ ok: boolean; points: number; tokens: number }>(
          "/api/app/event-claim",
          { uid, id },
        );
        update((st) => ({
          ...st,
          profile: {
            ...earn(st.profile, res.points),
            tokens: st.profile.tokens + res.tokens,
            claimed: { ...st.profile.claimed, events: [...st.profile.claimed.events, id] },
          },
        }));
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: errorReason(e) };
      }
    },
    [uid, update],
  );

  const claimWeekly = useCallback(async () => {
    const week = previousWeekKey();
    if (stateRef.current.profile.claimed.weeks.includes(week)) {
      return { ok: false, reason: "claimed" };
    }
    try {
      const res = await postJson<{ ok: boolean; points: number; tokens: number; rank: number }>(
        "/api/app/weekly",
        { uid, week },
      );
      update((st) => ({
        ...st,
        profile: {
          ...earn(st.profile, res.points),
          tokens: st.profile.tokens + res.tokens,
          claimed: {
            ...st.profile.claimed,
            weeks: [...st.profile.claimed.weeks, week].slice(-12),
          },
        },
      }));
      return { ok: true, points: res.points, tokens: res.tokens, rank: res.rank };
    } catch (e) {
      return { ok: false, reason: errorReason(e) };
    }
  }, [uid, update]);

  const redeemInvite = useCallback(
    async (code: string): Promise<ActionResult> => {
      const clean = code.trim().toUpperCase();
      if (stateRef.current.profile.invite.invitedBy) return { ok: false, reason: "already" };
      if (clean === inviteCode) return { ok: false, reason: "self" };
      try {
        const res = await postJson<{ ok: boolean; inviterUid: string }>(
          "/api/app/invite-redeem",
          { uid, code: clean },
        );
        update((st) => ({
          ...st,
          profile: {
            ...st.profile,
            invite: { ...st.profile.invite, invitedBy: res.inviterUid },
          },
        }));
        if (stateRef.current.profile.cleared > 0) void completeInvite();
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: errorReason(e) };
      }
    },
    [uid, inviteCode, update, completeInvite],
  );

  const addFriend = useCallback(
    async (code: string): Promise<ActionResult> => {
      const clean = code.trim().toUpperCase();
      if (clean === inviteCode) return { ok: false, reason: "self" };
      if (stateRef.current.social.friends.some((f) => f.code === clean)) {
        return { ok: false, reason: "exists" };
      }
      try {
        const res = await postJson<{ uid: string; username: string }>(
          "/api/app/resolve-code",
          { code: clean },
        );
        update((st) => ({
          ...st,
          social: {
            ...st.social,
            friends: [...st.social.friends, { uid: res.uid, username: res.username, code: clean }],
          },
        }));
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: errorReason(e) };
      }
    },
    [inviteCode, update],
  );

  const removeFriend = useCallback(
    (friendUid: string) =>
      update((st) => ({
        ...st,
        social: { ...st.social, friends: st.social.friends.filter((f) => f.uid !== friendUid) },
      })),
    [update],
  );

  const today = dayKey();
  const giftsUsed = profile.gifts.day === today ? profile.gifts.count : 0;
  const giftsLeft = Math.max(0, config.social.dailyGiftLimit - giftsUsed);

  const giftItem = useCallback(
    async (friend: Friend, type: ItemType): Promise<ActionResult> => {
      const p = stateRef.current.profile;
      const used = p.gifts.day === dayKey() ? p.gifts.count : 0;
      if (used >= config.social.dailyGiftLimit) return { ok: false, reason: "limit" };
      if (p.items[type] < 1) return { ok: false, reason: "stock" };
      try {
        await postJson("/api/app/gift", {
          fromUid: uid,
          fromName: username,
          toUid: friend.uid,
          item: type,
        });
        update((st) => ({
          ...st,
          profile: {
            ...st.profile,
            items: { ...st.profile.items, [type]: st.profile.items[type] - 1 },
            gifts: {
              day: dayKey(),
              count: (st.profile.gifts.day === dayKey() ? st.profile.gifts.count : 0) + 1,
            },
          },
        }));
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: errorReason(e) };
      }
    },
    [config, uid, username, update],
  );

  const value: GameContextValue = {
    ready,
    saveFailed,
    uid,
    username,
    inviteCode,
    lang,
    tr,
    pick,
    setLang,
    config,
    announcements,
    profile,
    progress: state.progress,
    social: state.social,
  setSettings,
  saveAccount,
  buyItem,
    sellItem,
    swapItem,
    tokensToPoints,
    consumeItem,
    grantItem,
    spendPoints,
    refundPoints,
    finishLevel,
    checkin,
    claimAchievement,
    claimEvent,
    claimWeekly,
    redeemInvite,
    addFriend,
    removeFriend,
    giftItem,
    giftsLeft,
    syncNow,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

export { getJson };
