import { Logger } from "../logger";

export const ABILITY_EFFECTS: Record<
  string,
  (attackingType: string, multiplier: number) => number
> = {
  levitate: (attackingType, multiplier) =>
    attackingType === "ground" ? 0 : multiplier,
  flash_fire: (attackingType, multiplier) =>
    attackingType === "fire" ? 0 : multiplier,
  water_absorb: (attackingType, multiplier) =>
    attackingType === "water" ? 0 : multiplier,
  volt_absorb: (attackingType, multiplier) =>
    attackingType === "electric" ? 0 : multiplier,
  sap_sipper: (attackingType, multiplier) =>
    attackingType === "grass" ? 0 : multiplier,
  storm_drain: (attackingType, multiplier) =>
    attackingType === "water" ? 0 : multiplier,
  dry_skin: (attackingType, multiplier) =>
    attackingType === "water" ? 0 : multiplier,
  immunity: (attackingType, multiplier) =>
    attackingType === "poison" ? 0 : multiplier,
  wonder_guard: (attackingType, multiplier) =>
    multiplier > 1 ? multiplier : 0,
  thick_fat: (attackingType, multiplier) =>
    attackingType === "fire" || attackingType === "ice"
      ? multiplier * 0.5
      : multiplier,
  flame_body: (attackingType, multiplier) => multiplier,
  static: (attackingType, multiplier) => multiplier,
  "electric surge": (attackingType, multiplier) =>
    attackingType === "electric" ? multiplier * 1.5 : multiplier,
};

/*
 * Apply ability effects to the multiplier.
 */
export function applyAbilityMultiplier(
  ability: string | undefined,
  attackingType: string,
  baseMultiplier: number,
  tooltipContainer?: HTMLElement,
) {
  if (!ability && tooltipContainer) {
    const abilityElement = tooltipContainer.querySelector("p > small");
    ability = abilityElement?.nextSibling?.textContent?.trim() ?? "";
    if (ability) Logger.log("[Abilities] Detected Ability from HTML:", ability);
  }

  if (!ability) return baseMultiplier;

  const func = ABILITY_EFFECTS[ability.toLowerCase()];
  let result = baseMultiplier;
  if (func !== undefined) {
    result = func(attackingType, baseMultiplier);
    Logger.log(
      `[Abilities] Ability ${ability} applied on ${attackingType}: ${baseMultiplier} → ${result}`,
    );
  }

  return result;
}
