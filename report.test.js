const test = require("node:test");
const assert = require("node:assert/strict");
const {csvCell} = require("./report");

test("CSV neutraliza fórmulas ASCII, controles e variantes Unicode", () => {
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("\tSOMA(A1:A2)"), '"\'\tSOMA(A1:A2)"');
  assert.equal(csvCell("＠membro"), '"\'＠membro"');
  assert.equal(csvCell('cargo"teste'), '"cargo""teste"');
});
