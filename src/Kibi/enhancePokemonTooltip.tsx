import { render } from "nano-jsx";
import TooltipAdditions from "./components/tooltipAdditions";
import { Logger } from "./logger";
import { TypesGroupedByDamageMultiplier } from "./types";
import Pokedex from "pokedex-promise-v2";
import { TYPE_CHART } from "./components/typesChart";

const PokeAPI = new Pokedex();

/**
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

/**
 * Calculates the total damage relations for the Pokemon.
 * @returns A map of each multiplier to the types affected.
 */
export async function getTypesGroupedByDamageMultiplier(
  pokemon: Pokemon,
): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>();
  const targetTypes = pokemon.getTypeList().map(t => t.toLowerCase());
  for (const attackingType of Object.keys(TYPE_CHART)) {
    let multiplier = 1;
    for (const targetType of targetTypes) {
      const typeEffectiveness = TYPE_CHART[attackingType][targetType] ?? 1;
      multiplier *= typeEffectiveness;
    }
    if (multiplier !== 1) {
      if (!result.has(multiplier)) result.set(multiplier, []);
      result.get(multiplier)!.push(attackingType);
    }
  }
  return result;
}