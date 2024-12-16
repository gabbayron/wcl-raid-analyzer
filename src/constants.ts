export const classIcons: { [key: string]: string } = {
  Warrior: "🛡️",
  Paladin: "⚔️",
  Hunter: "🏹",
  Rogue: "🗡️",
  Priest: "🙏",
  DeathKnight: "💀",
  Shaman: "🌩️",
  Mage: "🧙",
  Warlock: "🔥",
  Druid: "🐻",
};

export enum EXPANSIONS {
  CATA = "cata",
  FRESH = "fresh",
}

export const CLASS_COLORS: { [key: string]: string } = {
  Warrior: "#C69B6D",
  Paladin: "#F48CBA",
  Hunter: "#AAD372",
  Rogue: "#FFF468",
  Priest: "#FFFFFF",
  DeathKnight: "#C41E3A",
  Shaman: "#0070DD",
  Mage: "#3FC7EB",
  Warlock: "#8788EE",
  Druid: "#FF7C0A",
};

export const DAMAGE_SCHOOL = {
  1: "Physical",
  2: "Holy",
  4: "Fire",
  8: "Nature",
  16: "Frost",
  32: "Shadow",
  64: "Arcane",
};

export const DAMAGE_SCHOOL_COLORS: { [key: string]: string } = {
  1: "brown",
  2: "pink",
  4: "red",
  8: "green",
  16: "blue",
  32: "purple",
  64: "white",
};

export const TOP_DPS_CHART_TITLE = "Top Damage Done";
export const TOP_DPS_CHART_DESCRIPTION = "Top DPS Chart";
export const TOP_DMG_TAKEN_CHART_TITLE = "Top Damage Taken";
export const TOP_DMG_TAKEN_CHART_DESCRIPTION = "Top Damage Taken Chart";
export const TOP_DMG_TAKEN_BY_ABILITY_CHART_TITLE = "Top Damage Taken By Ability";
export const EFFECTIVE_SUNDERS_CHART_TITLE = "Effective Sunders";

export const TANKS = ["vis", "hoof", "hoov"];

export const TARGET_CHANNEL_ID = "1304931116989546526";
export const WEEKLY_SUMMARY_CHANNEL_ID = "1306746576529526885";
export const GEAR_CHECK_CHANNEL_ID = "1317895351247573072";

export const DMG_DONE_FILTER = `encounterid not in (1206) and target.name NOT IN ("Rageface", "Crystal Prison", "Spirit of the Flame","Dreadflame","Fragment of Rhyolith") OR  (target.name IN ("Riplimb") AND target.spec != "Blood" AND target.spec != "Guardian")`;

export const CATA_DMG_TAKEN_FILTER =
  '(ability.name IN ("Lava Spew", "Earthquake", "Reckless Leap", "Molten Eruption", "Fiery Tornado", "Firestorm", "Fiery Vortex", "Magma Flow", "Engulfing Flames", "Sulfuras Smash", "Lava Wave", "Scorched Ground", "Sulfuras", "Magma", "Lava Jet", "Molten Barrage") AND ability.id NOT IN (99606,99605)) OR (ability.name IN ("Blazing Claw", "Gushing Wound", "Arcing Slash", "Flame Torrent", "Flame Breath") AND target.spec != "Blood" AND target.spec != "Guardian" AND target.spec != "Feral") OR (ability.id IN (98598) AND target.spec != "Blood" AND target.spec != "Guardian" AND target.spec != "Feral" AND target.spec != "Arms" AND target.spec != "Combat")';

export const FRESH_DMG_TAKEN_FILTER = `(ability.id IN (12100, 20605, 19450, 19411, 19717, 19497, 19695)) OR (ability.id IN (20603, 11669) AND target.class IN ("Priest", "Mage", "Druid", "Warlock", "Hunter"))`;

export const EFFECTIVE_SUNDERS_FILTER = `ability.name IN ("Sunder Armor") AND NOT IN RANGE FROM type="applydebuffstack" AND ability.id=11597 AND stack=5 TO type="removedebuff" AND ability.id=11597 GROUP BY target ON target END AND NOT IN RANGE FROM type="applydebuff" AND ability.id=11198 TO type="removedebuff" AND ability.id=11198 GROUP BY target ON target END AND target.id!=16441`;

export const DMG_TAKEN_FILTER_TO_EXPANSION = {
  [EXPANSIONS.CATA]: CATA_DMG_TAKEN_FILTER,
  [EXPANSIONS.FRESH]: FRESH_DMG_TAKEN_FILTER,
};

export const WIPES_CUT_OFF = 6;

export interface Fight {
  id: number;
  name: string;
  kill: boolean;
  endTime: number;
  startTime: number;
}

export type UserState = {
  step: number;
  logId?: string;
  dmgTakenFilterExpression?: string;
};

export type RaidSummary = {
  raidSummary: string;
  fightsList: string;
};

export type DamageEntry = {
  name: string;
  type: string;
  total: number;
};

export type DeathEntry = {
  targetID: number;
};

export type PlayerMap = { [targetID: number]: string };

export const ITEM_SLOTS: { [key: number]: string } = {
  0: "head",
  1: "neck",
  2: "shoulder",
  3: "shirt",
  4: "chest",
  5: "belt",
  6: "legs",
  7: "feet",
  8: "wrist",
  9: "gloves",
  10: "finger 1",
  11: "finger 2",
  12: "trinket 1",
  13: "trinket 2",
  14: "back",
  15: "main hand",
  16: "off hand",
  17: "ranged",
  18: "tabard",
};

export const ITEM_SLOTS_TO_CHECK = [15, 16];

export interface PlayerDetails {
  name: string;
  id: number;
  guid: number;
  type: string;
  icon: string;
  itemLevel: number;
  total: number;
  activeTime: number;
  activeTimeReduced: number;
  abilities: {
    name: string;
    total: number;
    type: number;
  }[];
  damageAbilities: {
    name: string;
    total: number;
    type: number;
  }[];
  targets: {
    name: string;
    total: number;
    type: string;
  }[];
  talents: {
    name: string;
    guid: number;
    type: number;
    abilityIcon: string;
  }[];
  gear: {
    id: number;
    slot: number;
    quality: number;
    icon: string;
    name: string;
    itemLevel: number;
    permanentEnchant?: number;
    permanentEnchantName?: string;
    temporaryEnchant?: string;
    temporaryEnchantName?: string;
    setID?: number;
  }[];
}
