import type { SceneDef } from "@/lib/games/stages";

export const VW = 480;
export const VH = 270;
export const HORIZON = 128;
export const GROUND_NEAR = 252;

const rnd = (i: number) => {
  const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return s - Math.floor(s);
};

function withAlpha(color: string, a: number): string {
  if (!color.startsWith("#")) return color;
  let h = color.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

function haze(ctx: CanvasRenderingContext2D, scene: SceneDef, strength: number) {
  const g = ctx.createLinearGradient(0, HORIZON - 70, 0, HORIZON + 14);
  g.addColorStop(0, withAlpha(scene.sky[2], 0));
  g.addColorStop(1, withAlpha(scene.sky[2], strength));
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON - 70, VW, 84);
}

function tiles(cam: number, par: number, size: number, cb: (x: number, k: number) => void) {
  const off = cam * par;
  const start = Math.floor(off / size) - 1;
  const end = Math.ceil((off + VW) / size) + 1;
  for (let k = start; k <= end; k++) cb(k * size - off, k);
}

function far(ctx: CanvasRenderingContext2D, scene: SceneDef, cam: number) {
  ctx.fillStyle = scene.far_c;
  const base = HORIZON + 4;
  switch (scene.far) {
    case "mountains":
    case "cliffs":
      tiles(cam, 0.15, 60, (x, k) => {
        const h = 28 + rnd(k) * 44;
        ctx.beginPath();
        ctx.moveTo(x - 10, base);
        if (scene.far === "cliffs") {
          ctx.lineTo(x, base - h);
          ctx.lineTo(x + 52, base - h * 0.85);
          ctx.lineTo(x + 66, base);
        } else {
          ctx.lineTo(x + 30, base - h);
          ctx.lineTo(x + 70, base);
        }
        ctx.fill();
      });
      break;
    case "city":
    case "fort":
      tiles(cam, 0.18, 54, (x, k) => {
        const h = 24 + rnd(k) * 30;
        ctx.fillRect(x, base - h, 40, h);
        ctx.beginPath();
        ctx.moveTo(x - 4, base - h);
        ctx.lineTo(x + 20, base - h - 12);
        ctx.lineTo(x + 44, base - h);
        ctx.fill();
        if (scene.far === "fort") for (let c = 0; c < 4; c++) ctx.fillRect(x + c * 11, base - h - 5, 6, 5);
      });
      break;
    case "ships":
      ctx.fillStyle = "rgba(30,44,56,0.55)";
      ctx.fillRect(0, base - 14, VW, 18);
      ctx.fillStyle = scene.far_c;
      tiles(cam, 0.12, 110, (x, k) => {
        const w = 60 + rnd(k) * 30;
        ctx.beginPath();
        ctx.moveTo(x, base - 12);
        ctx.lineTo(x + w, base - 12);
        ctx.lineTo(x + w - 8, base - 2);
        ctx.lineTo(x + 6, base - 2);
        ctx.fill();
        ctx.fillRect(x + w * 0.4, base - 34, 3, 22);
        ctx.fillRect(x + w * 0.4 - 8, base - 24, 24, 12);
      });
      break;
    case "arena":
      ctx.fillRect(0, base - 52, VW, 56);
      tiles(cam, 0.12, 22, (x, k) => {
        const colors = ["#c0392b", "#e8c36a", "#3a6ea5", "#e8e0d0", "#8a4a2a"];
        for (let r = 0; r < 4; r++) {
          ctx.fillStyle = colors[Math.floor(rnd(k * 7 + r) * colors.length)];
          ctx.globalAlpha = 0.75;
          ctx.fillRect(x + 3, base - 46 + r * 11, 5, 5);
          ctx.fillRect(x + 12, base - 44 + r * 11, 5, 5);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.arc(x + 11, base - 2, 9, Math.PI, 0);
        ctx.fill();
      });
      break;
    default:
      tiles(cam, 0.16, 50, (x, k) => {
        const h = 14 + rnd(k) * 40;
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x, base - h);
        ctx.lineTo(x + 8, base - h + 6);
        ctx.lineTo(x + 18, base - h - 4);
        ctx.lineTo(x + 28, base - h + 10);
        ctx.lineTo(x + 36, base - h + 2);
        ctx.lineTo(x + 36, base);
        ctx.fill();
      });
  }
}

function mid(ctx: CanvasRenderingContext2D, scene: SceneDef, cam: number, t: number) {
  const base = HORIZON + 10;
  ctx.fillStyle = scene.mid_c;
  switch (scene.mid) {
    case "tents":
      tiles(cam, 0.5, 96, (x, k) => {
        const w = 56 + rnd(k) * 20;
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w / 2, base - 34);
        ctx.lineTo(x + w, base);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(x + w / 2 - 5, base - 14, 10, 14);
        ctx.fillStyle = scene.mid_c;
        ctx.fillRect(x + w / 2 - 1, base - 46, 2, 14);
        ctx.fillStyle = "#e0b040";
        ctx.fillRect(x + w / 2 + 1, base - 46, 9 + Math.sin(t * 3 + k) * 2, 5);
        ctx.fillStyle = scene.mid_c;
      });
      break;
    case "walls":
      ctx.fillRect(0, base - 26, VW, 28);
      tiles(cam, 0.5, 20, (x) => {
        ctx.fillRect(x, base - 33, 12, 8);
      });
      tiles(cam, 0.5, 150, (x) => {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.arc(x + 40, base - 4, 11, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = scene.mid_c;
      });
      break;
    case "trees":
      tiles(cam, 0.5, 64, (x, k) => {
        const r = 16 + rnd(k) * 9;
        ctx.fillStyle = "#3a2c1c";
        ctx.fillRect(x + 22, base - 22, 5, 24);
        ctx.fillStyle = scene.mid_c;
        ctx.beginPath();
        ctx.arc(x + 24, base - 30, r, 0, Math.PI * 2);
        ctx.arc(x + 12, base - 22, r * 0.7, 0, Math.PI * 2);
        ctx.arc(x + 36, base - 22, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    case "bunkers":
      tiles(cam, 0.5, 130, (x, k) => {
        const w = 70 + rnd(k) * 20;
        ctx.fillStyle = scene.mid_c;
        ctx.fillRect(x, base - 24, w, 26);
        ctx.fillStyle = "#101214";
        ctx.fillRect(x + 8, base - 17, w - 16, 5);
      });
      break;
    case "hedgehogs":
      ctx.fillStyle = "rgba(70,86,96,0.5)";
      ctx.fillRect(0, base - 4, VW, 10);
      ctx.strokeStyle = scene.mid_c;
      ctx.lineWidth = 3;
      tiles(cam, 0.5, 52, (x) => {
        ctx.beginPath();
        ctx.moveTo(x, base + 2);
        ctx.lineTo(x + 18, base - 20);
        ctx.moveTo(x + 18, base + 2);
        ctx.lineTo(x, base - 20);
        ctx.moveTo(x - 4, base - 9);
        ctx.lineTo(x + 22, base - 9);
        ctx.stroke();
      });
      break;
    case "columns":
      tiles(cam, 0.5, 84, (x) => {
        ctx.fillStyle = scene.mid_c;
        ctx.fillRect(x + 4, base - 44, 10, 46);
        ctx.fillRect(x, base - 48, 18, 5);
        ctx.fillRect(x, base - 2, 18, 4);
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(x + 10, base - 44, 4, 46);
      });
      break;
    case "boats":
      tiles(cam, 0.5, 140, (x, k) => {
        ctx.fillStyle = scene.mid_c;
        ctx.beginPath();
        ctx.moveTo(x, base - 14);
        ctx.lineTo(x + 90, base - 14);
        ctx.lineTo(x + 76, base + 2);
        ctx.lineTo(x + 14, base + 2);
        ctx.fill();
        const f = 5 + Math.sin(t * 8 + k) * 2;
        const g = ctx.createRadialGradient(x + 40, base - 22, 1, x + 40, base - 22, 22);
        g.addColorStop(0, "rgba(255,200,90,0.9)");
        g.addColorStop(1, "rgba(255,90,20,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + 40, base - 22, 18 + f, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    case "torches":
      tiles(cam, 0.5, 110, (x, k) => {
        ctx.fillStyle = "#2a1c14";
        ctx.fillRect(x + 20, base - 36, 4, 38);
        const f = 1 + Math.sin(t * 11 + k * 2) * 0.25;
        const g = ctx.createRadialGradient(x + 22, base - 42, 1, x + 22, base - 42, 34 * f);
        g.addColorStop(0, "rgba(255,210,110,0.95)");
        g.addColorStop(0.4, "rgba(255,120,30,0.5)");
        g.addColorStop(1, "rgba(255,80,10,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + 22, base - 42, 34 * f, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
  }
}

function fx(ctx: CanvasRenderingContext2D, scene: SceneDef, t: number) {
  const n = scene.fx === "rain" ? 70 : scene.fx === "none" ? 0 : 36;
  for (let i = 0; i < n; i++) {
    const r1 = rnd(i);
    const r2 = rnd(i + 99);
    switch (scene.fx) {
      case "embers": {
        const y = VH - ((t * (18 + r1 * 30) + r2 * VH) % VH);
        const x = (r1 * VW + Math.sin(t + i) * 14 + VW) % VW;
        ctx.fillStyle = `rgba(255,${140 + Math.floor(r2 * 90)},40,${0.35 + r1 * 0.5})`;
        ctx.fillRect(x, y, 2, 2);
        break;
      }
      case "snow": {
        const y = (t * (20 + r1 * 24) + r2 * VH) % VH;
        const x = (r1 * VW + Math.sin(t * 0.8 + i) * 18 + VW) % VW;
        ctx.fillStyle = "rgba(240,246,255,0.8)";
        ctx.fillRect(x, y, 2, 2);
        break;
      }
      case "rain": {
        const y = (t * 380 + r2 * VH) % VH;
        const x = (r1 * VW + y * 0.15) % VW;
        ctx.strokeStyle = "rgba(190,210,230,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + 9);
        ctx.stroke();
        break;
      }
      case "smoke": {
        const x = ((r1 * VW + t * (6 + r2 * 8)) % (VW + 80)) - 40;
        const y = HORIZON - 30 + r2 * 70;
        ctx.fillStyle = "rgba(60,60,64,0.07)";
        ctx.beginPath();
        ctx.arc(x, y, 26 + r1 * 18, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default: {
        const x = ((r1 * VW + t * (30 + r2 * 40)) % (VW + 20)) - 10;
        const y = HORIZON + 20 + r2 * (VH - HORIZON - 30);
        ctx.fillStyle = "rgba(230,210,170,0.18)";
        ctx.fillRect(x, y, 3, 1);
      }
    }
  }
}

export function drawScene(ctx: CanvasRenderingContext2D, scene: SceneDef, cam: number, t: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 10);
  sky.addColorStop(0, scene.sky[0]);
  sky.addColorStop(0.55, scene.sky[1]);
  sky.addColorStop(1, scene.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, HORIZON + 14);

  if (scene.sun) {
    const [fx0, fy0, r, color] = scene.sun;
    const sx = fx0 * VW - cam * 0.03;
    const sy = fy0 * HORIZON;
    const g = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 3.2);
    g.addColorStop(0, color);
    g.addColorStop(0.25, "rgba(255,230,180,0.35)");
    g.addColorStop(1, "rgba(255,230,180,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 14);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  far(ctx, scene, cam);
  haze(ctx, scene, 0.45);
  mid(ctx, scene, cam, t);
  haze(ctx, scene, 0.2);

  const gr = ctx.createLinearGradient(0, HORIZON + 6, 0, VH);
  gr.addColorStop(0, scene.ground[1]);
  gr.addColorStop(1, scene.ground[0]);
  ctx.fillStyle = gr;
  ctx.fillRect(0, HORIZON + 6, VW, VH - HORIZON);

  const sunX = scene.sun ? scene.sun[0] * VW - cam * 0.03 : VW * 0.5;
  const pool = ctx.createRadialGradient(sunX, HORIZON + 14, 4, sunX, HORIZON + 14, VW * 0.55);
  pool.addColorStop(0, "rgba(255,226,170,0.28)");
  pool.addColorStop(1, "rgba(255,226,170,0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, HORIZON + 6, VW, VH - HORIZON);
  const fore = ctx.createLinearGradient(0, VH - 60, 0, VH);
  fore.addColorStop(0, "rgba(0,0,0,0)");
  fore.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = fore;
  ctx.fillRect(0, VH - 60, VW, 60);

  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 7; i++) {
    const y = HORIZON + 6 + Math.pow(i / 7, 1.7) * (VH - HORIZON);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VW, y);
    ctx.stroke();
  }
  tiles(cam, 1, 48, (x, k) => {
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    ctx.fillRect(x + rnd(k) * 30, HORIZON + 20 + rnd(k + 5) * 100, 14, 2);
  });

  fx(ctx, scene, t);
}

export function drawLighting(ctx: CanvasRenderingContext2D, scene: SceneDef) {
  const v = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.65);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = scene.sky[2];
  ctx.globalAlpha = 0.07;
  ctx.fillRect(0, 0, VW, VH);
  ctx.globalAlpha = 1;
}
