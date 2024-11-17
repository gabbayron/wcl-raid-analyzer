"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FILTER = exports.TARGET_CHANNEL_ID = exports.TANKS = exports.classIcons = void 0;
exports.classIcons = {
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
exports.TANKS = ["vis", "hoof", "hoov"];
exports.TARGET_CHANNEL_ID = "1304931116989546526";
exports.DEFAULT_FILTER = '(ability.id IN (99336, 98885, 99427, 99816, 99605, 99794, 97234, 99842, 998426, 99224, 98708, 98928, 98870, 100941, 98498, 99287, 100455, 99144, 97151, 99510, 99552, 100070))  OR  (ability.id IN (99844, 99308, 100024, 99931, 100794, 99758) AND target.spec != "Blood" AND target.spec != "Guardian")';
//# sourceMappingURL=constants.js.map