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

export const TANKS = ["vis", "hoof", "hoov"];

export const TARGET_CHANNEL_ID = "1304931116989546526";
export const WEEKLY_SUMMARY_CHANNEL_ID = "1306746576529526885";

export const DMG_DONE_FILTER = `encounterid not in (1206) and target.name NOT IN ("Rageface", "Crystal Prison", "Spirit of the Flame","Dreadflame","Fragment of Rhyolith") OR  (target.name IN ("Riplimb") AND target.spec != "Blood" AND target.spec != "Guardian")`;

export const DEFAULT_FILTER =
  '(ability.name IN ("Lava Spew", "Fiery Tornado", "Firestorm", "Fiery Vortex", "Magma Flow", "Engulfing Flames", "Sulfuras Smash", "Lava Wave", "Scorched Ground", "Sulfuras", "Magma", "Lava", "Lava Jet", "Molten Barrage") AND ability.id NOT IN (99606,99605))  OR  (ability.name IN ("Blazing Claw", "Gushing Wound", "Arcing Slash", "Flame Torrent", "Flame Breath") AND target.spec != "Blood" AND target.spec != "Guardian" AND target.spec != "Feral")';

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

export const RAID_ROSTER = {
  "!Altecks": new Set(["Alteckzz", "Alteckz", "Alteckzx", "Altecksm", "Altecksmxz", "Altecksmx"]),
  "!Amar": new Set(["Amarw", "Amarzing", "Amarjr", "Amarzíng", "Amarchain", "Amarlock", "Amarjjr"]),
  "!Anfall": new Set(["Anfall", "Anfhalal", "Anfallicc", "Avfall", "Anfallafel", "Anfallrace", "Anfcatafall"]),
  "!Baktus": new Set(["Baktus", "Bakttus", "Baktuss", "Firetus", "Firettus"]),
  "!Barrekush": new Set(["Barrekush", "Barrekuush", "Barrehash", "Barrehush", "Barrebanan", "Barreblåbär"]),
  "!Cab": new Set([
    "Fakecabs",
    "Fakecabss",
    "Fakecab",
    "Fakercab",
    "Derpyhooves",
    "Cabhooves",
    "Nocab",
    "Cabshooves",
    "Cabbs",
    "Doitforcabs",
    "Cabi",
    "Zarzer",
    "Cab",
  ]),
  "!Coach": new Set(["Coachpriestb", "Coachpriesta", "Coachpriest", "Coachshamb", "Coachshamc", "Coachshama"]),
  "!Dannyp": new Set(["Dannypmvp", "Dannypdk", "Dannypgrip", "Dannypqt", "Dannypxox", "Dannypp", "Phalek"]),
  "!Devil": new Set([
    "Devilmthree",
    "Devilmfour",
    "Devilm",
    "Devilp",
    "Devilpp",
    "Devilpthree",
    "Devilptwo",
    "Devilpfive",
    "Devilpsix",
    "Devilpriest",
    "Devilprtwo",
    "Lavabolt",
    "Devilsham",
    "Devilwlwl",
    "Devilwthree",
    "Devilw",
  ]),
  "!Dogcarrier": new Set([
    "Dogcarierdk",
    "Dogcarrierdk",
    "Dogcarier",
    "Dogcarierr",
    "Dogcarierrp",
    "Dogcarrier",
    "Dogcarrierss",
    "Dogcarriers",
  ]),
  "!Exander": new Set([
    "Exandero",
    "Exandri",
    "Exandra",
    "Exandera",
    "Exandura",
    "Exmeralda",
    "Exendri",
    "Exanderx",
    "Exanderr",
    "Exandria",
    "Exandro",
    "Exandrova",
  ]),
  "!Fjeenzy": new Set(["Fjeenzybow", "Fjeenzyxbow", "Fjeenzybowow", "Fjeenzyp", "Fjeenzyr", "Fjeenzy"]),
  "!Flare": new Set([
    "Flaredruid",
    "Flaresolaire",
    "Flaredru",
    "Flaremvp",
    "Flarepala",
    "Filthycrank",
    "Flarebro",
    "Flareofc",
    "Flarebtw",
    "Flaresham",
    "Flareqq",
  ]),
  "!Frooma": new Set(["Qrepth", "Qwypth", "Qspth", "Qwepth", "Froomas", "Froomash"]),
  "!Funkycut": new Set(["Funkydecay", "Funghidk", "Funkydekay", "Funkycut", "Funkykut", "Funkycutx"]),
  "!Gnomeboy": new Set(["Bendkone", "Bendkthree", "Bendktwo", "Bengun", "Benm", "Benmthree", "Benmtwo", "Gnomeboy"]),
  "!Goesting": new Set(["Goestingptwo", "Goestingptre", "Goestingp", "Goestingpfor"]),
  "!Hadoogin": new Set(["Hadoochadx", "Doogivoltage", "Hadooginahh", "Hadootheed", "Ppcdoogin", "Hadootheedxx"]),
  "!Holypalaswe": new Set([
    "Holypalaswe",
    "Holypalaswew",
    "Holypalaswex",
    "Holypalaswev",
    "Holypalasweu",
    "Holypalaswet",
    "Hadooginh",
  ]),
  "!Itsmarcowl": new Set(["Marcofotmxo", "Marcothree", "Marcofotmx", "Itsmarcowl", "Itsmarcofotm"]),
  "!Julius": new Set(["Juliusxp", "Juliusp", "Juliusw", "Juliuswxd", "Juliuswx"]),
  "!Jyssi": new Set(["Jyssi", "Jyssid", "Jyssic"]),
  "!Kia": new Set([
    "Kia",
    "Kiakia",
    "Kiakiakia",
    "Kiapriest",
    "Kiapriestqtp",
    "Kiapriestqt",
    "Progress",
    "Kiasham",
    "Kiashamtwo",
  ]),
  "!Killakin": new Set([
    "Killadeekay",
    "Killaswe",
    "Killadruid",
    "Killamáge",
    "Killamage",
    "Killamagé",
    "Killapala",
    "Killapaladin",
    "Killapriést",
    "Killakin",
    "Killademon",
    "Killawarlock",
    "Killalock",
    "Killadots",
  ]),
  "!Kroghelf": new Set(["Kroghelf", "Kroogghelf", "Krooghelf", "Kroghsnipes", "Krogghers", "Kroghp", "Kroghsp"]),
  "!Lexolas": new Set(["Lexddk", "Lexdkz", "Lexdkx"]),
  "!Lyn": new Set(["Lyndk", "Lyndktwo", "Lynwiz", "Lynrogue", "Lynrr", "Lynroguew", "Lyenw"]),
  "!Makki": new Set(["Makkís", "Makkisthree", "Makkistwo", "Makkìsfour", "Makkisfive", "Makkiz", "Makkiwl"]),
  "!Memento": new Set(["Secondmoon", "Mementoo", "Mementoomori"]),
  "!Occbull": new Set([
    "Occdk",
    "Occdkx",
    "Occdkxy",
    "Occdruid",
    "Occdruidx",
    "Occdruidxy",
    "Occmage",
    "Coccbustion",
    "Occmagex",
  ]),
  "!Peem": new Set([
    "Peemh",
    "Peemeep",
    "Peemm",
    "Peemten",
    "Tintilinic",
    "Glupii",
    "Realpeem",
    "Peemreal",
    "Peempek",
    "Peemforreal",
  ]),
  "!Piggly": new Set(["Mvpig", "Pigowl", "Pigowls", "Pigowly", "Espiggly", "Pigmagen", "Pigmage"]),
  "!Prospects": new Set(["Prosmage", "Prospekt", "Prospects", "Prossham"]),
  "!Rikkin": new Set([
    "Rikkindk",
    "Rikkind",
    "Rikkinh",
    "Rikkinmage",
    "Rikkinmagus",
    "Rikkiin",
    "Rykken",
    "Rikkinpriest",
    "Rikkin",
    "Rikkinsham",
    "Rikkinw",
    "Rikkinwthree",
  ]),
  "!Scarpa": new Set([
    "Scarpazug",
    "Scarpadk",
    "Scarpadkfir",
    "Scarpadktre",
    "Scarpadktwo",
    "Scarpafurrie",
    "Brofísh",
    "Vendkala",
    "Brudifisch",
    "Velikala",
    "Scarpabolt",
  ]),
  "!Soma": new Set(["Somashuto", "Somaasashin", "Somactre", "Somaclone", "Somactwo"]),
  "!Staedt": new Set(["Staedt", "Staedqtp", "Staedi", "Staedth"]),
  "!Thalash": new Set(["Thalashdk", "Thalash", "Thalashzug", "Thalashx", "Thalashidiot", "Thalashglorp"]),
  "!Uriosdruid": new Set(["Uriosdruid", "Uriossham"]),
  "!Visp": new Set(["Visb", "Visv", "Flutegirlx", "Visps", "Visr", "Visg", "Vispdeeznuts"]),
  "!Yarwi": new Set(["Yarwidruid", "Yarwi", "Yarwitwo", "Yarwipriest"]),
  "!Yebb": new Set(["Jebenched", "Jebemtisalv", "Yebber", "Yebb", "Jeboosted"]),
};
