"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberWithCommas = numberWithCommas;
exports.formatDuration = formatDuration;
exports.sortByValueDescending = sortByValueDescending;
// Helper function to add commas to numbers (e.g., 1000 -> 1,000)
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// Helper function to format duration from seconds to hh:mm:ss
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
}
// Sort the keys of an object in descending order based on their values
function sortByValueDescending(obj) {
    return Object.keys(obj).sort((a, b) => obj[b] - obj[a]);
}
//# sourceMappingURL=utils.js.map