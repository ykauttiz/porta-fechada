"use strict";
const fs = require("node:fs");
const {compare} = require("./core");

function main(args) {
  const paths = args.filter(arg => arg !== "--json");
  if (paths.length !== 1) throw Error("Uso: node check.js arquivo.json [--json]");
  const source = fs.readFileSync(paths[0], "utf8").replace(/^\uFEFF/, "");
  const results = compare(JSON.parse(source));
  if (args.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else for (const result of results) console.log(result.status + " · " + result.rule);
  return results.some(r => ["Regressão","Falha existente"].includes(r.status)) ? 1 : 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
