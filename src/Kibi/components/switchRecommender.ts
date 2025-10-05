// ./components/speedTierVisualizer.ts
import { Logger } from "../logger";

type PkmnEntry = {
  details?: string;
  stats?: { spe?: number };
  active?: boolean;
};

function parseName(details?: string) {
  return details?.split(",")[0].trim() ?? "Unknown";
}

function createOverlay(): HTMLElement {
  let el = document.getElementById("speed-tier-overlay");
  if (el) return el;
  el = document.createElement("div");
  el.id = "speed-tier-overlay";
  Object.assign(el.style, {
    position: "fixed",
    left: "10px",
    top: "10px",
    background: "rgba(0,0,0,0.75)",
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    fontFamily: "Inter, system-ui, sans-serif",
    zIndex: 99999,
    fontSize: "13px",
  });
  document.body.appendChild(el);
  return el;
}

function renderOverlay(
  list: { name: string; speed: number; active: boolean }[],
) {
  const el = createOverlay();
  el.innerHTML = `<strong>Speed Tiers</strong><hr>`;
  for (const p of list.slice(0, 8)) {
    const mark = p.active ? "● " : "";
    const line = document.createElement("div");
    line.innerHTML = `${mark}<b>${p.name}</b>: ${p.speed}`;
    el.appendChild(line);
  }
}

function calculateSpeeds(
  team: PkmnEntry[],
): { name: string; speed: number; active: boolean }[] {
  const entries = team.map((p) => ({
    name: parseName(p.details),
    speed: p.stats?.spe ?? 0,
    active: !!p.active,
  }));
  return entries.sort((a, b) => b.speed - a.speed);
}

export function initBattleSpeedVisualizer() {
  const orig = window.WebSocket;
  if (!orig) return;
  (window as any).WebSocket = function (url: string, protocols?: any) {
    const ws = protocols ? new orig(url, protocols) : new orig(url);
    ws.addEventListener("message", (ev) => {
      const msg = ev.data as string;
      if (!msg.includes("|request|")) return;
      try {
        const json = JSON.parse(msg.slice(msg.indexOf("{")));
        const team = json.side?.pokemon ?? [];
        const speeds = calculateSpeeds(team);
        renderOverlay(speeds);
        Logger.log("Speed tiers updated:", speeds);
      } catch (err) {
        Logger.log("Speed visualizer parse error:", err);
      }
    });
    return ws;
  } as any;
  (window as any).WebSocket.prototype = orig.prototype;
}
