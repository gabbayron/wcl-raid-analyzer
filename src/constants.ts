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

export const TANKS = ["vis", "hoof", "hoov"];

export const TARGET_CHANNEL_ID = "1304931116989546526";
export const WEEKLY_SUMMARY_CHANNEL_ID = "1306746576529526885";

export const DMG_DONE_FILTER = `encounterid not in (1206) and target.name NOT IN ("Rageface", "Crystal Prison", "Spirit of the Flame","Dreadflame") OR  (target.name IN ("Riplimb") AND target.spec != "Blood" AND target.spec != "Guardian")`;

export const DEFAULT_FILTER =
  '(ability.id IN (99336, 98885, 99427, 99816, 99605, 99794, 97234, 99842, 998426, 99224, 98708, 98928, 98870, 100941, 98498, 99287, 100455, 99144, 97151, 99510, 99552, 100070))  OR  (ability.id IN (99844, 99308, 100024, 99931, 100794, 99758) AND target.spec != "Blood" AND target.spec != "Guardian")';

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
  "!Altecks": new Set(["Alteckzz", "Alteckz", "Alteckzx", "Altecksm", "Altecksmx", "Altecksmxz"]),
  "!Amar": new Set(["Amarw", "Amarzing", "Amarjr", "Amarzíng", "Amarchain", "Amarlock"]),
  "!Anfall": new Set(["Anfall", "Anfhalal", "Anfallicc", "Avfall", "Anfallafel", "Anfallrace"]),
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
    "Flareofc",
    "Flarebtw",
    "Flarebro",
    "Flaresham",
    "Flareqq",
  ]),
  "!Frooma": new Set(["Qrepth", "Qwypth", "Qspth", "Qwepth"]),
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
  "!Lyn": new Set(["Lyndk", "Lyndktwo", "Lynrogue", "Lynrr", "Lynroguew", "Lyenw"]),
  "!Makki": new Set(["Makkís", "Makkisthree", "Makkistwo", "Makkiz", "Makkiwl"]),
  "!Memento": new Set(["Secondmoon", "Mementoo", "Mementoomori"]),
  "!Occbull": new Set(["Occdk", "Occdkx", "Occdkxy", "Occdruid", "Occdruidx", "Occdruidxy", "Occmage", "Occmagex"]),
  "!Peem": new Set([
    "Peemh",
    "Peemeep",
    "Peemten",
    "Peemm",
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
    "Scarpadk",
    "Scarpadkfir",
    "Scarpadktwo",
    "Scarpazug",
    "Scarpdktre",
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
  "!Yarwi": new Set(["Yarwidruid", "Yarwi", "Yarwitwo"]),
  "!Yebb": new Set(["Jebenched", "Jebemtisalv", "Yebber", "Yebb"]),
};
