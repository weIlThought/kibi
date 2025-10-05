// damagePredictor.ts
// Damage Predictor (approximate) for Pokemon Showdown moves based on |request| blocks.
// Usage: import { initBattleDamagePredictor } and call it once. Will show an overlay with move damage ranges.

type MoveMeta = {
  type: string;
  power: number;
  category: "physical" | "special" | "status";
};

const MOVE_META: Record<string, MoveMeta> = {
  thunderwave: { type: "electric", power: 0, category: "status" },
  blizzard: { type: "ice", power: 110, category: "special" },
  hyperbeam: { type: "normal", power: 150, category: "physical" },
  thunderbolt: { type: "electric", power: 90, category: "special" },
  bodyslam: { type: "normal", power: 85, category: "physical" },
  rockslide: { type: "rock", power: 75, category: "physical" },
  submission: { type: "fighting", power: 80, category: "physical" },
  earthquake: { type: "ground", power: 100, category: "physical" },
  doublekick: { type: "fighting", power: 30, category: "physical" },
  surf: { type: "water", power: 90, category: "special" },
  agility: { type: "psychic", power: 0, category: "status" },
  recover: { type: "normal", power: 0, category: "status" },
  psychic: { type: "psychic", power: 90, category: "special" },
  seismictoss: { type: "fighting", power: 100, category: "physical" },
  transform: { type: "normal", power: 0, category: "status" },
  smokescreen: { type: "normal", power: 0, category: "status" },
};

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 0.5,
    ghost: 0,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  fire: {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 1,
    grass: 2,
    ice: 2,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 2,
    rock: 0.5,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 2,
    fairy: 1,
  },
  water: {
    normal: 1,
    fire: 2,
    water: 0.5,
    electric: 1,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 2,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 2,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 1,
    fairy: 1,
  },
  electric: {
    normal: 1,
    fire: 1,
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 0,
    flying: 2,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 1,
    fairy: 1,
  },
  grass: {
    normal: 1,
    fire: 0.5,
    water: 2,
    electric: 1,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    psychic: 1,
    bug: 0.5,
    rock: 2,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  ice: {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 1,
    grass: 2,
    ice: 0.5,
    fighting: 1,
    poison: 1,
    ground: 2,
    flying: 2,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 2,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  fighting: {
    normal: 2,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 2,
    fighting: 1,
    poison: 0.5,
    ground: 1,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dragon: 1,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 2,
    ice: 1,
    fighting: 1,
    poison: 0.5,
    ground: 0.5,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 0.5,
    ghost: 0.5,
    dragon: 1,
    dark: 1,
    steel: 0,
    fairy: 2,
  },
  ground: {
    normal: 1,
    fire: 2,
    water: 1,
    electric: 2,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 2,
    ground: 1,
    flying: 0,
    psychic: 1,
    bug: 0.5,
    rock: 2,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 2,
    fairy: 1,
  },
  flying: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 0.5,
    grass: 2,
    ice: 1,
    fighting: 2,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 2,
    rock: 0.5,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  psychic: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 2,
    poison: 2,
    ground: 1,
    flying: 1,
    psychic: 0.5,
    bug: 1,
    rock: 1,
    ghost: 2,
    dragon: 1,
    dark: 0,
    steel: 0.5,
    fairy: 1,
  },
  bug: {
    normal: 1,
    fire: 0.5,
    water: 1,
    electric: 1,
    grass: 2,
    ice: 1,
    fighting: 0.5,
    poison: 0.5,
    ground: 1,
    flying: 0.5,
    psychic: 2,
    bug: 1,
    rock: 1,
    ghost: 0.5,
    dragon: 1,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    normal: 1,
    fire: 2,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 2,
    fighting: 0.5,
    poison: 1,
    ground: 0.5,
    flying: 2,
    psychic: 1,
    bug: 2,
    rock: 1,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  ghost: {
    normal: 0,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 2,
    bug: 1,
    rock: 1,
    ghost: 2,
    dragon: 1,
    dark: 0.5,
    steel: 1,
    fairy: 1,
  },
  dragon: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 2,
    dark: 1,
    steel: 0.5,
    fairy: 0,
  },
  dark: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 0.5,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 2,
    bug: 1,
    rock: 1,
    ghost: 2,
    dragon: 1,
    dark: 0.5,
    steel: 1,
    fairy: 0.5,
  },
  steel: {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    grass: 1,
    ice: 2,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 2,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    normal: 1,
    fire: 0.5,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 2,
    poison: 0.5,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 2,
    dark: 2,
    steel: 0.5,
    fairy: 1,
  },
};

function createOverlay(): HTMLElement {
  let root = document.getElementById("kibi-damage-overlay");
  if (root) return root;
  root = document.createElement("div");
  root.id = "kibi-damage-overlay";
  Object.assign(root.style, {
    position: "fixed",
    right: "12px",
    bottom: "12px",
    zIndex: "99999",
    background: "rgba(10,10,10,0.7)",
    color: "white",
    padding: "8px",
    borderRadius: "8px",
    fontSize: "13px",
    maxWidth: "380px",
    fontFamily: "Inter, system-ui, sans-serif",
  });
  document.body.appendChild(root);
  return root;
}

function renderDamage(
  activeName: string,
  moves: { id: string; type?: string }[],
  table: any[],
) {
  const root = createOverlay();
  root.innerHTML = `<strong>Damage Predictor — ${activeName}</strong><div style="height:6px"></div>`;
  for (const row of table) {
    const el = document.createElement("div");
    el.style.marginBottom = "6px";
    el.innerHTML = `<div style="display:flex;justify-content:space-between">
      <div style="font-weight:600">${row.move} ${row.category === "status" ? "⚑" : ""}</div>
      <div style="opacity:.95">${row.min}-${row.max}${row.maxPercent ? ` (${row.maxPercent}%)` : ""}</div>
    </div>
    <div style="color:#ddd;font-size:12px">type:${row.type} • stab:${row.stab} • mult:${row.typeMult}</div>`;
    root.appendChild(el);
  }
}

function getEffectiveness(att: string, targetTypes: string[]) {
  const atk = att.toLowerCase();
  let mult = 1;
  for (const t of targetTypes) {
    mult *= TYPE_CHART[atk]?.[t.toLowerCase()] ?? 1;
  }
  return mult;
}

function parseNameFromDetails(details?: string) {
  if (!details) return "";
  return details.split(",")[0].trim();
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

export function initBattleDamagePredictor() {
  createOverlay();
  const orig = (window as any).WebSocket;
  if (!orig) return;
  (window as any).WebSocket = function (url: string, protocols?: any) {
    const inst = protocols ? new orig(url, protocols) : new orig(url);
    setTimeout(() => {
      const prev = inst.onmessage;
      inst.onmessage = (ev: MessageEvent) => {
        try {
          const data = ev.data as string;
          const rq = extractRequestJSON(data);
          if (rq && rq.side && Array.isArray(rq.side.pokemon)) {
            // find our active pokemon (side.active may also be present)
            const team = rq.side.pokemon as any[];
            const active = team.find((p) => p.active) ?? team[0];
            const activeName = parseNameFromDetails(active.details);
            const moves = active.moves ?? [];
            // attempt to find opponent stats in the same request or fallback to unknown
            // For approximate calculation, use a generic opponent type set from guessed opponent name if available
            let opponentTypes: string[] = ["normal"];
            // Try reading last seen |switch| lines from global document (best-effort)
            // But here we will try to infer from other requests or simply default: normal.
            // Compute damage per move
            const table = moves.map((mId: string) => {
              const meta = MOVE_META[mId] ?? {
                type: "normal",
                power: 0,
                category: "status",
              };
              if (meta.power === 0) {
                return {
                  move: mId,
                  type: meta.type,
                  category: meta.category,
                  min: "-",
                  max: "-",
                  stab: "-",
                  typeMult: "-",
                };
              }
              // attacker stats from active.stats
              const atk =
                meta.category === "special"
                  ? (active.stats?.spa ?? 100)
                  : (active.stats?.atk ?? 100);
              const def = meta.category === "special" ? 100 : 100; // unknown opponent def: use 100 baseline
              const base =
                (22 * meta.power * (atk / Math.max(def, 1))) / 50 + 2;
              // STAB: check if active's types include move type (we need a TYPE_DB - for speed keep fallback to false)
              const TYPE_DB: Record<string, string[]> = {
                Dragonair: ["dragon"],
                Kadabra: ["psychic"],
                Horsea: ["water"],
                Ditto: ["normal"],
                Machop: ["fighting"],
                "Nidoran-M": ["poison"],
                Sandshrew: ["ground"],
                Porygon: ["normal"],
              };
              const atkTypes = TYPE_DB[activeName] ?? ["normal"];
              const stab = atkTypes.includes(meta.type) ? 1.5 : 1.0;
              const typeMult = getEffectiveness(meta.type, opponentTypes);
              const min = Math.floor(base * stab * typeMult * 0.85);
              const max = Math.floor(base * stab * typeMult * 1.0);
              // if opponent HP known in active's "opponentStats" we could compute %; here we skip
              return {
                move: mId,
                type: meta.type,
                category: meta.category,
                min,
                max,
                stab,
                typeMult,
              };
            });
            renderDamage(
              parseNameFromDetails(active.details),
              moves.map((m: string) => ({ id: m })),
              table,
            );
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
