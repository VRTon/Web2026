// Run the actual page script with schedule rows in UTC, including Chile's DST.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

process.env.TZ = "UTC";
for (const language of ["es", "en"]) {
  const cases = [
    ["2026-11-06T15:00:00", "2026-11-06T16:00:00", "true", "18:00–19:00"],
    ["2026-09-05T23:30:00", "2026-09-06T01:30:00", "true", "03:30–04:30"],
    ["2026-04-05T00:30:00", "2026-04-05T01:30:00", "false", "04:30"],
    ["invalid", "2026-11-06T16:00:00", "true", "unchanged"]
  ];
  const rows = cases.map(([startAt, endAt, showEnd]) => ({
    dataset: { startAt, endAt, showEnd }, textContent: "unchanged"
  }));
  const root = { dataset: {} };
  const body = { dataset: { language } };
  const grid = { dataset: { officialTimezone: "America/Santiago" } };
  let formatters = 0;
  const document = {
    documentElement: root, body,
    getElementById: () => null,
    querySelector: selector => selector === "[data-schedule-grid]" ? grid : null,
    querySelectorAll: selector => selector === "[data-schedule-time]" ? rows : []
  };
  vm.runInNewContext(fs.readFileSync("script.js", "utf8"), {
    document, window: { location: { pathname: "/schedule/" } },
    Intl: { DateTimeFormat: function (...args) {
      formatters++;
      return new Intl.DateTimeFormat(...args);
    } }
  });
  assert.deepEqual(rows.map(row => row.textContent), cases.map(item => item[3]));
  assert.equal(formatters, 2, "Formatters must be reused across rows");
}
console.log("Schedule: ES/EN, daylight saving, hidden end times and invalid dates passed");
