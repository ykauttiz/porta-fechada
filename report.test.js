const test = require("node:test");
const assert = require("node:assert/strict");
const {csvCell} = require("./report");

test("CSV neutraliza fórmulas ASCII, controles e variantes Unicode", () => {
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("\tSOMA(A1:A2)"), '"\'\tSOMA(A1:A2)"');
  assert.equal(csvCell("＠membro"), '"\'＠membro"');
  assert.equal(csvCell('cargo"teste'), '"cargo""teste"');
});


test("CSV impede fórmulas precedidas por Unicode sem alterar números negativos",()=>{
  for(const value of ["\u200b=1+1","\ufeff+SUM(1)","\u2060@CMD","-HYPERLINK(1)","\u2212SUM(1)"])
    assert.ok(csvCell(value).startsWith('"\''),value);
  assert.equal(csvCell("-12,34"),'"-12,34"');
  assert.equal(csvCell("-15.27"),'"-15.27"');
});
