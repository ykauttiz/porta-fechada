"use strict";
// Hash the UTF-8 bytes of the same compact JSON representation in both clients.
const Reports = (() => {
  function csvCell(value) {
    let text = String(value);
    if (/^[\t\r\n\0]|^\s*[=+@\uFF1D\uFF0B\uFF0D\uFF20-]/u.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }
  function csv(config, results, hash) {
    const header = ["Regra","Canal","Membro","Cargos (JSON)","Operação","Esperado","Antes","Depois","Resultado","Etapa antes","Etapa depois","SHA-256 da configuração"];
    const answer = value => value ? "Permitido" : "Negado";
    const records = results.map((row, i) => {
      const rule = config.rules[i];
      return [row.rule,rule.channel,rule.member,JSON.stringify(rule.roles),rule.permission,
        answer(rule.expect),answer(row.before),answer(row.after),row.status,row.beforeReason,row.afterReason,hash];
    });
    return "\uFEFF" + [header,...records].map(r => r.map(csvCell).join(";")).join("\r\n");
  }
  return {csv,csvCell};
})();
if (typeof module !== "undefined") module.exports = Reports;
