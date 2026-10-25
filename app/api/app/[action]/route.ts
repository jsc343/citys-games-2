import { NextResponse } from "next/server";
import { previousWeekKey, weekKey, dayKey } from "@/lib/economy";
import { ITEM_TYPES, type ItemType } from "@/lib/types";
import {
  cleanGameStats,
  cleanItems,
  cleanProgress,
  emptyPlayer,
  findByInviteCode,
  getStore,
  monthKey,
  newId,
  num,
  popInbox,
  publicAnnouncements,
  pushInbox,
  rankOf,
  recordWeekScore,
  str,
  touchActivity,
  type PlayerRow,
} from "@/lib/server/store";
import { loadStore, saveStore } from "@/lib/server/persist";

type Ctx = { params: Promise<{ action: string }> };

const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function validUid(v: unknown): string | null {
  const s = str(v, 120);
  return s.length >= 1 ? s : null;
}

export async function GET(req: Request, ctx: Ctx) {
  await loadStore();
  return getImpl(req, ctx);
}

export async function POST(req: Request, ctx: Ctx) {
  await loadStore();
  const res = await postImpl(req, ctx);
  await saveStore();
  return res;
}

async function getImpl(req: Request, ctx: Ctx) {
  const { action } = await ctx.params;
  const store = getStore();
  const url = new URL(req.url);

  if (action === "leaderboard") {
    const metric = url.searchParams.get("metric") ?? "total";
    const uid = url.searchParams.get("uid") ?? "";
    const week = weekKey();

    if (metric === "week") {
      const board = store.weekBoards.get(week);
      const sorted = [...(board?.entries() ?? [])]
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);
      const rows = sorted.slice(0, 50).map(([id, value], i) => ({
        rank: i + 1,
        username: store.players.get(id)?.username ?? "Pi",
        value,
        mine: id === uid,
      }));
      const mine = rankOf(board, uid);
      return NextResponse.json({
        rows,
        me: mine ? { rank: mine.rank, value: mine.score } : null,
        week,
        rewards: store.config.leaderboardRewards,
      });
    }

    const pickValue = (p: PlayerRow) =>
      metric === "best" ? p.bestScore : metric === "cleared" ? p.cleared : p.totalScore;
    const sorted = [...store.players.values()]
      .map((p) => ({ p, value: pickValue(p) }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
    const rows = sorted.slice(0, 50).map((x, i) => ({
      rank: i + 1,
      username: x.p.username,
      value: x.value,
      mine: x.p.uid === uid,
    }));
    const idx = sorted.findIndex((x) => x.p.uid === uid);
    return NextResponse.json({
      rows,
      me: idx >= 0 ? { rank: idx + 1, value: sorted[idx].value } : null,
      week,
      rewards: store.config.leaderboardRewards,
    });
  }

  if (action === "exchange") {
    const uid = validUid(url.searchParams.get("uid"));
    if (!uid) return fail("uid");
    const list = store.exchanges
      .filter((e) => e.uid === uid)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);
    return NextResponse.json({ records: list });
  }

  if (action === "feedback") {
    const uid = validUid(url.searchParams.get("uid"));
    if (!uid) return fail("uid");
    const list = store.feedback
      .filter((f) => f.uid === uid)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);
    return NextResponse.json({ records: list });
  }

  return fail("not_found", 404);
}

async function postImpl(req: Request, ctx: Ctx) {
  const { action } = await ctx.params;
  const store = getStore();
  const body = await readBody(req);

  if (action === "sync") {
    const uid = validUid(body.uid);
    if (!uid) return fail("uid");
    const username = str(body.username, 60) || "Pi";
    const inviteCode = str(body.inviteCode, 20).toUpperCase();
    const snap = (body.snapshot ?? {}) as Record<string, unknown>;

    let row = store.players.get(uid);
    if (!row) {
      row = emptyPlayer(uid, username, inviteCode);
      store.players.set(uid, row);
    }
    row.username = username;
    const email = str(body.email, 120).toLowerCase();
    if (email) row.email = email;
    row.inviteCode = inviteCode || row.inviteCode;
    row.lastSeen = Date.now();
    row.points = num(snap.points);
    row.tokens = num(snap.tokens, 1e9);
    row.items = cleanItems(snap.items);
    row.totalScore = num(snap.totalScore);
    row.bestScore = num(snap.bestScore);
    row.cleared = num(snap.cleared, 1e6);
    row.plays = num(snap.plays, 1e8);
    row.wins = num(snap.wins, 1e8);
    row.week = str(snap.week, 16) || weekKey();
    row.weekScore = num(snap.weekScore);
    row.gameStats = cleanGameStats(snap.gameStats);
    row.progress = cleanProgress(snap.progress);
    row.invitedBy = typeof snap.invitedBy === "string" ? str(snap.invitedBy, 120) : null;
    recordWeekScore(row.week, uid, row.weekScore);
    touchActivity(uid);

    return NextResponse.json({
      config: store.config,
      announcements: publicAnnouncements(),
      inbox: popInbox(uid),
    });
  }

  if (action === "resolve-code") {
    const code = str(body.code, 20);
    const found = code ? findByInviteCode(code) : undefined;
    if (!found) return fail("not_found", 404);
    return NextResponse.json({ uid: found.uid, username: found.username });
  }

  if (action === "invite-redeem") {
    const uid = validUid(body.uid);
    const code = str(body.code, 20);
    if (!uid || !code) return fail("invalid");
    const inviter = findByInviteCode(code);
    if (!inviter) return fail("not_found", 404);
    if (inviter.uid === uid) return fail("self");
    if (store.invites.has(uid)) return fail("already");
    const month = monthKey();
    const used = [...store.invites.values()].filter(
      (i) => i.inviterUid === inviter.uid && i.month === month,
    ).length;
    if (used >= store.config.welfare.inviteMonthlyCap) return fail("cap");
    store.invites.set(uid, { inviterUid: inviter.uid, month, done: false });
    return NextResponse.json({ ok: true, inviterUid: inviter.uid });
  }

  if (action === "invite-complete") {
    const uid = validUid(body.uid);
    if (!uid) return fail("uid");
    const invite = store.invites.get(uid);
    if (!invite || invite.done) return NextResponse.json({ ok: false });
    invite.done = true;
    const w = store.config.welfare;
    pushInbox(invite.inviterUid, {
      kind: "invite",
      points: w.inviterBonus,
      text: "A friend you invited cleared their first level",
    });
    return NextResponse.json({ ok: true, points: w.inviteeBonus });
  }

  if (action === "gift") {
    const fromUid = validUid(body.fromUid);
    const toUid = validUid(body.toUid);
    const item = body.item as ItemType;
    if (!fromUid || !toUid || !ITEM_TYPES.includes(item)) return fail("invalid");
    if (fromUid === toUid) return fail("self");
    if (!store.players.has(toUid)) return fail("not_found", 404);
    const key = `${fromUid}:${dayKey()}`;
    const used = store.giftCounts.get(key) ?? 0;
    if (used >= store.config.social.dailyGiftLimit) return fail("limit");
    store.giftCounts.set(key, used + 1);
    pushInbox(toUid, {
      kind: "gift",
      item: { type: item, qty: 1 },
      from: str(body.fromName, 60) || "Pi",
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "event-claim") {
    const uid = validUid(body.uid);
    const id = str(body.id, 60);
    const event = store.config.events.find((e) => e.id === id && e.active);
    if (!uid || !event) return fail("not_found", 404);
    const claims = store.eventClaims.get(id) ?? new Set<string>();
    if (claims.has(uid)) return fail("claimed");
    if (event.total > 0 && claims.size >= event.total) return fail("sold_out");
    claims.add(uid);
    store.eventClaims.set(id, claims);
    return NextResponse.json({ ok: true, points: event.points, tokens: event.tokens });
  }

  if (action === "weekly") {
    const uid = validUid(body.uid);
    const week = str(body.week, 16);
    if (!uid || week !== previousWeekKey()) return fail("invalid");
    const claimKey = `${week}:${uid}`;
    if (store.weeklyClaims.has(claimKey)) return fail("claimed");
    const mine = rankOf(store.weekBoards.get(week), uid);
    if (!mine) return fail("no_reward");
    const reward = store.config.leaderboardRewards.find(
      (r) => mine.rank >= r.from && mine.rank <= r.to,
    );
    if (!reward) return fail("no_reward");
    store.weeklyClaims.add(claimKey);
    return NextResponse.json({
      ok: true,
      rank: mine.rank,
      points: reward.points,
      tokens: reward.tokens,
    });
  }

  if (action === "exchange") {
    const uid = validUid(body.uid);
    if (!uid) return fail("uid");
    const target = body.target === "tokens" ? "tokens" : "points";
    const pi = Math.round(Number(body.pi) * 100) / 100;
    if (!Number.isFinite(pi) || pi <= 0 || pi > 1000) return fail("amount");
    const pending = store.exchanges.filter((e) => e.uid === uid && e.status === "pending");
    if (pending.length >= 5) return fail("too_many_pending");
    const { pointsPerPi, pointsPerToken } = store.config.piExchange;
    const totalPoints = Math.floor(pi * pointsPerPi);
    const now = Date.now();
    const record = {
      id: newId("ex"),
      uid,
      username: str(body.username, 60) || "Pi",
      target,
      pi,
      points: target === "points" ? totalPoints : 0,
      tokens: target === "tokens" ? Math.floor(totalPoints / pointsPerToken) : 0,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
    };
    store.exchanges.push(record);
    return NextResponse.json({ record });
  }

  if (action === "feedback") {
    const uid = validUid(body.uid);
    if (!uid) return fail("uid");
    const title = str(body.title, 80);
    const text = str(body.body, 2000);
    if (!title || !text) return fail("invalid");
    const type = body.type === "bug" || body.type === "other" ? body.type : "suggestion";
    let shot: string | undefined;
    if (typeof body.shot === "string" && body.shot.startsWith("data:image/") && body.shot.length < 900_000) {
      shot = body.shot;
    }
    const mine = store.feedback.filter((f) => f.uid === uid && Date.now() - f.createdAt < 3_600_000);
    if (mine.length >= 10) return fail("rate_limit", 429);
    const record = {
      id: newId("fb"),
      uid,
      username: str(body.username, 60) || "Pi",
      title,
      type,
      body: text,
      shot,
      status: "unread" as const,
      replies: [],
      createdAt: Date.now(),
    };
    store.feedback.push(record);
    return NextResponse.json({ record });
  }

  return fail("not_found", 404);
}
