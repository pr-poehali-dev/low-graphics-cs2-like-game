import { useEffect, useRef, useCallback } from "react";

interface GameCanvasProps {
  mapId: string;
  onKill: () => void;
  onDeath: () => void;
  onHealthChange: (hp: number) => void;
  onAmmoChange: (ammo: number) => void;
  playerHP: number;
}

// ─── Map grids (1 = wall, 0 = floor) ─────────────────────────────────────────
const MAPS: Record<string, { grid: number[][]; floorColor: string; ceilColor: string; wallColors: string[]; fogColor: string }> = {
  canyon: {
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,0,0,1,0,1,1,1,0,1,0,0,0,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0,1,0,1],
      [1,0,0,0,1,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1],
      [1,0,1,0,1,0,0,0,0,1,1,0,1,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,1],
      [1,0,0,0,1,0,1,0,1,1,0,1,0,0,1,0,1,0,0,1],
      [1,0,1,1,1,0,0,0,0,0,0,1,0,1,0,0,1,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    floorColor: "#3a2010",
    ceilColor:  "#1a0f06",
    wallColors: ["#7a4020", "#5a2e10"],
    fogColor: "#1a0f06",
  },
  arctic: {
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,1,1,1,0,1,0,0,0,1,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,1,0,1],
      [1,0,0,0,1,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1],
      [1,0,1,0,1,0,0,0,0,1,1,0,1,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,1],
      [1,0,0,0,1,0,1,0,1,0,0,1,0,0,1,0,1,0,0,1],
      [1,0,1,1,1,0,0,0,0,0,0,1,0,1,0,0,1,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    floorColor: "#0a1520",
    ceilColor:  "#050c14",
    wallColors: ["#2a5070", "#1a3050"],
    fogColor: "#050c14",
  },
  jungle: {
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,1,1,1,0,1,0,0,0,1,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,1,0,1],
      [1,0,0,0,1,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1],
      [1,0,1,0,1,0,0,0,0,1,1,0,1,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,1],
      [1,0,0,0,1,0,1,0,1,0,0,1,0,0,1,0,1,0,0,1],
      [1,0,1,1,1,0,0,0,0,0,0,1,0,1,0,0,1,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    floorColor: "#0a1a08",
    ceilColor:  "#050e04",
    wallColors: ["#2a5a1a", "#1a3a0a"],
    fogColor: "#050e04",
  },
};

const CELL = 1.0; // world units per cell
const FOV = Math.PI / 2.8;
const MAX_DEPTH = 16;
const ENEMY_SPAWN_POSITIONS: Record<string, Array<{x:number,y:number,angle:number}>> = {
  canyon: [{x:15.5,y:1.5,angle:Math.PI},{x:17.5,y:3.5,angle:Math.PI*1.5},{x:10.5,y:5.5,angle:0},{x:6.5,y:9.5,angle:Math.PI/2},{x:13.5,y:9.5,angle:Math.PI},{x:3.5,y:5.5,angle:0}],
  arctic: [{x:15.5,y:1.5,angle:Math.PI},{x:17.5,y:3.5,angle:Math.PI*1.5},{x:10.5,y:5.5,angle:0},{x:6.5,y:9.5,angle:Math.PI/2},{x:13.5,y:9.5,angle:Math.PI},{x:3.5,y:5.5,angle:0}],
  jungle: [{x:15.5,y:1.5,angle:Math.PI},{x:17.5,y:3.5,angle:Math.PI*1.5},{x:10.5,y:5.5,angle:0},{x:6.5,y:9.5,angle:Math.PI/2},{x:13.5,y:9.5,angle:Math.PI},{x:3.5,y:5.5,angle:0}],
};

interface Enemy3D {
  id: number;
  x: number; y: number;
  angle: number;
  hp: number;
  shootCd: number;
  hitFlash: number;
  alive: boolean;
  state: "patrol"|"chase"|"attack";
}

interface Projectile {
  id: number;
  x: number; y: number;
  dx: number; dy: number;
  fromPlayer: boolean;
  life: number;
}

interface DamageFlash { life: number }

let _id = 0;
const uid = () => ++_id;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function shadedColor(hex: string, shade: number): string {
  const [r, g, b] = hexToRgb(hex);
  const s = Math.max(0, Math.min(1, shade));
  return `rgb(${Math.floor(r*s)},${Math.floor(g*s)},${Math.floor(b*s)})`;
}

export default function GameCanvas({ mapId, onKill, onDeath, onHealthChange, onAmmoChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapCfg = MAPS[mapId] || MAPS.canyon;

  const stateRef = useRef({
    px: 1.5, py: 1.5, // player position in world units
    pAngle: 0.3,       // player view angle
    pHP: 100,
    ammo: 30,
    maxAmmo: 30,
    reloadTimer: 0,
    shootCd: 0,
    running: true,
    frameId: 0,
    enemies: [] as Enemy3D[],
    projectiles: [] as Projectile[],
    damageFlash: { life: 0 } as DamageFlash,
    muzzleFlash: 0,
    keys: {} as Record<string, boolean>,
    mouseX: 0,
    lastMouseX: 0,
    bobTime: 0,
    kills: 0,
    pointerLocked: false,
    mouseDeltaX: 0,
  });

  // Init / reset on mapId change
  useEffect(() => {
    const s = stateRef.current;
    s.px = 1.5; s.py = 1.5; s.pAngle = 0.3;
    s.pHP = 100; s.ammo = 30; s.reloadTimer = 0; s.shootCd = 0;
    s.kills = 0; s.muzzleFlash = 0; s.damageFlash = { life: 0 };
    s.projectiles = [];
    s.running = true;
    const spawns = ENEMY_SPAWN_POSITIONS[mapId] || ENEMY_SPAWN_POSITIONS.canyon;
    s.enemies = spawns.map(sp => ({
      id: uid(), x: sp.x, y: sp.y, angle: sp.angle,
      hp: 100, shootCd: Math.floor(60 + Math.random()*80),
      hitFlash: 0, alive: true, state: "patrol",
    }));
  }, [mapId]);

  // Pointer lock
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onClick = () => canvas.requestPointerLock();
    const onLockChange = () => {
      stateRef.current.pointerLocked = document.pointerLockElement === canvas;
    };
    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, []);

  // Mouse move for rotation
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (stateRef.current.pointerLocked) {
        stateRef.current.mouseDeltaX += e.movementX;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;
      if (e.code === "KeyR") {
        const s = stateRef.current;
        if (s.ammo < s.maxAmmo && s.reloadTimer === 0) s.reloadTimer = 90;
      }
    };
    const up = (e: KeyboardEvent) => { stateRef.current.keys[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Shoot on click
  const handleShoot = useCallback(() => {
    const s = stateRef.current;
    if (!s.pointerLocked || s.shootCd > 0 || s.ammo <= 0 || s.reloadTimer > 0) return;
    s.ammo--;
    s.shootCd = 10;
    s.muzzleFlash = 8;
    onAmmoChange(s.ammo);
    // Cast a ray and instantly hit the closest enemy in crosshair center
    const grid = mapCfg.grid;
    const angle = s.pAngle;
    let rx = s.px, ry = s.py;
    const dxStep = Math.cos(angle) * 0.05;
    const dyStep = Math.sin(angle) * 0.05;
    for (let i = 0; i < 300; i++) {
      rx += dxStep; ry += dyStep;
      const mx = Math.floor(rx), my = Math.floor(ry);
      if (my < 0 || my >= grid.length || mx < 0 || mx >= grid[0].length) break;
      if (grid[my][mx] === 1) break;
      // Check enemies
      for (const en of s.enemies) {
        if (!en.alive) continue;
        const d = Math.hypot(en.x - rx, en.y - ry);
        if (d < 0.35) {
          en.hp -= 34;
          en.hitFlash = 12;
          if (en.hp <= 0) {
            en.alive = false;
            s.kills++;
            onKill();
            setTimeout(() => {
              if (!stateRef.current.running) return;
              const spawns = ENEMY_SPAWN_POSITIONS[mapId] || ENEMY_SPAWN_POSITIONS.canyon;
              const sp = spawns[Math.floor(Math.random() * spawns.length)];
              stateRef.current.enemies.push({ id: uid(), x: sp.x, y: sp.y, angle: sp.angle, hp: 100, shootCd: 80, hitFlash: 0, alive: true, state: "patrol" });
            }, 5000);
          }
          return;
        }
      }
    }
  }, [mapId, mapCfg, onKill, onAmmoChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("click", handleShoot);
    return () => canvas.removeEventListener("click", handleShoot);
  }, [handleShoot]);

  // ─── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const HALF_H = H / 2;
    const grid = mapCfg.grid;
    const ROWS = grid.length;
    const COLS = grid[0].length;
    const MOVE_SPEED = 0.03;
    const ROT_SPEED = 0.002;
    const PLAYER_RADIUS = 0.3;
    const ENEMY_RADIUS = 0.28;

    function isWall(x: number, y: number): boolean {
      const mx = Math.floor(x), my = Math.floor(y);
      if (my < 0 || my >= ROWS || mx < 0 || mx >= COLS) return true;
      return grid[my][mx] === 1;
    }

    // Проверяет, не касается ли окружность радиуса r центра (cx,cy) стены
    function collidesWithWall(cx: number, cy: number, r: number): boolean {
      return (
        isWall(cx - r, cy - r) || isWall(cx + r, cy - r) ||
        isWall(cx - r, cy + r) || isWall(cx + r, cy + r) ||
        isWall(cx,     cy - r) || isWall(cx,     cy + r) ||
        isWall(cx - r, cy    ) || isWall(cx + r, cy    )
      );
    }

    function moveEntity(ox: number, oy: number, dx: number, dy: number, r: number): { x: number; y: number } {
      const nx = ox + dx;
      const ny = oy + dy;
      // Try full move
      if (!collidesWithWall(nx, ny, r)) return { x: nx, y: ny };
      // Slide along X
      if (!collidesWithWall(ox + dx, oy, r)) return { x: ox + dx, y: oy };
      // Slide along Y
      if (!collidesWithWall(ox, oy + dy, r)) return { x: ox, y: oy + dy };
      // Stuck — no move
      return { x: ox, y: oy };
    }

    function castRay(px: number, py: number, angle: number): { dist: number; side: number; wallX: number } {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const mapX = Math.floor(px);
      const mapY = Math.floor(py);

      const deltaDistX = Math.abs(1 / (cosA || 0.0001));
      const deltaDistY = Math.abs(1 / (sinA || 0.0001));

      let stepX: number, stepY: number;
      let sideDistX: number, sideDistY: number;

      if (cosA < 0) { stepX = -1; sideDistX = (px - mapX) * deltaDistX; }
      else           { stepX =  1; sideDistX = (mapX + 1 - px) * deltaDistX; }
      if (sinA < 0) { stepY = -1; sideDistY = (py - mapY) * deltaDistY; }
      else           { stepY =  1; sideDistY = (mapY + 1 - py) * deltaDistY; }

      let mx = mapX, my = mapY;
      let side = 0;
      for (let i = 0; i < 64; i++) {
        if (sideDistX < sideDistY) { sideDistX += deltaDistX; mx += stepX; side = 0; }
        else                        { sideDistY += deltaDistY; my += stepY; side = 1; }
        if (my < 0 || my >= ROWS || mx < 0 || mx >= COLS || grid[my][mx] === 1) break;
      }

      let dist: number, wallX: number;
      if (side === 0) {
        dist = (mx - px + (1 - stepX) / 2) / (cosA || 0.0001);
        wallX = py + dist * sinA;
      } else {
        dist = (my - py + (1 - stepY) / 2) / (sinA || 0.0001);
        wallX = px + dist * cosA;
      }
      wallX -= Math.floor(wallX);
      return { dist: Math.abs(dist), side, wallX };
    }

    function tick() {
      const s = stateRef.current;
      if (!s.running) return;

      // ── Rotation from mouse ──
      if (s.mouseDeltaX !== 0) {
        s.pAngle += s.mouseDeltaX * ROT_SPEED;
        s.mouseDeltaX = 0;
      }
      // Keyboard rotation fallback
      if (s.keys["ArrowLeft"])  s.pAngle -= 0.035;
      if (s.keys["ArrowRight"]) s.pAngle += 0.035;

      // ── Movement ──
      const moveF = (s.keys["KeyW"] || s.keys["ArrowUp"]) ? MOVE_SPEED : (s.keys["KeyS"] || s.keys["ArrowDown"]) ? -MOVE_SPEED * 0.6 : 0;
      const moveS = s.keys["KeyA"] ? -MOVE_SPEED * 0.7 : s.keys["KeyD"] ? MOVE_SPEED * 0.7 : 0;
      const pdx = Math.cos(s.pAngle) * moveF + Math.cos(s.pAngle + Math.PI / 2) * moveS;
      const pdy = Math.sin(s.pAngle) * moveF + Math.sin(s.pAngle + Math.PI / 2) * moveS;
      const newPos = moveEntity(s.px, s.py, pdx, pdy, PLAYER_RADIUS);
      s.px = newPos.x; s.py = newPos.y;

      // Bob
      if (moveF !== 0 || moveS !== 0) s.bobTime += 0.12;

      // Cooldowns
      if (s.shootCd > 0) s.shootCd--;
      if (s.muzzleFlash > 0) s.muzzleFlash--;
      if (s.damageFlash.life > 0) s.damageFlash.life--;
      if (s.reloadTimer > 0) {
        s.reloadTimer--;
        if (s.reloadTimer === 0) { s.ammo = s.maxAmmo; onAmmoChange(s.ammo); }
      }

      // ── Enemy AI ──
      for (const en of s.enemies) {
        if (!en.alive) continue;
        const dx = s.px - en.x, dy = s.py - en.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 8) en.state = "chase";
        if (dist < 3.5) en.state = "attack";
        if (dist > 10) en.state = "patrol";

        en.angle = Math.atan2(dy, dx);

        if (en.state !== "patrol") {
          const spd = en.state === "attack" ? 0.004 : 0.007;
          const edx = Math.cos(en.angle) * spd;
          const edy = Math.sin(en.angle) * spd;
          const enPos = moveEntity(en.x, en.y, edx, edy, ENEMY_RADIUS);
          en.x = enPos.x; en.y = enPos.y;
        }

        if (en.hitFlash > 0) en.hitFlash--;

        if (en.state === "attack" && en.shootCd <= 0) {
          const spread = (Math.random() - 0.5) * 0.3;
          s.projectiles.push({ id: uid(), x: en.x, y: en.y, dx: Math.cos(en.angle + spread) * 0.12, dy: Math.sin(en.angle + spread) * 0.12, fromPlayer: false, life: 80 });
          en.shootCd = 70 + Math.floor(Math.random() * 60);
        }
        if (en.shootCd > 0) en.shootCd--;
      }

      // ── Projectiles ──
      for (let i = s.projectiles.length - 1; i >= 0; i--) {
        const p = s.projectiles[i];
        p.x += p.dx; p.y += p.dy; p.life--;
        if (p.life <= 0 || isWall(p.x, p.y)) { s.projectiles.splice(i, 1); continue; }
        if (!p.fromPlayer) {
          if (Math.hypot(p.x - s.px, p.y - s.py) < 0.35) {
            s.pHP = Math.max(0, s.pHP - 18);
            s.damageFlash.life = 20;
            s.projectiles.splice(i, 1);
            onHealthChange(s.pHP);
            if (s.pHP <= 0) { s.running = false; onDeath(); }
          }
        }
      }

      // ── RENDER ──
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, HALF_H);
      skyGrad.addColorStop(0, mapCfg.ceilColor);
      skyGrad.addColorStop(1, shadedColor(mapCfg.ceilColor, 2.5));
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, HALF_H);

      // Floor gradient
      const floorGrad = ctx.createLinearGradient(0, HALF_H, 0, H);
      floorGrad.addColorStop(0, shadedColor(mapCfg.floorColor, 2.2));
      floorGrad.addColorStop(1, mapCfg.floorColor);
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, HALF_H, W, HALF_H);

      // ── Raycasting ──
      const zBuffer: number[] = new Array(W);
      const bob = Math.sin(s.bobTime) * 6;
      const halfH = HALF_H + bob;

      for (let col = 0; col < W; col++) {
        // Угол луча — равномерно по углу (не по экрану) чтобы не было зеркал
        const rayAngle = s.pAngle - FOV / 2 + (col / W) * FOV;
        const { dist, side } = castRay(s.px, s.py, rayAngle);
        // DDA уже возвращает перпендикулярное расстояние — fish-eye убираем через cos разницы углов
        const perpDist = Math.max(0.1, dist * Math.cos(rayAngle - s.pAngle));
        zBuffer[col] = perpDist;

        const wallH = Math.min(H * 3, H / perpDist);
        const wallTop    = Math.floor(halfH - wallH / 2);
        const wallBottom = Math.floor(halfH + wallH / 2);

        const fog = Math.max(0, 1 - perpDist / MAX_DEPTH);
        const sideDark = side === 1 ? 0.55 : 1.0;
        const shade = fog * sideDark;

        const wallColorHex = side === 0 ? mapCfg.wallColors[0] : mapCfg.wallColors[1];
        ctx.fillStyle = shadedColor(wallColorHex, shade);
        ctx.fillRect(col, wallTop, 1, wallBottom - wallTop);
      }

      // ── Sprites (enemies) ──
      const aliveEnemies = s.enemies.filter(e => e.alive);
      // Sort by distance descending (paint far first)
      aliveEnemies.sort((a, b) =>
        Math.hypot(b.x - s.px, b.y - s.py) - Math.hypot(a.x - s.px, a.y - s.py)
      );

      for (const en of aliveEnemies) {
        const dx = en.x - s.px;
        const dy = en.y - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.1 || dist > MAX_DEPTH) continue;

        // Transform sprite to camera space
        const invDet = 1.0 / (Math.cos(s.pAngle) * Math.sin(s.pAngle + Math.PI/2) - Math.sin(s.pAngle) * Math.cos(s.pAngle + Math.PI/2));
        const tx = invDet * (Math.sin(s.pAngle + Math.PI/2) * dx - Math.cos(s.pAngle + Math.PI/2) * dy);
        const tz = invDet * (-Math.sin(s.pAngle) * dx + Math.cos(s.pAngle) * dy);
        if (tz <= 0) continue;

        const spriteScreenX = Math.floor(W / 2 * (1 + tx / tz));
        const spriteH = Math.abs(Math.floor(H / tz));
        const spriteW = spriteH;
        const drawStartY = HALF_H - spriteH / 2 + bob;
        const drawStartX = spriteScreenX - spriteW / 2;

        if (spriteScreenX < -spriteW || spriteScreenX > W + spriteW) continue;

        const fog = Math.max(0, 1 - dist / MAX_DEPTH);
        const isHit = en.hitFlash > 0 && en.hitFlash % 2 === 0;

        // Draw enemy as low-poly triangle soldier shape
        for (let sx = Math.max(0, drawStartX); sx < Math.min(W, drawStartX + spriteW); sx++) {
          if (tz >= zBuffer[sx]) continue; // occluded by wall
          const texX = (sx - drawStartX) / spriteW; // 0..1 across sprite

          // Body shape: vary height per column to get triangle silhouette
          const bodyBottom = drawStartY + spriteH * 0.9;
          const bodyTop = drawStartY + spriteH * (0.15 + Math.abs(texX - 0.5) * 0.2);
          const h = bodyBottom - bodyTop;
          if (h <= 0) continue;

          const alpha = fog * (isHit ? 1.5 : 1.0);
          const baseColor = isHit ? [255, 80, 80] : en.state === "attack" ? [220, 80, 50] : [180, 140, 80];
          const shade = (0.6 + 0.4 * (1 - Math.abs(texX - 0.5) * 2));
          ctx.fillStyle = `rgba(${Math.floor(baseColor[0]*shade)},${Math.floor(baseColor[1]*shade)},${Math.floor(baseColor[2]*shade)},${Math.min(1, alpha)})`;
          ctx.fillRect(sx, bodyTop, 1, h);

          // Head
          const headR = spriteH * 0.12;
          const headY = drawStartY + spriteH * 0.07;
          if (sx === Math.floor(spriteScreenX)) {
            ctx.fillStyle = `rgba(${Math.floor(baseColor[0]*0.85)},${Math.floor(baseColor[1]*0.85)},${Math.floor(baseColor[2]*0.85)},${Math.min(1, alpha)})`;
            ctx.fillRect(spriteScreenX - headR, headY, headR * 2, headR * 2);
          }
        }

        // HP bar above sprite
        if (dist < 6) {
          const barW = spriteW * 0.8;
          const barX = spriteScreenX - barW / 2;
          const barY = drawStartY - 8;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(barX, barY, barW, 4);
          ctx.fillStyle = en.hp > 60 ? "#4ab84a" : en.hp > 30 ? "#e8b84b" : "#e85a5a";
          ctx.fillRect(barX, barY, barW * (en.hp / 100), 4);
        }
      }

      // ── Enemy projectiles (render as dots) ──
      for (const proj of s.projectiles) {
        if (proj.fromPlayer) continue;
        const dx = proj.x - s.px;
        const dy = proj.y - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.1) continue;

        const invDet = 1.0 / (Math.cos(s.pAngle) * Math.sin(s.pAngle + Math.PI/2) - Math.sin(s.pAngle) * Math.cos(s.pAngle + Math.PI/2));
        const tx = invDet * (Math.sin(s.pAngle + Math.PI/2) * dx - Math.cos(s.pAngle + Math.PI/2) * dy);
        const tz = invDet * (-Math.sin(s.pAngle) * dx + Math.cos(s.pAngle) * dy);
        if (tz <= 0) continue;
        const screenX = Math.floor(W / 2 * (1 + tx / tz));
        const size = Math.max(2, Math.floor(H / tz / 8));
        const screenY = HALF_H;
        if (screenX < 0 || screenX >= W) continue;

        ctx.save();
        ctx.shadowColor = "#ff6060";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#ff8080";
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── Damage vignette ──
      if (s.damageFlash.life > 0) {
        const alpha = (s.damageFlash.life / 20) * 0.5;
        const grad = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.8);
        grad.addColorStop(0, `rgba(200,0,0,0)`);
        grad.addColorStop(1, `rgba(200,0,0,${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Muzzle flash ──
      if (s.muzzleFlash > 0) {
        const alpha = s.muzzleFlash / 8;
        ctx.save();
        ctx.globalAlpha = alpha * 0.25;
        ctx.fillStyle = "#ffe080";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // ── Vignette (always) ──
      const vign = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.85);
      vign.addColorStop(0, "rgba(0,0,0,0)");
      vign.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, W, H);

      // ── Weapon ──
      drawWeapon(ctx, W, H, s.bobTime, s.muzzleFlash, s.reloadTimer);

      // ── Pointer lock hint ──
      if (!s.pointerLocked) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#e8b84b";
        ctx.font = "bold 28px Oswald, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("КЛИКНИ ДЛЯ ЗАХВАТА МЫШИ", W/2, H/2 - 16);
        ctx.fillStyle = "#8899aa";
        ctx.font = "16px Rajdhani, sans-serif";
        ctx.fillText("WASD — движение  |  Мышь — прицел  |  ЛКМ — огонь  |  R — перезарядка", W/2, H/2 + 18);
        ctx.restore();
      }

      s.frameId = requestAnimationFrame(tick);
    }

    const s = stateRef.current;
    s.frameId = requestAnimationFrame(tick);
    return () => {
      s.running = false;
      cancelAnimationFrame(s.frameId);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [mapId, mapCfg, onHealthChange, onAmmoChange, onDeath]);

  return (
    <canvas
      ref={canvasRef}
      width={960}
      height={560}
      className="absolute inset-0 w-full h-full"
      style={{ cursor: "none" }}
    />
  );
}

// ─── Weapon + hands draw ──────────────────────────────────────────────────────
function drawWeapon(ctx: CanvasRenderingContext2D, W: number, H: number, bobTime: number, muzzleFlash: number, reloadTimer: number) {
  const bobX = Math.sin(bobTime * 0.5) * 8;
  const bobY = Math.abs(Math.sin(bobTime)) * 7;
  const reloadDip = reloadTimer > 0 ? lerp(0, 90, Math.sin((1 - reloadTimer / 90) * Math.PI)) : 0;

  // Origin point: bottom-right area, weapon held slightly right of center
  const ox = W / 2 + 60 + bobX;
  const oy = H + reloadDip + bobY;

  ctx.save();

  // ── RIGHT HAND (main grip) ──────────────────────────────────────────────────
  // Forearm
  ctx.fillStyle = "#c8845a";
  ctx.beginPath();
  ctx.moveTo(ox - 20, oy);
  ctx.lineTo(ox + 20, oy);
  ctx.lineTo(ox + 10, oy - 120);
  ctx.lineTo(ox - 30, oy - 110);
  ctx.closePath();
  ctx.fill();
  // Arm shadow/shading
  ctx.fillStyle = "#a06640";
  ctx.beginPath();
  ctx.moveTo(ox + 5, oy);
  ctx.lineTo(ox + 20, oy);
  ctx.lineTo(ox + 10, oy - 120);
  ctx.lineTo(ox, oy - 115);
  ctx.closePath();
  ctx.fill();
  // Sleeve cuff
  ctx.fillStyle = "#2a3040";
  ctx.beginPath();
  ctx.moveTo(ox - 22, oy - 98);
  ctx.lineTo(ox + 12, oy - 105);
  ctx.lineTo(ox + 14, oy - 118);
  ctx.lineTo(ox - 24, oy - 112);
  ctx.closePath();
  ctx.fill();
  // Hand / knuckles
  ctx.fillStyle = "#c88055";
  ctx.beginPath();
  ctx.moveTo(ox - 28, oy - 112);
  ctx.lineTo(ox + 8,  oy - 118);
  ctx.lineTo(ox + 6,  oy - 136);
  ctx.lineTo(ox - 30, oy - 128);
  ctx.closePath();
  ctx.fill();

  // ── LEFT HAND (supporting under barrel) ─────────────────────────────────────
  const lx = ox - 115;
  const ly = oy - 128;
  // Forearm
  ctx.fillStyle = "#c8845a";
  ctx.beginPath();
  ctx.moveTo(lx - 18, ly + 10);
  ctx.lineTo(lx + 18, ly + 10);
  ctx.lineTo(lx + 30, ly - 80);
  ctx.lineTo(lx - 5,  ly - 80);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#a06640";
  ctx.beginPath();
  ctx.moveTo(lx + 5, ly + 10);
  ctx.lineTo(lx + 18, ly + 10);
  ctx.lineTo(lx + 30, ly - 80);
  ctx.lineTo(lx + 15, ly - 78);
  ctx.closePath();
  ctx.fill();
  // Sleeve
  ctx.fillStyle = "#2a3040";
  ctx.beginPath();
  ctx.moveTo(lx - 16, ly - 64);
  ctx.lineTo(lx + 20, ly - 66);
  ctx.lineTo(lx + 22, ly - 78);
  ctx.lineTo(lx - 18, ly - 76);
  ctx.closePath();
  ctx.fill();
  // Hand
  ctx.fillStyle = "#c88055";
  ctx.beginPath();
  ctx.moveTo(lx - 16, ly - 76);
  ctx.lineTo(lx + 20, ly - 78);
  ctx.lineTo(lx + 18, ly - 95);
  ctx.lineTo(lx - 18, ly - 92);
  ctx.closePath();
  ctx.fill();

  // ── GUN BODY ────────────────────────────────────────────────────────────────
  // Stock shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.moveTo(ox - 16, oy - 112);
  ctx.lineTo(ox + 6,  oy - 118);
  ctx.lineTo(ox - 24, oy - 150);
  ctx.lineTo(ox - 50, oy - 148);
  ctx.closePath();
  ctx.fill();

  // Main receiver body
  ctx.fillStyle = "#282828";
  ctx.beginPath();
  ctx.moveTo(ox - 14, oy - 118);  // grip top-right
  ctx.lineTo(ox + 4,  oy - 124);
  ctx.lineTo(ox - 22, oy - 158);  // rear top
  ctx.lineTo(ox - 180, oy - 138); // front top
  ctx.lineTo(ox - 190, oy - 120); // barrel start
  ctx.lineTo(ox - 18,  oy - 108); // bottom
  ctx.closePath();
  ctx.fill();

  // Top rail highlight
  ctx.fillStyle = "#404040";
  ctx.beginPath();
  ctx.moveTo(ox - 22, oy - 158);
  ctx.lineTo(ox + 4,  oy - 124);
  ctx.lineTo(ox - 20, oy - 150);
  ctx.lineTo(ox - 178, oy - 130);
  ctx.closePath();
  ctx.fill();

  // Side panel detail
  ctx.fillStyle = "#1e1e1e";
  ctx.beginPath();
  ctx.moveTo(ox - 30, oy - 120);
  ctx.lineTo(ox - 28, oy - 148);
  ctx.lineTo(ox - 160, oy - 132);
  ctx.lineTo(ox - 162, oy - 116);
  ctx.closePath();
  ctx.fill();

  // Barrel
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.moveTo(ox - 180, oy - 138);
  ctx.lineTo(ox - 250, oy - 130);
  ctx.lineTo(ox - 248, oy - 116);
  ctx.lineTo(ox - 178, oy - 120);
  ctx.closePath();
  ctx.fill();
  // Barrel bottom
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.moveTo(ox - 180, oy - 120);
  ctx.lineTo(ox - 248, oy - 116);
  ctx.lineTo(ox - 246, oy - 108);
  ctx.lineTo(ox - 178, oy - 110);
  ctx.closePath();
  ctx.fill();

  // Muzzle tip
  ctx.fillStyle = "#303030";
  ctx.beginPath();
  ctx.moveTo(ox - 248, oy - 136);
  ctx.lineTo(ox - 260, oy - 133);
  ctx.lineTo(ox - 258, oy - 106);
  ctx.lineTo(ox - 246, oy - 108);
  ctx.closePath();
  ctx.fill();

  // Magazine
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.moveTo(ox - 80, oy - 108);
  ctx.lineTo(ox - 60, oy - 112);
  ctx.lineTo(ox - 65, oy - 68);
  ctx.lineTo(ox - 90, oy - 64);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.moveTo(ox - 60, oy - 112);
  ctx.lineTo(ox - 55, oy - 114);
  ctx.lineTo(ox - 60, oy - 68);
  ctx.lineTo(ox - 65, oy - 68);
  ctx.closePath();
  ctx.fill();

  // Grip
  ctx.fillStyle = "#1e1e1e";
  ctx.beginPath();
  ctx.moveTo(ox - 18, oy - 108);
  ctx.lineTo(ox + 2,  oy - 118);
  ctx.lineTo(ox - 8,  oy - 60);
  ctx.lineTo(ox - 30, oy - 50);
  ctx.closePath();
  ctx.fill();
  // Grip texture lines
  ctx.strokeStyle = "#2e2e2e";
  ctx.lineWidth = 1;
  for (let gi = 0; gi < 5; gi++) {
    const t = gi / 5;
    ctx.beginPath();
    ctx.moveTo(lerp(ox - 18, ox - 8,  t), lerp(oy - 108, oy - 60, t));
    ctx.lineTo(lerp(ox + 2,  ox - 30, t), lerp(oy - 118, oy - 50, t));
    ctx.stroke();
  }

  // Iron sight rear
  ctx.fillStyle = "#404040";
  ctx.fillRect(ox - 40, oy - 163, 14, 8);
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(ox - 39, oy - 162, 5, 7);
  ctx.fillRect(ox - 30, oy - 162, 5, 7);
  // Iron sight front
  ctx.fillStyle = "#404040";
  ctx.fillRect(ox - 196, oy - 145, 8, 12);
  ctx.fillStyle = "#606060";
  ctx.fillRect(ox - 194, oy - 144, 4, 5);

  // Charging handle
  ctx.fillStyle = "#333";
  ctx.fillRect(ox - 10, oy - 142, 16, 7);
  ctx.fillStyle = "#555";
  ctx.fillRect(ox - 9, oy - 141, 14, 4);

  // ── MUZZLE FLASH ────────────────────────────────────────────────────────────
  if (muzzleFlash > 0) {
    const alpha = muzzleFlash / 8;
    const fx = ox - 255;
    const fy = oy - 122;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Core
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffe080";
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(fx, fy, 8, 0, Math.PI * 2);
    ctx.fill();
    // Petals
    ctx.fillStyle = "#ffdd44";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
      const r = 14 + Math.random() * 14;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r);
      ctx.lineTo(fx + Math.cos(a + 0.25) * r * 0.5, fy + Math.sin(a + 0.25) * r * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    // Ambient light on gun
    ctx.globalAlpha = alpha * 0.15;
    ctx.fillStyle = "#ffe080";
    ctx.fillRect(ox - 270, oy - 170, 150, 80);
    ctx.restore();
  }

  ctx.restore();
}