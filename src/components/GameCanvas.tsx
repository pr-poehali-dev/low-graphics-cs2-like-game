import { useEffect, useRef, useCallback } from "react";

interface GameCanvasProps {
  mapId: string;
  onKill: () => void;
  onDeath: () => void;
  onHealthChange: (hp: number) => void;
  onAmmoChange: (ammo: number) => void;
  playerHP: number;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number }

interface Bullet {
  id: number;
  pos: Vec2;
  vel: Vec2;
  fromPlayer: boolean;
  life: number;
}

interface Enemy {
  id: number;
  pos: Vec2;
  hp: number;
  maxHp: number;
  vel: Vec2;
  shootCooldown: number;
  hitFlash: number;
  angle: number;
  state: "patrol" | "chase" | "attack";
  patrolTarget: Vec2;
}

interface Particle {
  id: number;
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Wall { x: number; y: number; w: number; h: number }

// ─── Map configs ──────────────────────────────────────────────────────────────
const MAP_CONFIGS: Record<string, { bg: string; floor: string; wallColor: string; accentColor: string; walls: Wall[] }> = {
  canyon: {
    bg: "#1a0f08",
    floor: "#2a1a10",
    wallColor: "#7a4020",
    accentColor: "#e05a2b",
    walls: [
      { x: 100, y: 100, w: 200, h: 30 },
      { x: 500, y: 80, w: 30, h: 200 },
      { x: 300, y: 300, w: 150, h: 30 },
      { x: 700, y: 250, w: 30, h: 180 },
      { x: 150, y: 450, w: 180, h: 30 },
      { x: 600, y: 450, w: 200, h: 30 },
      { x: 400, y: 150, w: 30, h: 120 },
      { x: 850, y: 150, w: 30, h: 200 },
      { x: 900, y: 380, w: 150, h: 30 },
    ],
  },
  arctic: {
    bg: "#080f18",
    floor: "#0f1a28",
    wallColor: "#2a5080",
    accentColor: "#4ab8d4",
    walls: [
      { x: 80, y: 120, w: 220, h: 30 },
      { x: 480, y: 80, w: 30, h: 220 },
      { x: 280, y: 320, w: 160, h: 30 },
      { x: 720, y: 220, w: 30, h: 200 },
      { x: 120, y: 460, w: 200, h: 30 },
      { x: 620, y: 460, w: 180, h: 30 },
      { x: 380, y: 160, w: 30, h: 130 },
      { x: 860, y: 140, w: 30, h: 220 },
    ],
  },
  jungle: {
    bg: "#081008",
    floor: "#0f1f0f",
    wallColor: "#2a5a20",
    accentColor: "#4ab86a",
    walls: [
      { x: 120, y: 90, w: 200, h: 30 },
      { x: 520, y: 70, w: 30, h: 200 },
      { x: 320, y: 290, w: 140, h: 30 },
      { x: 710, y: 240, w: 30, h: 190 },
      { x: 160, y: 440, w: 190, h: 30 },
      { x: 610, y: 440, w: 210, h: 30 },
      { x: 420, y: 140, w: 30, h: 110 },
      { x: 870, y: 160, w: 30, h: 190 },
      { x: 200, y: 200, w: 80, h: 80 },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
let nextId = 0;
const uid = () => ++nextId;

function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x; const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function rectContains(wall: Wall, p: Vec2, r = 8): boolean {
  return p.x + r > wall.x && p.x - r < wall.x + wall.w &&
    p.y + r > wall.y && p.y - r < wall.y + wall.h;
}

function spawnEnemies(walls: Wall[], count: number): Enemy[] {
  const safePositions = [
    { x: 900, y: 480 }, { x: 850, y: 100 }, { x: 200, y: 500 },
    { x: 950, y: 300 }, { x: 600, y: 500 }, { x: 750, y: 400 },
    { x: 300, y: 80 },  { x: 900, y: 200 },
  ];
  return safePositions.slice(0, count).map((pos) => ({
    id: uid(),
    pos: { ...pos },
    hp: 100,
    maxHp: 100,
    vel: { x: 0, y: 0 },
    shootCooldown: Math.random() * 120 + 60,
    hitFlash: 0,
    angle: 0,
    state: "patrol",
    patrolTarget: { x: pos.x + (Math.random() - 0.5) * 200, y: pos.y + (Math.random() - 0.5) * 200 },
  }));
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawPolyChar(ctx: CanvasRenderingContext2D, pos: Vec2, angle: number, color: string, size = 14) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.7, size * 0.4);
  ctx.lineTo(0, size * 0.1);
  ctx.lineTo(-size * 0.7, size * 0.4);
  ctx.closePath();
  ctx.fill();

  // Gun
  ctx.fillStyle = color + "cc";
  ctx.fillRect(0, -size * 0.1, size * 1.1, size * 0.22);

  ctx.restore();
}

function drawWall(ctx: CanvasRenderingContext2D, wall: Wall, color: string, accent: string) {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(wall.x + 4, wall.y + 6, wall.w, wall.h);

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

  // Top highlight
  ctx.fillStyle = accent + "44";
  ctx.fillRect(wall.x, wall.y, wall.w, 3);

  // Poly detail lines
  ctx.strokeStyle = accent + "33";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(wall.x + wall.w * 0.3, wall.y);
  ctx.lineTo(wall.x + wall.w * 0.1, wall.y + wall.h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wall.x + wall.w * 0.7, wall.y);
  ctx.lineTo(wall.x + wall.w * 0.9, wall.y + wall.h);
  ctx.stroke();
}

function drawFloorGrid(ctx: CanvasRenderingContext2D, W: number, H: number, floorColor: string, accent: string) {
  ctx.fillStyle = floorColor;
  ctx.fillRect(0, 0, W, H);

  const sz = 60;
  ctx.strokeStyle = accent + "18";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += sz) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += sz) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Diagonal poly lines
  ctx.strokeStyle = accent + "0a";
  for (let i = -H; i < W + H; i += 120) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GameCanvas({ mapId, onKill, onDeath, onHealthChange, onAmmoChange, playerHP }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: { pos: { x: 100, y: 300 }, vel: { x: 0, y: 0 }, angle: 0, hp: 100, maxHp: 100, shootCd: 0, ammo: 30, maxAmmo: 30, reloading: 0 },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    mouse: { x: 400, y: 300 },
    kills: 0,
    running: true,
    frameId: 0,
    muzzleFlash: 0,
  });
  const cfg = MAP_CONFIGS[mapId] || MAP_CONFIGS.canyon;

  // Init enemies
  useEffect(() => {
    const s = stateRef.current;
    s.player = { pos: { x: 80, y: 300 }, vel: { x: 0, y: 0 }, angle: 0, hp: 100, maxHp: 100, shootCd: 0, ammo: 30, maxAmmo: 30, reloading: 0 };
    s.enemies = spawnEnemies(cfg.walls, 6);
    s.bullets = [];
    s.particles = [];
    s.kills = 0;
    s.running = true;
  }, [mapId]);

  const spawnParticles = useCallback((pos: Vec2, color: string, count = 8) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      s.particles.push({
        id: uid(),
        pos: { x: pos.x, y: pos.y },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const s = stateRef.current;
    const down = (e: KeyboardEvent) => {
      s.keys[e.code] = true;
      // Reload
      if (e.code === "KeyR" && s.player.ammo < s.player.maxAmmo && s.player.reloading === 0) {
        s.player.reloading = 90;
      }
    };
    const up = (e: KeyboardEvent) => { s.keys[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const click = (e: MouseEvent) => {
      const s = stateRef.current;
      if (s.player.reloading > 0 || s.player.ammo <= 0 || s.player.shootCd > 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = mx - s.player.pos.x;
      const dy = my - s.player.pos.y;
      const dir = normalize({ x: dx, y: dy });
      const spread = (Math.random() - 0.5) * 0.08;
      s.bullets.push({
        id: uid(),
        pos: { x: s.player.pos.x + dir.x * 20, y: s.player.pos.y + dir.y * 20 },
        vel: { x: (dir.x + spread) * 14, y: (dir.y + spread) * 14 },
        fromPlayer: true,
        life: 60,
      });
      s.player.ammo--;
      s.player.shootCd = 8;
      s.muzzleFlash = 6;
      onAmmoChange(s.player.ammo);
      spawnParticles({ x: s.player.pos.x + dir.x * 20, y: s.player.pos.y + dir.y * 20 }, "#e8b84b", 4);
    };
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("click", click);
    return () => { canvas.removeEventListener("mousemove", move); canvas.removeEventListener("click", click); };
  }, [onAmmoChange, spawnParticles]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const SPEED = 3.2;
    const walls = cfg.walls;

    function resolveWall(pos: Vec2, r = 10): Vec2 {
      const p = { ...pos };
      for (const wall of walls) {
        if (rectContains(wall, p, r)) {
          const cx = wall.x + wall.w / 2;
          const cy = wall.y + wall.h / 2;
          const overlapX = (r + wall.w / 2) - Math.abs(p.x - cx);
          const overlapY = (r + wall.h / 2) - Math.abs(p.y - cy);
          if (overlapX < overlapY) p.x += p.x < cx ? -overlapX : overlapX;
          else p.y += p.y < cy ? -overlapY : overlapY;
        }
      }
      p.x = Math.max(r, Math.min(W - r, p.x));
      p.y = Math.max(r, Math.min(H - r, p.y));
      return p;
    }

    function bulletHitsWall(b: Bullet): boolean {
      if (b.pos.x < 0 || b.pos.x > W || b.pos.y < 0 || b.pos.y > H) return true;
      return walls.some(w => rectContains(w, b.pos, 3));
    }

    function tick() {
      const s = stateRef.current;
      if (!s.running) return;

      // ── Player movement ──
      const p = s.player;
      let vx = 0, vy = 0;
      if (s.keys["KeyW"] || s.keys["ArrowUp"]) vy -= SPEED;
      if (s.keys["KeyS"] || s.keys["ArrowDown"]) vy += SPEED;
      if (s.keys["KeyA"] || s.keys["ArrowLeft"]) vx -= SPEED;
      if (s.keys["KeyD"] || s.keys["ArrowRight"]) vx += SPEED;
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
      const newPos = resolveWall({ x: p.pos.x + vx, y: p.pos.y + vy });
      p.pos = newPos;
      p.angle = Math.atan2(s.mouse.y - p.pos.y, s.mouse.x - p.pos.x) + Math.PI / 2;

      // Cooldowns
      if (p.shootCd > 0) p.shootCd--;
      if (s.muzzleFlash > 0) s.muzzleFlash--;
      if (p.reloading > 0) {
        p.reloading--;
        if (p.reloading === 0) { p.ammo = p.maxAmmo; onAmmoChange(p.ammo); }
      }

      // ── Enemies AI ──
      for (const en of s.enemies) {
        const d = dist(en.pos, p.pos);
        en.angle = Math.atan2(p.pos.y - en.pos.y, p.pos.x - en.pos.x) + Math.PI / 2;

        if (d < 400) en.state = "chase";
        if (d < 180) en.state = "attack";
        if (d > 500) en.state = "patrol";

        if (en.state === "patrol") {
          const td = dist(en.pos, en.patrolTarget);
          if (td < 20) en.patrolTarget = { x: 100 + Math.random() * (W - 200), y: 100 + Math.random() * (H - 200) };
          const dir = normalize({ x: en.patrolTarget.x - en.pos.x, y: en.patrolTarget.y - en.pos.y });
          en.vel = { x: dir.x * 1.2, y: dir.y * 1.2 };
        } else if (en.state === "chase") {
          const dir = normalize({ x: p.pos.x - en.pos.x, y: p.pos.y - en.pos.y });
          en.vel = { x: dir.x * 2, y: dir.y * 2 };
        } else {
          const dir = normalize({ x: p.pos.x - en.pos.x, y: p.pos.y - en.pos.y });
          en.vel = { x: dir.x * 0.8, y: dir.y * 0.8 };
        }

        en.pos = resolveWall({ x: en.pos.x + en.vel.x, y: en.pos.y + en.vel.y });
        if (en.hitFlash > 0) en.hitFlash--;

        // Enemy shoot
        if (en.state === "attack" && en.shootCooldown <= 0) {
          const dir = normalize({ x: p.pos.x - en.pos.x, y: p.pos.y - en.pos.y });
          const spread = (Math.random() - 0.5) * 0.2;
          s.bullets.push({
            id: uid(),
            pos: { x: en.pos.x + dir.x * 18, y: en.pos.y + dir.y * 18 },
            vel: { x: (dir.x + spread) * 9, y: (dir.y + spread) * 9 },
            fromPlayer: false,
            life: 70,
          });
          en.shootCooldown = 80 + Math.random() * 60;
        }
        if (en.shootCooldown > 0) en.shootCooldown--;
      }

      // ── Bullets ──
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.pos.x += b.vel.x;
        b.pos.y += b.vel.y;
        b.life--;

        if (b.life <= 0 || bulletHitsWall(b)) {
          spawnParticles(b.pos, b.fromPlayer ? "#e8b84b" : "#e85a5a", 5);
          s.bullets.splice(i, 1);
          continue;
        }

        if (b.fromPlayer) {
          for (let j = s.enemies.length - 1; j >= 0; j--) {
            const en = s.enemies[j];
            if (dist(b.pos, en.pos) < 16) {
              en.hp -= 25;
              en.hitFlash = 10;
              spawnParticles(b.pos, "#ff4444", 10);
              s.bullets.splice(i, 1);
              if (en.hp <= 0) {
                spawnParticles(en.pos, cfg.accentColor, 20);
                s.enemies.splice(j, 1);
                s.kills++;
                onKill();
                // Respawn enemy after delay
                setTimeout(() => {
                  if (!stateRef.current.running) return;
                  const newEn = spawnEnemies(walls, 1)[0];
                  stateRef.current.enemies.push(newEn);
                }, 4000);
              }
              break;
            }
          }
        } else {
          if (dist(b.pos, p.pos) < 14) {
            p.hp = Math.max(0, p.hp - 15);
            spawnParticles(b.pos, "#e85a5a", 8);
            s.bullets.splice(i, 1);
            onHealthChange(p.hp);
            if (p.hp <= 0) { s.running = false; onDeath(); }
          }
        }
      }

      // ── Particles ──
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.pos.x += pt.vel.x;
        pt.pos.y += pt.vel.y;
        pt.vel.x *= 0.88;
        pt.vel.y *= 0.88;
        pt.life--;
        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      // ── Draw ──
      drawFloorGrid(ctx, W, H, cfg.floor, cfg.accentColor);

      // Walls
      for (const wall of walls) drawWall(ctx, wall, cfg.wallColor, cfg.accentColor);

      // Particles
      for (const pt of s.particles) {
        ctx.save();
        ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.pos.x, pt.pos.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Bullets
      for (const b of s.bullets) {
        ctx.save();
        ctx.globalAlpha = b.life / 60;
        const col = b.fromPlayer ? "#e8e870" : "#ff6060";
        ctx.shadowColor = col;
        ctx.shadowBlur = 8;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, b.fromPlayer ? 3 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Trail
        ctx.strokeStyle = col + "88";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.pos.x, b.pos.y);
        ctx.lineTo(b.pos.x - b.vel.x * 3, b.pos.y - b.vel.y * 3);
        ctx.stroke();
        ctx.restore();
      }

      // Enemies
      for (const en of s.enemies) {
        // HP bar
        const barW = 32;
        const hpPct = en.hp / en.maxHp;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(en.pos.x - barW / 2, en.pos.y - 26, barW, 5);
        ctx.fillStyle = hpPct > 0.5 ? "#4ab84a" : hpPct > 0.25 ? "#e8b84b" : "#e85a5a";
        ctx.fillRect(en.pos.x - barW / 2, en.pos.y - 26, barW * hpPct, 5);

        // Flash on hit
        const col = en.hitFlash > 0
          ? (en.hitFlash % 2 === 0 ? "#ffffff" : "#e85a5a")
          : cfg.accentColor + "dd";

        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(en.pos.x + 3, en.pos.y + 5, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        drawPolyChar(ctx, en.pos, en.angle, col);

        // State indicator dot
        const dotCol = en.state === "attack" ? "#e85a5a" : en.state === "chase" ? "#e8b84b" : "#4ab84a";
        ctx.fillStyle = dotCol;
        ctx.beginPath();
        ctx.arc(en.pos.x, en.pos.y - 30, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player shadow
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(p.pos.x + 3, p.pos.y + 5, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Muzzle flash
      if (s.muzzleFlash > 0) {
        ctx.save();
        ctx.globalAlpha = s.muzzleFlash / 6;
        ctx.fillStyle = "#fff8a0";
        ctx.shadowColor = "#e8b84b";
        ctx.shadowBlur = 20;
        const dir = normalize({ x: s.mouse.x - p.pos.x, y: s.mouse.y - p.pos.y });
        ctx.beginPath();
        ctx.arc(p.pos.x + dir.x * 22, p.pos.y + dir.y * 22, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Player
      drawPolyChar(ctx, p.pos, p.angle, "#e8b84b");

      // Player glow
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#e8b84b";
      ctx.shadowColor = "#e8b84b";
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Reload indicator
      if (p.reloading > 0) {
        const pct = 1 - p.reloading / 90;
        ctx.save();
        ctx.strokeStyle = "#e8b84b";
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
        ctx.restore();
      }

      // Ammo empty warning
      if (p.ammo === 0 && p.reloading === 0) {
        ctx.save();
        ctx.fillStyle = "#e85a5a";
        ctx.font = "bold 11px Oswald, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("НАЖМИ R — ПЕРЕЗАРЯДКА", p.pos.x, p.pos.y - 38);
        ctx.restore();
      }

      s.frameId = requestAnimationFrame(tick);
    }

    s.frameId = requestAnimationFrame(tick);
    const s = stateRef.current;
    return () => {
      s.running = false;
      cancelAnimationFrame(s.frameId);
    };
  }, [mapId, cfg, onKill, onDeath, onHealthChange, onAmmoChange, spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      width={1100}
      height={580}
      className="absolute inset-0 w-full h-full cursor-crosshair"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
