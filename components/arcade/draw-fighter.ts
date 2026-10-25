import type { Fighter } from "./types";

interface Pal {
  cloth: string;
  trim: string;
  skin: string;
  helm: string;
  weapon: string;
}

function palette(f: Fighter): Pal {
  const white = f.flash > 0;
  const w: Pal = { cloth: "#fff", trim: "#fff", skin: "#fff", helm: "#fff", weapon: "#fff" };
  if (white) return w;
  const skin = "#e6b48a";
  if (f.style === "xiangyu") {
    if (f.team !== "e") return { cloth: "#b3261e", trim: "#e0b040", skin, helm: "#2a1a14", weapon: "#d8dde6" };
    if (f.kind === "boss") return { cloth: "#14141c", trim: "#d8b040", skin, helm: "#2a2a34", weapon: "#c8ccd4" };
    if (f.kind === "elite") return { cloth: "#3a1c1c", trim: "#c0a050", skin, helm: "#4a3030", weapon: "#c8ccd4" };
    if (f.kind === "archer") return { cloth: "#4a3a2a", trim: "#8a7050", skin, helm: "#3a2c20", weapon: "#6a4a2a" };
    return { cloth: "#2a2c36", trim: "#8a8e9a", skin, helm: "#44474f", weapon: "#9aa0aa" };
  }
  if (f.style === "normandy") {
    if (f.team !== "e") return { cloth: "#5a6a3a", trim: "#8a9a5a", skin, helm: "#4a5a2c", weapon: "#2a2a2a" };
    if (f.kind === "boss") return { cloth: "#2a2c30", trim: "#b02a2a", skin, helm: "#3a3c42", weapon: "#1a1a1a" };
    if (f.kind === "elite") return { cloth: "#3c4048", trim: "#7a8088", skin, helm: "#50565e", weapon: "#1a1a1a" };
    if (f.kind === "grenadier") return { cloth: "#5a5a60", trim: "#8a7a4a", skin, helm: "#50565e", weapon: "#3a3a3a" };
    return { cloth: "#6a7078", trim: "#9aa0a8", skin, helm: "#50565e", weapon: "#2a2a2a" };
  }
  if (f.team !== "e") return { cloth: "#a8742c", trim: "#f0d078", skin, helm: "#c89a3c", weapon: "#d8dde6" };
  if (f.kind === "beast") return { cloth: "#b8863c", trim: "#6a4a1c", skin: "#c8964c", helm: "#6a4a1c", weapon: "#fff" };
  if (f.kind === "boss") return { cloth: "#4a1a6a", trim: "#f0d078", skin, helm: "#c0302a", weapon: "#e8ecf4" };
  if (f.kind === "elite") return { cloth: "#2a4a7a", trim: "#d8d8e0", skin, helm: "#8a909c", weapon: "#e0e4ec" };
  if (f.kind === "gladiator") return { cloth: "#7a2a2a", trim: "#c8a050", skin, helm: "#6a6e78", weapon: "#d8dce4" };
  return { cloth: "#5a4a3a", trim: "#8a7a5a", skin, helm: "#3a3028", weapon: "#8a8e96" };
}

function shade(hex: string, amt: number): string {
  if (hex === "#fff" || !hex.startsWith("#")) return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, c: string) {
  ctx.lineCap = "round";
  const stroke = (color: string, width: number, dx: number, dy: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1 + dx, y1 + dy);
    ctx.lineTo(x2 + dx, y2 + dy);
    ctx.stroke();
  };
  if (c === "#fff" || w < 2.5) {
    stroke(c, w, 0, 0);
    return;
  }
  stroke(shade(c, -0.5), w + 1.6, 0.4, 0.4);
  stroke(c, w, 0, 0);
  stroke(shade(c, 0.4), Math.max(1, w * 0.35), -w * 0.18, -w * 0.18);
}

function sphere(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string) {
  if (c === "#fff") {
    ctx.fillStyle = c;
    return;
  }
  const g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.45, r * 0.15, cx, cy, r * 1.1);
  g.addColorStop(0, shade(c, 0.45));
  g.addColorStop(0.55, c);
  g.addColorStop(1, shade(c, -0.55));
  ctx.fillStyle = g;
}

function cylinder(ctx: CanvasRenderingContext2D, x: number, w: number, c: string) {
  if (c === "#fff") {
    ctx.fillStyle = c;
    return;
  }
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, shade(c, 0.35));
  g.addColorStop(0.45, c);
  g.addColorStop(1, shade(c, -0.55));
  ctx.fillStyle = g;
}

function drawHorse(ctx: CanvasRenderingContext2D, run: number, color: string) {
  const swing = Math.sin(run * 14);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -18, 24, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [lx, ph] of [[-16, 0], [-8, 2], [10, 1], [18, 3]] as const) {
    line(ctx, lx, -12, lx + Math.sin(run * 14 + ph) * 8, 0, 4, color);
  }
  line(ctx, 20, -24, 32, -36, 8, color);
  ctx.beginPath();
  ctx.ellipse(35, -37, 8, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, -24, -20, -32, -12 + swing * 3, 3, "#1a1210");
  line(ctx, 18, -30, 8, -36, 4, "#1a1210");
}

export function drawFighter(
  ctx: CanvasRenderingContext2D,
  f: Fighter,
  sx: number,
  sy: number,
  sc: number,
  t: number,
) {
  const p = palette(f);
  const air = f.h * sc;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  const sw = (f.kind === "cavalry" ? 30 : f.kind === "beast" ? 22 : 12) * f.scale * sc;
  ctx.ellipse(sx, sy, sw * (1 - Math.min(0.5, air / 120)), 4 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(sx, sy - air);
  const s = sc * f.scale;
  ctx.scale(s * f.dir, s);

  if (f.dead > 0 || f.hp <= 0) {
    ctx.rotate(-Math.PI / 2.2);
    ctx.globalAlpha = Math.max(0.15, Math.min(1, f.dead / 0.6));
  }
  if (f.inv > 0 && f.team === "p" && Math.floor(t * 24) % 2 === 0) ctx.globalAlpha *= 0.45;

  if (f.glow > 0) {
    const g = ctx.createRadialGradient(0, -22, 2, 0, -22, 34);
    g.addColorStop(0, "rgba(255,210,90,0.5)");
    g.addColorStop(1, "rgba(255,210,90,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -22, 34, 0, Math.PI * 2);
    ctx.fill();
  }

  const atkP = f.atk > 0 ? 1 - f.atk / f.atkDur : 0;
  const walk = f.moving ? Math.sin(f.walkT * 12) : 0;
  const co = f.crouch ? 10 : 0;

  if (f.kind === "beast") {
    const run = f.walkT;
    ctx.fillStyle = p.cloth;
    ctx.beginPath();
    ctx.ellipse(0, -14, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const [lx, ph] of [[-12, 0], [-6, 2], [8, 1], [14, 3]] as const) line(ctx, lx, -8, lx + Math.sin(run * 12 + ph) * 6, 0, 4, p.cloth);
    ctx.fillStyle = p.trim;
    ctx.beginPath();
    ctx.arc(20, -20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.cloth;
    ctx.beginPath();
    ctx.arc(24, -18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0e08";
    ctx.fillRect(25, -23, 2, 2);
    line(ctx, -20, -16, -30, -24 + walk * 3, 3, p.trim);
    ctx.restore();
    return;
  }

  if (f.kind === "cavalry") {
    drawHorse(ctx, f.walkT, "#5a3a22");
  }
  const yOff = f.kind === "cavalry" ? -22 : 0;
  ctx.translate(0, yOff);

  if (f.kind === "boss" && f.style !== "normandy") {
    ctx.fillStyle = f.style === "xiangyu" ? "#8a1a14" : "#6a1a8a";
    ctx.beginPath();
    ctx.moveTo(-3, -33);
    ctx.lineTo(-16 - Math.abs(walk) * 3, -6);
    ctx.lineTo(-2, -10);
    ctx.fill();
  }

  if (f.kind !== "cavalry") {
    const kickP = f.atkType === "foot" ? Math.sin(atkP * Math.PI) : 0;
    for (const i of [-1, 1]) {
      const a = walk * 0.6 * i;
      const hipY = -16 + co;
      const footX = Math.sin(a) * 12 + (i === 1 ? kickP * 22 : 0);
      const footY = hipY + Math.cos(a) * (16 - co * 0.4) - (i === 1 ? kickP * 8 : 0);
      line(ctx, i * 3, hipY, footX, Math.min(0, footY), 4.5, i === 1 ? p.cloth : p.trim);
    }
  }

  cylinder(ctx, -6, 12, p.cloth);
  ctx.beginPath();
  ctx.roundRect(-6, -35 + co, 12, 20 - co * 0.2, 3);
  ctx.fill();
  ctx.strokeStyle = shade(p.cloth, -0.6);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = p.trim;
  ctx.fillRect(-6, -18 + co, 12, 3);
  if (f.kind === "elite" || f.kind === "boss") {
    ctx.fillRect(-9, -36 + co, 6, 5);
    ctx.fillRect(3, -36 + co, 6, 5);
  }

  sphere(ctx, 0, -40 + co, 5.5, p.skin);
  ctx.beginPath();
  ctx.arc(0, -40 + co, 5.5, 0, Math.PI * 2);
  ctx.fill();
  sphere(ctx, 0, -43 + co, 6, p.helm);
  ctx.beginPath();
  ctx.arc(0, -41 + co, 6, Math.PI, 0);
  ctx.fill();
  if (f.flash <= 0) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(-2, -44 + co, 2.2, 1.1, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (f.kind === "boss" || f.kind === "elite") {
    ctx.fillStyle = f.style === "gladiator" ? "#c0302a" : p.trim;
    ctx.fillRect(-1, -52 + co, 3, 7);
  }
  if (!f.glow || f.flash <= 0) {
    ctx.fillStyle = "#1a1210";
    ctx.fillRect(2, -41 + co, 2, 2);
  }

  const shoulderX = 2;
  const shoulderY = -31 + co;
  const swing = f.atkType === "hand" || f.atkType === "swing" || f.atkType === "shoot";
  const ang = swing ? -1.4 + atkP * 2.3 : -0.3 + walk * 0.2 - 0.4;
  const armLen = 13;
  let hx = shoulderX + Math.cos(ang) * armLen;
  let hy = shoulderY + Math.sin(ang) * armLen + 6;
  if (f.atkType === "shoot" || (f.ranged && f.tele > 0)) {
    hx = shoulderX + 14;
    hy = shoulderY + 3;
  }
  line(ctx, shoulderX, shoulderY, hx, hy, 4, p.skin);

  if (f.style === "normandy" || f.ranged) {
    if (f.style === "xiangyu") {
      ctx.strokeStyle = p.weapon;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx + 2, hy - 2, 14, -1.2, 1.2);
      ctx.stroke();
      line(ctx, hx + 2 + Math.cos(1.2) * 14, hy - 2 + Math.sin(1.2) * 14, hx + 2 + Math.cos(-1.2) * 14, hy - 2 + Math.sin(-1.2) * 14, 1, "#e8e0c0");
    } else {
      ctx.fillStyle = p.weapon;
      ctx.fillRect(hx - 4, hy - 2, f.kind === "elite" || f.kind === "boss" ? 26 : 20, 3.5);
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(hx - 6, hy - 1, 8, 3.5);
      if (f.atkType === "shoot" && f.atk > f.atkDur * 0.55) {
        ctx.fillStyle = "#ffe08a";
        ctx.beginPath();
        ctx.moveTo(hx + 17, hy);
        ctx.lineTo(hx + 28, hy - 4);
        ctx.lineTo(hx + 25, hy);
        ctx.lineTo(hx + 28, hy + 4);
        ctx.fill();
      }
    }
  } else if (f.style === "gladiator") {
    ctx.fillStyle = f.team === "p" ? "#b3261e" : p.trim;
    ctx.strokeStyle = "#2a1a10";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(hx, hy, swing ? 5.5 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (swing && atkP > 0.2 && atkP < 0.8) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx + 4, hy, 9, -1, 1);
      ctx.stroke();
    }
  } else if (f.style === "xiangyu" && f.team === "e" && f.kind !== "boss") {
    const sdir = swing ? ang : -1.0;
    line(ctx, hx - Math.cos(sdir) * 8, hy - Math.sin(sdir) * 8, hx + Math.cos(sdir) * 30, hy + Math.sin(sdir) * 30, 2.2, "#6a4a2a");
    line(ctx, hx + Math.cos(sdir) * 30, hy + Math.sin(sdir) * 30, hx + Math.cos(sdir) * 38, hy + Math.sin(sdir) * 38, 3, p.weapon);
  } else {
    const len = f.wlen ?? (f.kind === "boss" ? 34 : f.style === "gladiator" ? 20 : 26);
    const a = swing ? ang - 0.5 : -1.1;
    line(ctx, hx, hy, hx + Math.cos(a) * len, hy + Math.sin(a) * len, f.team === "p" ? 3 : 2.6, p.weapon);
    line(ctx, hx - 1, hy + 1, hx + Math.cos(a + Math.PI / 2) * 4, hy + Math.sin(a + Math.PI / 2) * 4, 2, p.trim);
    if (swing && atkP > 0.15 && atkP < 0.85) {
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(shoulderX, shoulderY + 6, len + 6, -1.9 + atkP * 2.1, -0.2 + atkP * 2.1 - 0.5);
      ctx.stroke();
    }
  }

  if (f.style === "gladiator" && f.kind !== "beast") {
    if (f.guard > 0) {
      line(ctx, shoulderX, shoulderY, 9, -38 + co, 4.5, "#f0d078");
      ctx.fillStyle = "#f0d078";
      ctx.beginPath();
      ctx.arc(9, -39 + co, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (f.team === "p") {
      ctx.fillStyle = p.trim;
      ctx.fillRect(0, -39 + co, 6, 3);
    }
  }

  ctx.restore();
}

export function drawTele(ctx: CanvasRenderingContext2D, f: Fighter, sx: number, sy: number, sc: number, t: number) {
  if (f.tele <= 0 || f.dead > 0) return;
  const color = f.teleType === "high" ? "#ff4a3a" : f.teleType === "low" ? "#ffd23a" : f.teleType === "charge" ? "#ff4ad0" : "#ff9a2a";
  const y = sy - (f.kind === "cavalry" ? 80 : 62) * sc * f.scale - Math.sin(t * 20) * 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, y, 7 * sc + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1210";
  ctx.font = `bold ${11 * sc + 3}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(f.teleType === "high" ? "v" : f.teleType === "low" ? "^" : "!", sx, y + 0.5);
  ctx.restore();
}
