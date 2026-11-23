"use strict";
// Hash the UTF-8 bytes of the same compact JSON representation in both clients.
const Reports = (() => {
  function csvCell(value) {
    let text = String(value);
    // Evita fórmulas de planilha com espaços invisíveis/Unicode sem converter números negativos em texto.
    const unsafe = /^[\x00-\x20\x7f\u00a0\u2000-\u200f\u2028\u2029\u2060\ufeff]*[=+@\-＝＋－＠\u2212]/u.test(text) ||
      /^[\t\r\n\0]/u.test(text);
    if (unsafe && !/^-?\d+(?:[,.]\d+)?$/.test(text)) text = "'" + text;
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
