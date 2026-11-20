const test = require("node:test");
const assert = require("node:assert/strict");
const {spawnSync} = require("node:child_process");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
test("CLI distingue sucesso, falha de política e entrada inválida", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),"porta-"));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file = path.join(dir,"rules.json");
  const run = () => spawnSync(process.execPath,[path.join(__dirname,"check.js"),file,"--json"],{encoding:"utf8"});
  assert.equal(run().status,2);
  const data = structuredClone(require("./exemplo.json"));
  fs.writeFileSync(file,JSON.stringify(data));
  const failure = run();
  assert.equal(failure.status,1);
  assert.equal(JSON.parse(failure.stdout)[0].status,"Regressão");
  data.after = data.before;
  fs.writeFileSync(file,JSON.stringify(data));
  assert.equal(run().status,0);
});
