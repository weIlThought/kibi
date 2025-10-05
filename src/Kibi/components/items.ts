import { Logger } from "../logger";

export const ITEM_EFFECTS: Record<
  string,
  (attackingType: string, multiplier: number) => number
> = {
  air_balloon: (attackingType, multiplier) =>
    attackingType === "ground" ? 0 : multiplier,
  safety_goggles: (attackingType, multiplier) =>
    attackingType === "grass" || attackingType === "powder" ? 0 : multiplier,
  ring_target: (attackingType, multiplier) => multiplier,
};

/**
 * Apply item effects to the multiplier.
 */
export function applyItemMultiplier(
  item: string | undefined,
  attackingType: string,
  baseMultiplier: number,
  tooltipContainer?: HTMLElement,
) {
  if (!item && tooltipContainer) {
    const itemElement = tooltipContainer.querySelector("p > small");
    item = itemElement?.nextSibling?.textContent?.trim() ?? "";
    if (item) Logger.log("[Items] Detected Item from HTML:", item);
  }

  if (!item) return baseMultiplier;

  const func = ITEM_EFFECTS[item.toLowerCase()];
  let result = baseMultiplier;

  if (func !== undefined) {
    result = func(attackingType, baseMultiplier);
    Logger.log(
      `[Items] Item ${item} applied on ${attackingType}: ${baseMultiplier} → ${result}`,
    );
  }

  return result;
}
