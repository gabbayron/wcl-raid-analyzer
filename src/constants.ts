export const classIcons: { [key: string]: string } = {
  Warrior: "⚔️",
  Paladin: "🧠",
  Hunter: "🏹",
  Rogue: "🗡️",
  Priest: "🙏",
  DeathKnight: "💀",
  Shaman: "🌩️",
  Mage: "🧙",
  Warlock: "🔥",
  Druid: "🐻",
  Monk: "🧘",
  DemonHunter: "🧘",
};

export enum EXPANSIONS {
  CATA = "cata",
  FRESH = "fresh",
  RETAIL = "retail",
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
  Monk: "#00ff98",
  DemonHunter: "#a330c9",
};

export const SUB_DOMAINS_TO_EXPANSION: { [key: string]: string } = {
  [EXPANSIONS.CATA]: "classic",
  [EXPANSIONS.FRESH]: "fresh",
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

export const POSSIBLE_ENCHANTS = [
  "+4 Strength",
  "+4 Spell Power",
  "+5 Haste",
  "+4 Spell Power",
  "+4 Intellect",
  "+48 Health",
  "+4 Agility",
];

export const WRIST_POSSIBLE_ENCHANT = ["+6 Strength", "+6 Stamina"];
export const CHEST_3_STATS = "+3 All Stats";

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
export const DEBUFFS_CHECK_CHANNEL_ID = "1318825066636775567";

const CATA_DMG_DONE_FILTER = `target.name != "Corrupted Blood"`;
const FRESH_DMG_FILTER_OLD = 'target.name != "Core Rager" AND target.name != "Majordomo Executus" ';
const FRESH_DMG_FILTER =
  'target.name not in ("Grethok the Controller", "Blackwing Guardsman", "Blackwing Mage", "Death Talon Dragonspawn", "Blackwing Legionnaire", "Black Drakonid", "Chromatic Drakonid", "Bronze Drakonid", "Blue Drakonid", "Green Drakonid")';
('(ability.name IN ("Lava Spew", "Earthquake", "Molten Eruption", "Fiery Tornado", "Firestorm", "Fiery Vortex", "Magma Flow", "Engulfing Flames", "Sulfuras Smash", "Lava Wave", "Scorched Ground", "Sulfuras", "Magma", "Lava Jet", "Molten Barrage") AND ability.id NOT IN (99606,99605,99907,97151)) OR (ability.name IN ("Blazing Claw", "Gushing Wound", "Arcing Slash", "Flame Torrent", "Flame Breath") AND target.spec != "Blood" AND target.spec != "Guardian" AND target.spec != "Feral") OR (ability.id IN (98598) AND target.spec != "Blood" AND target.spec != "Guardian" AND target.spec != "Feral" AND target.spec != "Arms" AND target.spec != "Combat")');

export const CATA_DMG_TAKEN_FILTER =
  'ability.name IN ("Ice Wave", "Icicle", "Blade Rush", "Shockwave", "Deck Fire") OR (ability.name IN ("Psychic Drain","Brutal Strike") AND target.spec != "Blood" AND target.spec != "Guardian" AND target.spec != "Feral" AND (target.class != "Paladin" AND target.spec != "Protection")) OR rawDamage>100000 and ability.name = "Searing Blood"';

export const FRESH_DMG_TAKEN_FILTER_OLD = `(ability.id IN (12100,19627,20569, 19628, 20605, 19450, 19411, 19717, 19695)) OR (ability.id IN (20603, 11669) AND target.class IN ("Priest", "Mage", "Druid", "Warlock", "Hunter"))`;
export const FRESH_DMG_TAKEN_FILTER = `ability.id IN (22311, 15754) AND target.spec != "Protection"`;

export const EFFECTIVE_SUNDERS_FILTER = `ability.name IN ("Sunder Armor") AND NOT IN RANGE FROM type="applydebuffstack" AND ability.id=11597 AND stack=5 TO type="removedebuff" AND ability.id=11597 GROUP BY target ON target END AND NOT IN RANGE FROM type="applydebuff" AND ability.id=11198 TO type="removedebuff" AND ability.id=11198 GROUP BY target ON target END AND target.id!=16441 AND target.name not in ("Flame Imp", "Core Hound", "Firesworn", "Core Rager")`;

export const FRESH_SELECTED_DEBUFFS = [
  "Curse of Recklessness",
  "Curse of the Elements",
  "Thunder Clap",
  "Winter's Chill",
  "Sunder Armor",
  "Faerie Fire",
  "Expose Armor",
  "Demoralizing Shout",
];

const CATA_POTIONS_USAGE = `ability.name IN ("Tol'vir Agility", "Golem's Strength", "Volcanic Power")`;
const FRESH_POTIONS_USAGE = `ability.name IN ("Mighty Rage")`;

export const CATA_GLOVES_USAGE = `ability.name IN ("Synapse Springs")`;

export const EXPLOSIVES_FILTER = "ability.id IN (82207, 89637, 56488, 56350)";

export const POTIONS_QUERY_BY_EXPANSION = {
  [EXPANSIONS.CATA]: CATA_POTIONS_USAGE,
  [EXPANSIONS.FRESH]: FRESH_POTIONS_USAGE,
  [EXPANSIONS.RETAIL]: "",
};

export const GLOVE_SPELL_IDS = [96228, 96229, 96230];

export const DMG_TAKEN_FILTER_TO_EXPANSION = {
  [EXPANSIONS.CATA]: CATA_DMG_TAKEN_FILTER,
  [EXPANSIONS.FRESH]: FRESH_DMG_TAKEN_FILTER,
  [EXPANSIONS.RETAIL]: "",
};

export const DMG_DONE_FILTER_TO_EXPANSION = {
  [EXPANSIONS.CATA]: CATA_DMG_DONE_FILTER,
  [EXPANSIONS.FRESH]: FRESH_DMG_FILTER,
  [EXPANSIONS.RETAIL]: "",
};

export const WIPES_CUT_OFF = 6;

export type BuffEvent = {
  timestamp: number;
  type: "applybuff" | "removebuff" | "applybuffstack";
  sourceID: number;
  targetID: number;
  abilityGameID: number;
  fight: number;
  pin: string;
  stack: number;
};
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

export const WEAPONS_SLOTS = [15, 16];
export const WEAPONS_SLOTS_STRING = [ITEM_SLOTS[15], ITEM_SLOTS[16]];
export const GENERAL_GEAR_SLOT_TO_CHECK = [0, 6, 4, 7, 8];
export const PHYSICAL_GEAR_SLOT_TO_CHECK = [14, 9];

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

export const RAID_ROLES = {
  Tanks: ["Blood", "Protection-Paladin", "Protection-Warrior", "Feral"],
  DPS: [
    "Unholy",
    "Frost-DK",
    "Blood DPS",
    "Balance",
    "Feral DPS",
    "Beast Master",
    "Marksman",
    "Survival",
    "Arcane",
    "Fire",
    "Frost-Mage",
    "Retribution",
    "Shadow",
    "Assassination",
    "Combat",
    "Subtlety",
    "Affliction",
    "Demonology",
    "Destruction",
    "Arms",
    "Fury",
    "Elemental",
    "Enhancement",
  ],
  Healers: ["Holy-Paladin", "Holy-Priest", "Restoration-Shaman", "Restoration-Druid", "Discipline", "Holy-Priest"],
};
