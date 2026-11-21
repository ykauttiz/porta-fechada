"use strict";
const fs = require("node:fs");
const {compare} = require("./core");

function main(args) {
  const paths = args.filter(arg => !["--json","--csv"].includes(arg));
  if (paths.length !== 1 || (args.includes("--csv") && args.includes("--json"))) throw Error("Uso: node check.js arquivo.json [--json | --csv]");
  if (fs.statSync(paths[0]).size > 2 * 1024 * 1024) throw Error("Use um arquivo de até 2 MiB.");
  const source = fs.readFileSync(paths[0], "utf8").replace(/^\uFEFF/, "");
  const config = JSON.parse(source);
  const results = compare(config);
  if (args.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else if (args.includes("--csv")) {
    const hash = require("node:crypto").createHash("sha256").update(JSON.stringify(config)).digest("hex");
    console.log(require("./report").csv(config, results, hash));
  }
  else for (const result of results) console.log(result.status + " · " + result.rule);
  return results.some(r => ["Regressão","Falha existente"].includes(r.status)) ? 1 : 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
