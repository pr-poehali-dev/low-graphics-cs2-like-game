import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import GameCanvas from "@/components/GameCanvas";

type Screen = "menu" | "map" | "inventory" | "game" | "settings" | "stats";

const MAPS = [
  {
    id: "canyon",
    name: "Каньон Смерти",
    subtitle: "Пустынная зона",
    image: "https://cdn.poehali.dev/projects/7f955039-9c5b-42b2-b6dd-82dd7c7c35a5/files/ce509451-e930-40e1-a76f-f406d16a74f8.jpg",
    difficulty: "Средняя",
    players: "2–8",
    color: "#e05a2b",
  },
  {
    id: "arctic",
    name: "Арктика",
    subtitle: "Замёрзшая зона",
    image: "https://cdn.poehali.dev/projects/7f955039-9c5b-42b2-b6dd-82dd7c7c35a5/files/521d26f9-11c9-4812-a06f-dc40cf869648.jpg",
    difficulty: "Высокая",
    players: "2–6",
    color: "#4ab8d4",
  },
  {
    id: "jungle",
    name: "Джунгли",
    subtitle: "Руины джунглей",
    image: "https://cdn.poehali.dev/projects/7f955039-9c5b-42b2-b6dd-82dd7c7c35a5/files/8ee30076-5688-477d-9f79-6511417a1bdc.jpg",
    difficulty: "Лёгкая",
    players: "2–10",
    color: "#4ab86a",
  },
];

const WEAPONS = [
  { id: "assault", name: "АК-Поли", type: "Штурмовая винтовка", damage: 85, speed: 70, range: 75, ammo: 30, owned: true, equipped: true, rarity: "gold" },
  { id: "sniper", name: "Призрак", type: "Снайперская винтовка", damage: 98, speed: 30, range: 99, ammo: 5, owned: true, equipped: false, rarity: "orange" },
  { id: "smg", name: "Ураган", type: "Пистолет-пулемёт", damage: 55, speed: 95, range: 45, ammo: 50, owned: true, equipped: false, rarity: "blue" },
  { id: "shotgun", name: "Разрушитель", type: "Дробовик", damage: 95, speed: 45, range: 30, ammo: 8, owned: false, equipped: false, rarity: "purple" },
  { id: "rocket", name: "Гром", type: "Ракетница", damage: 100, speed: 20, range: 80, ammo: 2, owned: false, equipped: false, rarity: "red" },
  { id: "pistol", name: "Кобра", type: "Пистолет", damage: 45, speed: 85, range: 50, ammo: 15, owned: true, equipped: false, rarity: "gray" },
];

const ITEMS = [
  { id: "medkit", name: "Аптечка", qty: 3, icon: "Heart", color: "#e85a5a" },
  { id: "armor", name: "Броня", qty: 1, icon: "Shield", color: "#4ab8d4" },
  { id: "grenade", name: "Граната", qty: 5, icon: "Zap", color: "#e8b84b" },
  { id: "ammo", name: "Патроны", qty: 120, icon: "Crosshair", color: "#c8d4e8" },
  { id: "scope", name: "Прицел", qty: 2, icon: "Eye", color: "#a0d4a0" },
  { id: "silencer", name: "Глушитель", qty: 1, icon: "Volume2", color: "#8888cc" },
];

const STATS = [
  { label: "Всего боёв", value: "247", icon: "Swords", color: "#e8b84b" },
  { label: "Победы", value: "183", icon: "Trophy", color: "#4ab84a" },
  { label: "Поражения", value: "64", icon: "X", color: "#e85a5a" },
  { label: "Убийств", value: "1,842", icon: "Crosshair", color: "#e05a2b" },
  { label: "Смертей", value: "391", icon: "Skull", color: "#887788" },
  { label: "K/D", value: "4.71", icon: "TrendingUp", color: "#4ab8d4" },
  { label: "Точность", value: "68%", icon: "Target", color: "#c8d4e8" },
  { label: "Время в игре", value: "84ч", icon: "Clock", color: "#a08840" },
];

const CONTROLS = [
  { action: "Движение вперёд", key: "W" },
  { action: "Движение назад", key: "S" },
  { action: "Влево", key: "A" },
  { action: "Вправо", key: "D" },
  { action: "Прыжок", key: "ПРОБЕЛ" },
  { action: "Огонь", key: "ЛКМ" },
  { action: "Прицел", key: "ПКМ" },
  { action: "Перезарядка", key: "R" },
  { action: "Граната", key: "G" },
  { action: "Карта", key: "M" },
];

const rarityColor: Record<string, string> = {
  gold: "#e8b84b",
  orange: "#e05a2b",
  blue: "#4ab8d4",
  purple: "#9966cc",
  red: "#e85a5a",
  gray: "#667788",
};

function StatBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-none overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-full transition-all duration-700" style={{ width: `${value}%`, background: "linear-gradient(90deg, var(--poly-gold), var(--poly-orange))" }} />
    </div>
  );
}

function GameHUD({ onExit }: { onExit: () => void }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="clip-bevel px-3 py-1.5 text-xs font-oswald font-semibold tracking-widest"
            style={{ background: "rgba(13,15,20,0.9)", color: "var(--poly-gold)", border: "1px solid var(--poly-border)" }}>
            СВОБОДНЫЙ БОЙ
          </div>
          <div className="text-xs font-rajdhani" style={{ color: "var(--poly-dim)" }}>
            <Icon name="Clock" size={12} className="inline mr-1" />14:32
          </div>
        </div>
        <button onClick={onExit}
          className="clip-bevel px-4 py-1.5 text-xs font-oswald font-semibold tracking-widest transition-all hover:opacity-80"
          style={{ background: "rgba(224,90,43,0.2)", color: "#e05a2b", border: "1px solid #e05a2b" }}>
          ВЫЙТИ
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon name="Heart" size={14} className="pulse-health" style={{ color: "#e85a5a" } as React.CSSProperties} />
            <div className="w-40 h-3 clip-bevel overflow-hidden" style={{ background: "rgba(13,15,20,0.8)" }}>
              <div className="h-full w-3/4 transition-all" style={{ background: "linear-gradient(90deg, #c23030, #e85a5a)" }} />
            </div>
            <span className="text-xs font-oswald font-bold" style={{ color: "#e85a5a" }}>75</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Shield" size={14} style={{ color: "#4ab8d4" }} />
            <div className="w-40 h-3 clip-bevel overflow-hidden" style={{ background: "rgba(13,15,20,0.8)" }}>
              <div className="h-full w-1/2 transition-all" style={{ background: "linear-gradient(90deg, #2a7a9a, #4ab8d4)" }} />
            </div>
            <span className="text-xs font-oswald font-bold" style={{ color: "#4ab8d4" }}>50</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl font-oswald font-bold text-glow-gold" style={{ color: "var(--poly-gold)" }}>7</div>
          <div className="text-xs font-rajdhani tracking-widest" style={{ color: "var(--poly-dim)" }}>УБИЙСТВ</div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-rajdhani tracking-wider" style={{ color: "var(--poly-dim)" }}>АК-ПОЛИ</div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-oswald font-bold" style={{ color: "var(--poly-text)" }}>23</span>
            <span className="text-xl font-oswald mb-1" style={{ color: "var(--poly-dim)" }}>/ 30</span>
          </div>
          <div className="text-xs font-rajdhani tracking-wider" style={{ color: "var(--poly-gold)" }}>● ШТУРМОВАЯ</div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-8 h-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2.5" style={{ background: "rgba(232,184,75,0.8)" }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2.5" style={{ background: "rgba(232,184,75,0.8)" }} />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-2.5" style={{ background: "rgba(232,184,75,0.8)" }} />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-2.5" style={{ background: "rgba(232,184,75,0.8)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full" style={{ background: "rgba(232,184,75,0.6)" }} />
          </div>
        </div>
      </div>

      <div className="absolute top-16 right-4 flex flex-col gap-1">
        {[
          { killer: "Игрок_1", victim: "Враг_7", weapon: "АК-Поли" },
          { killer: "Враг_3", victim: "Игрок_2", weapon: "Призрак" },
          { killer: "Игрок_1", victim: "Враг_2", weapon: "Граната" },
        ].map((kill, i) => (
          <div key={i} className="clip-bevel flex items-center gap-2 px-3 py-1 text-xs font-rajdhani"
            style={{ background: "rgba(13,15,20,0.85)", opacity: 1 - i * 0.3 }}>
            <span style={{ color: i === 0 ? "var(--poly-gold)" : "var(--poly-text)" }}>{kill.killer}</span>
            <Icon name="Crosshair" size={10} style={{ color: "var(--poly-dim)" }} />
            <span style={{ color: i === 1 ? "#e85a5a" : "var(--poly-dim)" }}>{kill.victim}</span>
            <span style={{ color: "var(--poly-dim)" }}>· {kill.weapon}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [selectedMap, setSelectedMap] = useState("canyon");
  const [equippedWeapon, setEquippedWeapon] = useState("assault");
  const [graphicsQuality, setGraphicsQuality] = useState(2);
  const [fovValue, setFovValue] = useState(75);
  const [sensValue, setSensValue] = useState(50);
  const [soundVolume, setSoundVolume] = useState(70);
  const [playerHP, setPlayerHP] = useState(100);
  const [playerAmmo, setPlayerAmmo] = useState(30);
  const [killCount, setKillCount] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const navigate = (s: Screen) => setScreen(s);

  const handleKill = useCallback(() => setKillCount(k => k + 1), []);
  const handleDeath = useCallback(() => setIsDead(true), []);
  const handleHealthChange = useCallback((hp: number) => setPlayerHP(hp), []);
  const handleAmmoChange = useCallback((ammo: number) => setPlayerAmmo(ammo), []);

  const startGame = () => {
    setPlayerHP(100);
    setPlayerAmmo(30);
    setKillCount(0);
    setIsDead(false);
    setGameKey(k => k + 1);
    navigate("game");
  };

  const bgImage = "https://cdn.poehali.dev/projects/7f955039-9c5b-42b2-b6dd-82dd7c7c35a5/files/00872038-8afd-4da1-afc4-79572f796ffd.jpg";

  return (
    <div className="relative w-screen h-screen overflow-hidden poly-bg scanlines" style={{ fontFamily: "'Rajdhani', sans-serif" }}>

      {/* MAIN MENU */}
      {screen === "menu" && (
        <div className="relative w-full h-full flex animate-fade-in">
          <div className="absolute inset-0">
            <img src={bgImage} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(13,15,20,0.98) 35%, rgba(13,15,20,0.4) 70%, rgba(13,15,20,0.2) 100%)" }} />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full w-80 px-10 py-12">
            <div>
              <div className="mb-1 text-xs font-rajdhani tracking-[0.3em]" style={{ color: "var(--poly-dim)" }}>TACTICAL COMBAT</div>
              <div className="text-6xl font-oswald font-bold tracking-tight text-glow-gold animate-fade-in-up" style={{ color: "var(--poly-gold)", lineHeight: 1 }}>
                POLY<br />WAR
              </div>
              <div className="mt-2 w-16 h-0.5" style={{ background: "var(--poly-orange)" }} />
            </div>

            <nav className="flex flex-col gap-0.5">
              {[
                { label: "НАЧАТЬ БОЙ", screen: "map" as Screen, icon: "Play" },
                { label: "ИНВЕНТАРЬ", screen: "inventory" as Screen, icon: "Package" },
                { label: "НАСТРОЙКИ", screen: "settings" as Screen, icon: "Settings" },
                { label: "СТАТИСТИКА", screen: "stats" as Screen, icon: "BarChart2" },
              ].map((item, i) => (
                <button className="menu-item flex items-center gap-4 px-4 py-3.5 text-left w-full font-medium"
                  key={item.screen}
                  onClick={() => navigate(item.screen)}
                  className="menu-item flex items-center gap-4 px-4 py-3.5 text-left w-full"
                  style={{
                    color: "var(--poly-text)",
                    fontSize: "0.9rem",
                    letterSpacing: "0.15em",
                    fontFamily: "'Oswald', sans-serif",
                    fontWeight: 500,
                    animationDelay: `${(i + 2) * 0.1}s`,
                    opacity: 0,
                    animation: `fade-in-up 0.4s ease-out ${(i + 2) * 0.1}s forwards`,
                  }}
                >
                  <Icon name={item.icon} fallback="Circle" size={16} style={{ color: "var(--poly-dim)" }} />
                  {item.label}
                  <Icon name="ChevronRight" size={14} className="ml-auto opacity-30" />
                </button>
              ))}
            </nav>

            <div className="text-xs font-rajdhani" style={{ color: "var(--poly-dim)" }}>
              <div>ВЕРСИЯ 0.1.0 · СВОБОДНЫЙ БОЙ</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                СЕРВЕРЫ ОНЛАЙН · 1,247 ИГРОКОВ
              </div>
            </div>
          </div>

          <div className="absolute right-20 top-1/2 -translate-y-1/2 z-10 opacity-20">
            <svg width="300" height="300" viewBox="0 0 300 300">
              <polygon points="150,20 280,260 20,260" fill="none" stroke="#e8b84b" strokeWidth="1" />
              <polygon points="150,60 250,240 50,240" fill="none" stroke="#e05a2b" strokeWidth="0.5" />
              <polygon points="150,100 220,220 80,220" fill="rgba(232,184,75,0.05)" stroke="#e8b84b" strokeWidth="0.5" />
            </svg>
          </div>
        </div>
      )}

      {/* MAP SELECTION */}
      {screen === "map" && (
        <div className="relative w-full h-full flex flex-col animate-fade-in p-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate("menu")} className="flex items-center gap-2 text-sm font-oswald tracking-widest hover:opacity-70 transition-opacity" style={{ color: "var(--poly-dim)" }}>
              <Icon name="ChevronLeft" size={18} />НАЗАД
            </button>
            <div className="w-px h-6" style={{ background: "var(--poly-border)" }} />
            <h1 className="text-2xl font-oswald font-bold tracking-widest" style={{ color: "var(--poly-gold)" }}>ВЫБОР КАРТЫ</h1>
          </div>

          <div className="flex gap-6 flex-1">
            {MAPS.map((map) => (
              <button key={map.id} onClick={() => setSelectedMap(map.id)}
                className={`map-card relative flex-1 flex flex-col overflow-hidden ${selectedMap === map.id ? "selected" : ""}`}
                style={{ background: "var(--poly-panel)" }}>
                <div className="relative h-48 overflow-hidden">
                  <img src={map.image} alt={map.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, var(--poly-panel) 100%)" }} />
                  {selectedMap === map.id && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 text-xs font-oswald tracking-widest clip-bevel"
                      style={{ background: map.color, color: "#fff" }}>
                      <Icon name="Check" size={10} />ВЫБРАНО
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3 text-left">
                  <div>
                    <div className="text-xs font-rajdhani tracking-widest mb-1" style={{ color: "var(--poly-dim)" }}>{map.subtitle}</div>
                    <div className="text-xl font-oswald font-bold" style={{ color: selectedMap === map.id ? map.color : "var(--poly-text)" }}>{map.name}</div>
                  </div>
                  <div className="flex gap-4 text-xs font-rajdhani">
                    <div>
                      <div style={{ color: "var(--poly-dim)" }}>СЛОЖНОСТЬ</div>
                      <div className="font-semibold mt-0.5" style={{ color: "var(--poly-text)" }}>{map.difficulty}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--poly-dim)" }}>ИГРОКОВ</div>
                      <div className="font-semibold mt-0.5" style={{ color: "var(--poly-text)" }}>{map.players}</div>
                    </div>
                  </div>
                  <div className="h-px w-full mt-auto" style={{ background: selectedMap === map.id ? map.color : "var(--poly-border)" }} />
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={startGame}
              className="clip-bevel-lg px-10 py-4 text-base font-oswald font-bold tracking-widest glow-orange transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--poly-orange), #c04020)", color: "#fff" }}>
              <Icon name="Play" size={16} className="inline mr-2" />В БОЙ
            </button>
          </div>
        </div>
      )}

      {/* INVENTORY */}
      {screen === "inventory" && (
        <div className="relative w-full h-full flex flex-col animate-fade-in p-8">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate("menu")} className="flex items-center gap-2 text-sm font-oswald tracking-widest hover:opacity-70 transition-opacity" style={{ color: "var(--poly-dim)" }}>
              <Icon name="ChevronLeft" size={18} />НАЗАД
            </button>
            <div className="w-px h-6" style={{ background: "var(--poly-border)" }} />
            <h1 className="text-2xl font-oswald font-bold tracking-widest" style={{ color: "var(--poly-gold)" }}>ИНВЕНТАРЬ</h1>
          </div>

          <div className="flex gap-6 flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="text-xs font-oswald tracking-widest mb-3 px-1" style={{ color: "var(--poly-dim)" }}>ОРУЖИЕ ({WEAPONS.length})</div>
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {WEAPONS.map((w) => (
                  <button key={w.id} onClick={() => w.owned && setEquippedWeapon(w.id)}
                    className={`weapon-card clip-bevel p-4 text-left ${equippedWeapon === w.id ? "active" : ""} ${!w.owned ? "opacity-40 cursor-not-allowed" : ""}`}
                    style={{ background: "var(--poly-panel)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: rarityColor[w.rarity] }} />
                          <span className="text-base font-oswald font-semibold" style={{ color: w.owned ? "var(--poly-text)" : "var(--poly-dim)" }}>{w.name}</span>
                          {equippedWeapon === w.id && (
                            <span className="text-xs px-1.5 py-0.5 font-oswald tracking-wider"
                              style={{ background: "rgba(232,184,75,0.15)", color: "var(--poly-gold)", border: "1px solid var(--poly-gold)" }}>СНАРЯЖЕНО</span>
                          )}
                          {!w.owned && (
                            <span className="text-xs px-1.5 py-0.5 font-oswald tracking-wider"
                              style={{ color: "var(--poly-dim)", border: "1px solid var(--poly-border)" }}>
                              <Icon name="Lock" size={8} className="inline mr-1" />НЕТ
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-rajdhani mb-3" style={{ color: "var(--poly-dim)" }}>{w.type} · {w.ammo} патр.</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[{ label: "УРОН", value: w.damage }, { label: "СКОР", value: w.speed }, { label: "ДАЛЬН", value: w.range }].map(stat => (
                            <div key={stat.label}>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-rajdhani" style={{ color: "var(--poly-dim)" }}>{stat.label}</span>
                                <span className="text-xs font-oswald" style={{ color: "var(--poly-text)" }}>{stat.value}</span>
                              </div>
                              <StatBar value={stat.value} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px" style={{ background: "var(--poly-border)" }} />

            <div className="w-64 flex flex-col overflow-hidden">
              <div className="text-xs font-oswald tracking-widest mb-3 px-1" style={{ color: "var(--poly-dim)" }}>ПРЕДМЕТЫ</div>
              <div className="flex flex-col gap-2">
                {ITEMS.map((item) => (
                  <div key={item.id} className="clip-bevel flex items-center gap-3 p-3"
                    style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
                    <div className="w-9 h-9 clip-diamond flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}22` }}>
                      <Icon name={item.icon} fallback="Circle" size={14} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-oswald font-medium" style={{ color: "var(--poly-text)" }}>{item.name}</div>
                    </div>
                    <div className="text-lg font-oswald font-bold" style={{ color: item.color }}>×{item.qty}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME SCREEN */}
      {screen === "game" && (
        <div className="relative w-full h-full" style={{ background: "#0d0f14" }}>
          {/* Живой Canvas */}
          <GameCanvas
            key={gameKey}
            mapId={selectedMap}
            onKill={handleKill}
            onDeath={handleDeath}
            onHealthChange={handleHealthChange}
            onAmmoChange={handleAmmoChange}
            playerHP={playerHP}
          />

          {/* HUD поверх canvas */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="clip-bevel px-3 py-1.5 text-xs font-oswald font-semibold tracking-widest"
                  style={{ background: "rgba(13,15,20,0.9)", color: "var(--poly-gold)", border: "1px solid var(--poly-border)" }}>
                  СВОБОДНЫЙ БОЙ · {MAPS.find(m => m.id === selectedMap)?.name || ""}
                </div>
              </div>
              <button
                className="pointer-events-auto clip-bevel px-4 py-1.5 text-xs font-oswald font-semibold tracking-widest transition-all hover:opacity-80"
                onClick={() => navigate("menu")}
                style={{ background: "rgba(224,90,43,0.2)", color: "#e05a2b", border: "1px solid #e05a2b" }}>
                ВЫЙТИ
              </button>
            </div>

            {/* Bottom HUD */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-5 pointer-events-none">
              {/* HP / Armor */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="Heart" size={14} className="pulse-health" style={{ color: "#e85a5a" } as React.CSSProperties} />
                  <div className="w-40 h-3 clip-bevel overflow-hidden" style={{ background: "rgba(13,15,20,0.8)" }}>
                    <div className="h-full transition-all duration-200" style={{ width: `${playerHP}%`, background: "linear-gradient(90deg, #c23030, #e85a5a)" }} />
                  </div>
                  <span className="text-xs font-oswald font-bold" style={{ color: "#e85a5a" }}>{playerHP}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Shield" size={14} style={{ color: "#4ab8d4" }} />
                  <div className="w-40 h-3 clip-bevel overflow-hidden" style={{ background: "rgba(13,15,20,0.8)" }}>
                    <div className="h-full w-1/2" style={{ background: "linear-gradient(90deg, #2a7a9a, #4ab8d4)" }} />
                  </div>
                  <span className="text-xs font-oswald font-bold" style={{ color: "#4ab8d4" }}>50</span>
                </div>
              </div>

              {/* Kill counter */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-3xl font-oswald font-bold text-glow-gold" style={{ color: "var(--poly-gold)" }}>{killCount}</div>
                <div className="text-xs font-rajdhani tracking-widest" style={{ color: "var(--poly-dim)" }}>УБИЙСТВ</div>
              </div>

              {/* Ammo */}
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs font-rajdhani tracking-wider" style={{ color: "var(--poly-dim)" }}>АК-ПОЛИ</div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-oswald font-bold" style={{ color: playerAmmo === 0 ? "#e85a5a" : "var(--poly-text)" }}>{playerAmmo}</span>
                  <span className="text-xl font-oswald mb-1" style={{ color: "var(--poly-dim)" }}>/ 30</span>
                </div>
                <div className="text-xs font-rajdhani tracking-wider" style={{ color: "var(--poly-gold)" }}>● ШТУРМОВАЯ</div>
              </div>
            </div>

            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-8 h-8">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2.5" style={{ background: "rgba(232,184,75,0.8)" }} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2.5" style={{ background: "rgba(232,184,75,0.8)" }} />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-2.5" style={{ background: "rgba(232,184,75,0.8)" }} />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-2.5" style={{ background: "rgba(232,184,75,0.8)" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full" style={{ background: "rgba(232,184,75,0.6)" }} />
                </div>
              </div>
            </div>

            {/* Hints */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4 text-xs font-rajdhani pointer-events-none"
              style={{ color: "var(--poly-dim)" }}>
              <span>WASD — движение</span>
              <span>·</span>
              <span>ЛКМ — огонь</span>
              <span>·</span>
              <span>R — перезарядка</span>
            </div>
          </div>

          {/* Death screen */}
          {isDead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in pointer-events-auto"
              style={{ background: "rgba(13,0,0,0.85)", zIndex: 20 }}>
              <div className="text-6xl font-oswald font-black mb-2" style={{ color: "#e85a5a" }}>ВЫ УБИТЫ</div>
              <div className="text-lg font-rajdhani mb-1" style={{ color: "var(--poly-dim)" }}>Убийств в этом бою: <span style={{ color: "var(--poly-gold)" }}>{killCount}</span></div>
              <div className="mt-8 flex gap-4">
                <button onClick={startGame}
                  className="clip-bevel-lg px-8 py-3 font-oswald font-bold tracking-widest text-sm transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, var(--poly-orange), #c04020)", color: "#fff" }}>
                  <Icon name="RotateCcw" size={14} className="inline mr-2" />СНОВА В БОЙ
                </button>
                <button onClick={() => navigate("menu")}
                  className="clip-bevel-lg px-8 py-3 font-oswald font-bold tracking-widest text-sm transition-all hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.05)", color: "var(--poly-text)", border: "1px solid var(--poly-border)" }}>
                  ГЛАВНОЕ МЕНЮ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS */}
      {screen === "settings" && (
        <div className="relative w-full h-full flex flex-col animate-fade-in p-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate("menu")} className="flex items-center gap-2 text-sm font-oswald tracking-widest hover:opacity-70 transition-opacity" style={{ color: "var(--poly-dim)" }}>
              <Icon name="ChevronLeft" size={18} />НАЗАД
            </button>
            <div className="w-px h-6" style={{ background: "var(--poly-border)" }} />
            <h1 className="text-2xl font-oswald font-bold tracking-widest" style={{ color: "var(--poly-gold)" }}>НАСТРОЙКИ</h1>
          </div>

          <div className="flex gap-8 flex-1 overflow-auto">
            <div className="flex-1 flex flex-col gap-4">
              <div className="text-xs font-oswald tracking-widest" style={{ color: "var(--poly-dim)" }}>ГРАФИКА</div>

              <div className="clip-bevel p-5" style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
                <div className="text-sm font-oswald mb-3" style={{ color: "var(--poly-text)" }}>КАЧЕСТВО ГРАФИКИ</div>
                <div className="flex gap-2">
                  {["НИЗКОЕ", "СРЕДНЕЕ", "ВЫСОКОЕ", "УЛЬТРА"].map((q, i) => (
                    <button key={q} onClick={() => setGraphicsQuality(i)}
                      className="flex-1 py-2 text-xs font-oswald tracking-wider clip-bevel transition-all"
                      style={{
                        background: graphicsQuality === i ? "var(--poly-gold)" : "rgba(255,255,255,0.04)",
                        color: graphicsQuality === i ? "#0d0f14" : "var(--poly-dim)",
                        border: graphicsQuality === i ? "none" : "1px solid var(--poly-border)",
                      }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="clip-bevel p-5" style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
                <div className="flex justify-between mb-3">
                  <div className="text-sm font-oswald" style={{ color: "var(--poly-text)" }}>ПОЛЕ ЗРЕНИЯ (FOV)</div>
                  <div className="text-sm font-oswald font-bold" style={{ color: "var(--poly-gold)" }}>{fovValue}°</div>
                </div>
                <input type="range" min="60" max="120" value={fovValue} onChange={e => setFovValue(+e.target.value)}
                  className="w-full h-1 appearance-none rounded-none cursor-pointer"
                  style={{ background: `linear-gradient(90deg, var(--poly-gold) ${((fovValue - 60) / 60) * 100}%, var(--poly-border) ${((fovValue - 60) / 60) * 100}%)` }} />
                <div className="flex justify-between text-xs mt-1.5 font-rajdhani" style={{ color: "var(--poly-dim)" }}>
                  <span>60°</span><span>90°</span><span>120°</span>
                </div>
              </div>

              <div className="clip-bevel p-5" style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
                <div className="flex justify-between mb-3">
                  <div className="text-sm font-oswald" style={{ color: "var(--poly-text)" }}>ГРОМКОСТЬ ЗВУКА</div>
                  <div className="text-sm font-oswald font-bold" style={{ color: "var(--poly-gold)" }}>{soundVolume}%</div>
                </div>
                <input type="range" min="0" max="100" value={soundVolume} onChange={e => setSoundVolume(+e.target.value)}
                  className="w-full h-1 appearance-none rounded-none cursor-pointer"
                  style={{ background: `linear-gradient(90deg, var(--poly-gold) ${soundVolume}%, var(--poly-border) ${soundVolume}%)` }} />
              </div>

              <div className="clip-bevel p-5" style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
                {[
                  { label: "Вертикальная синхронизация", on: true },
                  { label: "Размытие движения", on: false },
                  { label: "Тени высокого качества", on: true },
                  { label: "Отображение FPS", on: true },
                ].map((toggle, i) => (
                  <div key={i} className={`flex items-center justify-between ${i > 0 ? "mt-3 pt-3 border-t" : ""}`} style={{ borderColor: "var(--poly-border)" }}>
                    <span className="text-sm font-rajdhani" style={{ color: "var(--poly-text)" }}>{toggle.label}</span>
                    <div className={`w-10 h-5 clip-bevel relative cursor-pointer`}
                      style={{
                        background: toggle.on ? "rgba(232,184,75,0.2)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${toggle.on ? "var(--poly-gold)" : "var(--poly-border)"}`,
                      }}>
                      <div className="absolute top-0.5 h-4 w-4 clip-bevel transition-all"
                        style={{
                          left: toggle.on ? "calc(100% - 18px)" : "2px",
                          background: toggle.on ? "var(--poly-gold)" : "var(--poly-dim)"
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="text-xs font-oswald tracking-widest" style={{ color: "var(--poly-dim)" }}>УПРАВЛЕНИЕ</div>

              <div className="clip-bevel p-5" style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
                <div className="flex justify-between mb-3">
                  <div className="text-sm font-oswald" style={{ color: "var(--poly-text)" }}>ЧУВСТВИТЕЛЬНОСТЬ МЫШИ</div>
                  <div className="text-sm font-oswald font-bold" style={{ color: "var(--poly-gold)" }}>{sensValue}</div>
                </div>
                <input type="range" min="1" max="100" value={sensValue} onChange={e => setSensValue(+e.target.value)}
                  className="w-full h-1 appearance-none rounded-none cursor-pointer"
                  style={{ background: `linear-gradient(90deg, var(--poly-gold) ${sensValue}%, var(--poly-border) ${sensValue}%)` }} />
              </div>

              <div className="clip-bevel p-5 flex-1" style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
                <div className="text-sm font-oswald mb-4" style={{ color: "var(--poly-text)" }}>ПРИВЯЗКИ КЛАВИШ</div>
                <div className="flex flex-col">
                  {CONTROLS.map((ctrl, i) => (
                    <div key={i} className={`flex items-center justify-between py-2.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--poly-border)" }}>
                      <span className="text-sm font-rajdhani" style={{ color: "var(--poly-text)" }}>{ctrl.action}</span>
                      <div className="px-3 py-1 text-xs font-oswald font-bold clip-bevel"
                        style={{ background: "rgba(232,184,75,0.1)", color: "var(--poly-gold)", border: "1px solid rgba(232,184,75,0.3)" }}>
                        {ctrl.key}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATS */}
      {screen === "stats" && (
        <div className="relative w-full h-full flex flex-col animate-fade-in p-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate("menu")} className="flex items-center gap-2 text-sm font-oswald tracking-widest hover:opacity-70 transition-opacity" style={{ color: "var(--poly-dim)" }}>
              <Icon name="ChevronLeft" size={18} />НАЗАД
            </button>
            <div className="w-px h-6" style={{ background: "var(--poly-border)" }} />
            <h1 className="text-2xl font-oswald font-bold tracking-widest" style={{ color: "var(--poly-gold)" }}>СТАТИСТИКА</h1>
          </div>

          <div className="clip-bevel-lg p-6 mb-6 flex items-center gap-6 animate-fade-in-up"
            style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
            <div className="w-16 h-16 clip-diamond flex items-center justify-center text-2xl font-oswald font-black glow-gold"
              style={{ background: "linear-gradient(135deg, var(--poly-gold), var(--poly-orange))", color: "#0d0f14" }}>
              P1
            </div>
            <div>
              <div className="text-xl font-oswald font-bold" style={{ color: "var(--poly-text)" }}>ИГРОК_1</div>
              <div className="text-sm font-rajdhani" style={{ color: "var(--poly-dim)" }}>РАНГ: ЭЛИТА · ТОП 5% ИГРОКОВ</div>
            </div>
            <div className="ml-auto flex gap-8">
              <div className="text-center">
                <div className="text-3xl font-oswald font-black" style={{ color: "var(--poly-gold)" }}>74%</div>
                <div className="text-xs font-oswald tracking-widest" style={{ color: "var(--poly-dim)" }}>WINRATE</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-oswald font-black" style={{ color: "var(--poly-orange)" }}>4.71</div>
                <div className="text-xs font-oswald tracking-widest" style={{ color: "var(--poly-dim)" }}>K/D RATIO</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="clip-bevel p-4" style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={stat.icon} fallback="Circle" size={14} style={{ color: stat.color }} />
                  <span className="text-xs font-oswald tracking-wider" style={{ color: "var(--poly-dim)" }}>{stat.label}</span>
                </div>
                <div className="text-3xl font-oswald font-black" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="clip-bevel p-5 flex-1" style={{ background: "var(--poly-panel)", border: "1px solid var(--poly-border)" }}>
            <div className="text-sm font-oswald tracking-widest mb-4" style={{ color: "var(--poly-text)" }}>ПОСЛЕДНИЕ БОИ</div>
            <div className="flex flex-col">
              {[
                { map: "Каньон Смерти", kills: 12, deaths: 2, result: "ПОБЕДА", kd: "6.0", time: "18 мин" },
                { map: "Арктика", kills: 8, deaths: 3, result: "ПОБЕДА", kd: "2.67", time: "22 мин" },
                { map: "Джунгли", kills: 5, deaths: 5, result: "ПОРАЖЕНИЕ", kd: "1.0", time: "15 мин" },
                { map: "Каньон Смерти", kills: 15, deaths: 1, result: "ПОБЕДА", kd: "15.0", time: "25 мин" },
              ].map((match, i) => (
                <div key={i} className={`flex items-center gap-6 py-3 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--poly-border)" }}>
                  <div className="w-24 text-center py-1 text-xs font-oswald tracking-wider clip-bevel"
                    style={{
                      background: match.result === "ПОБЕДА" ? "rgba(74,184,74,0.15)" : "rgba(232,90,90,0.15)",
                      color: match.result === "ПОБЕДА" ? "#4ab84a" : "#e85a5a",
                      border: `1px solid ${match.result === "ПОБЕДА" ? "#4ab84a44" : "#e85a5a44"}`,
                    }}>
                    {match.result}
                  </div>
                  <div className="flex-1 font-rajdhani" style={{ color: "var(--poly-text)" }}>{match.map}</div>
                  <div className="flex gap-4 text-sm font-oswald">
                    <span style={{ color: "#4ab84a" }}>{match.kills} К</span>
                    <span style={{ color: "var(--poly-dim)" }}>/</span>
                    <span style={{ color: "#e85a5a" }}>{match.deaths} D</span>
                    <span style={{ color: "var(--poly-dim)" }}>KD: {match.kd}</span>
                  </div>
                  <div className="text-xs font-rajdhani" style={{ color: "var(--poly-dim)" }}>{match.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}