// speedTierVisualizer.ts
// Speed Tier Visualizer for Pokemon Showdown battles.
// Usage: import { initBattleSpeedVisualizer } and call once when page loads.
// It listens to |request| blocks (WebSocket messages) and displays a small overlay
// with sorted speed values and optional extra columns (scarf/tailwind effects can be simulated).

type PkmnEntry = {
  details?: string;
  condition?: string;
  active?: boolean;
  stats?: { spe?: number };
  name?: string;
};

function parseNameFromDetails(details?: string) {
  if (!details) return "";
  return details.split(",")[0].trim();
}

function createContainer(): HTMLElement {
  let root = document.getElementById("kibi-speed-overlay");
  if (root) return root;
  root = document.createElement("div");
  root.id = "kibi-speed-overlay";
  Object.assign(root.style, {
    position: "fixed",
    left: "12px",
    top: "12px",
    zIndex: "99999",
    background: "rgba(0,0,0,0.6)",
    color: "white",
    padding: "8px",
    borderRadius: "8px",
    fontSize: "13px",
    maxWidth: "360px",
    fontFamily: "Inter, system-ui, sans-serif",
  });
  document.body.appendChild(root);
  return root;
}

function renderSpeeds(
  list: {
    name: string;
    spe?: number;
    speScarf?: number;
    speTailwind?: number;
    active?: boolean;
  }[],
) {
  const root = createContainer();
  root.innerHTML = `<strong>Speed Tier Visualizer</strong><div style="height:6px"></div>`;
  for (const p of list.slice(0, 8)) {
    const row = document.createElement("div");
    row.style.marginBottom = "6px";
    const activeMark = p.active ? "● " : "";
    const speText = (p.spe ?? "?").toString();
    const details = `base ${speText}${p.speScarf ? ` • scarf ${p.speScarf}` : ""}${p.speTailwind ? ` • tailwind ${p.speTailwind}` : ""}`;
    row.innerHTML = `<div style="display:flex;justify-content:space-between">
      <div style="font-weight:600">${activeMark}${p.name}</div>
      <div style="opacity:.95">${p.spe ?? "?"}</div>
    </div>
    <div style="color:#ddd;font-size:12px">${details}</div>`;
    root.appendChild(row);
  }
}

function extractRequestJSON(msg: string) {
  const tag = "|request|";
  const idx = msg.indexOf(tag);
  if (idx === -1) return null;
  const start = msg.indexOf("{", idx);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < msg.length; i++) {
    const ch = msg[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const jsonText = msg.slice(start, i + 1);
        try {
          return JSON.parse(jsonText);
        } catch (e) {
          const cleaned = jsonText
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]");
          try {
            return JSON.parse(cleaned);
          } catch (_) {
            return null;
          }
        }
      }
    }
  }
  return null;
}

function computeSpeeds(pkmns: any[]) {
  // pkmns entries have stats.spe (already calculated by Showdown).
  // We'll also compute examples: Scarf (×1.5), Tailwind (×2), Paralysis (×0.5), +1 speed boost (×1.5).
  const rows: {
    name: string;
    spe?: number;
    speScarf?: number;
    speTailwind?: number;
    active?: boolean;
  }[] = [];
  for (const p of pkmns) {
    const name = parseNameFromDetails(p.details);
    const spe = p.stats?.spe ?? null;
    const speScarf = spe ? Math.floor(spe * 1.5) : undefined;
    const speTailwind = spe ? Math.floor(spe * 2) : undefined;
    rows.push({ name, spe, speScarf, speTailwind, active: !!p.active });
  }
  rows.sort((a, b) => (b.spe ?? -1) - (a.spe ?? -1));
  return rows;
}

export function initBattleSpeedVisualizer() {
  createContainer();
  const orig = (window as any).WebSocket;
  if (!orig) return;
  // patch constructor to attach our onmessage wrapper
  (window as any).WebSocket = function (url: string, protocols?: any) {
    const inst = protocols ? new orig(url, protocols) : new orig(url);
    setTimeout(() => {
      const prev = inst.onmessage;
      inst.onmessage = (ev: MessageEvent) => {
        try {
          const data = ev.data as string;
          const rq = extractRequestJSON(data);
          if (rq && rq.side && Array.isArray(rq.side.pokemon)) {
            const rows = computeSpeeds(rq.side.pokemon);
            renderSpeeds(rows);
          }
        } catch (_) {}
        if (typeof prev === "function") prev.call(inst, ev);
      };
    }, 10);
    return inst;
  } as any;
  (window as any).WebSocket.prototype = orig.prototype;
  (window as any).WebSocket.OPEN = orig.OPEN;
}
