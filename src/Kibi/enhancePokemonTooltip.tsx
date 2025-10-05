import { render } from "nano-jsx";
import TooltipAdditions from "./components/tooltipAdditions";
import { Logger } from "./logger";
import { TypesGroupedByDamageMultiplier } from "./types";
import Pokedex from "pokedex-promise-v2";
import { TYPE_CHART } from "./components/typesChart";
import { applyAbilityMultiplier } from "./components/abilities";
import { applyItemMultiplier } from "./components/items";
import { initBattleSwitchRecommender } from "./components/switchRecommender";
import { initBattleSpeedVisualizer } from "./components/speedTierVisualizer";
import { initBattleDamagePredictor } from "./components/damagePredictor";

const PokeAPI = new Pokedex();

initBattleSwitchRecommender();
initBattleSpeedVisualizer();
initBattleDamagePredictor();

/*
 * Enhances a Pokemon Showdown tooltip with additional information.
 */
export default async function enhancePokemonTooltip(
  tooltipHTML: string,
  pokemon: Pokemon,
): Promise<string> {
  const tooltipContainer = document.createElement("div");
  tooltipContainer.innerHTML = tooltipHTML;

  const tooltipHeader = tooltipContainer.querySelector("h2");
  if (!tooltipHeader) {
    return tooltipHTML;
  }

  render(
    <TooltipAdditions
      damageRelations={await getTypesGroupedByDamageMultiplier(pokemon)}
      pokemon={pokemon}
    />,
  )
    .reverse()
    .map((element: HTMLElement) => {
      tooltipContainer.insertBefore(element, tooltipHeader.nextSibling);
    });
  const style = document.createElement("style");
  style.textContent = `
.tooltip, .tooltip-activepokemon { background-color: #444444 !important; color: #CCCCCC !important; }
.tooltip * { color: inherit !important; }
`;
  tooltipContainer.insertBefore(style, tooltipContainer.firstChild);

  return tooltipContainer.innerHTML;
}

/*
 * Calculates the total damage relations for the Pokemon.
 * @returns A map of each multiplier to the types affected.
 */
export async function getTypesGroupedByDamageMultiplier(
  pokemon: Pokemon,
): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>();
  const targetTypes = pokemon.getTypeList().map((t) => t.toLowerCase());

  const ability = (pokemon as any)?.ability as string | undefined;
  const item = (pokemon as any)?.item as string | undefined;

  Logger.log(
    `Types: ${targetTypes.join(", ")}, Ability: ${ability}, Item: ${item}`,
  );

  for (const attackingType of Object.keys(TYPE_CHART)) {
    let multiplier = 1;

    for (const targetType of targetTypes) {
      const typeEffectiveness = TYPE_CHART[attackingType][targetType] ?? 1;
      multiplier *= typeEffectiveness;
      Logger.log(
        `Attacking ${attackingType} vs ${targetType}: base ${typeEffectiveness}, cumulative multiplier: ${multiplier}`,
      );
    }

    const multiplierAfterAbility = applyAbilityMultiplier(
      ability,
      attackingType,
      multiplier,
    );
    if (multiplierAfterAbility !== multiplier) {
      Logger.log(
        `Ability ${ability} modified multiplier for ${attackingType}: ${multiplier} → ${multiplierAfterAbility}`,
      );
      multiplier = multiplierAfterAbility;
    }

    const multiplierAfterItem = applyItemMultiplier(
      item,
      attackingType,
      multiplier,
    );
    if (multiplierAfterItem !== multiplier) {
      Logger.log(
        `Item ${item} modified multiplier for ${attackingType}: ${multiplier} → ${multiplierAfterItem}`,
      );
      multiplier = multiplierAfterItem;
    }

    if (multiplier !== 1) {
      if (!result.has(multiplier)) result.set(multiplier, []);
      result.get(multiplier)!.push(attackingType);
    }
  }

  const sortedResult = new Map(
    [...result.entries()].sort((a, b) => b[0] - a[0]),
  );
  Logger.log("Sorted damage relations:", sortedResult);
  return sortedResult;
}
