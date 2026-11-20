"use strict";
// Modelo para canais de texto comuns. A entrada descreve cargos e sobrescritas já resolvidas.
const VIEW = 1024n, SEND = 2048n, ADMIN = 8n;
function mask(value) {
  if (typeof value !== "string" || !/^\d{1,20}$/.test(value)) throw Error("Permissões devem ser inteiros decimais em texto.");
  return BigInt(value);
}
function access(snapshot, rule) {
  if (!Array.isArray(rule.roles) || !rule.roles.every(k => typeof k === "string") ||
      typeof rule.member !== "string" || typeof rule.channel !== "string" ||
      !["view","send"].includes(rule.permission) || typeof rule.expect !== "boolean")
    throw Error("Regra inválida.");
  const room = snapshot.channels?.[rule.channel];
  if (!room || !Array.isArray(room.overwrites)) throw Error("Canal ausente ou inválido: " + rule.channel);
  let bits = mask(snapshot.everyone);
  for (const id of rule.roles) bits |= mask(snapshot.roles?.[id]);
  const elevated = rule.member === snapshot.owner || Boolean(bits & ADMIN);
  const groups = [[],[],[]];
  for (const item of room.overwrites) {
    if (!["everyone","role","member"].includes(item.type)) throw Error("Tipo de sobrescrita inválido.");
    const allow = mask(item.allow), deny = mask(item.deny);
    if (item.type === "everyone") groups[0].push({allow,deny});
    if (item.type === "role" && rule.roles.includes(item.id)) groups[1].push({allow,deny});
    if (item.type === "member" && item.id === rule.member) groups[2].push({allow,deny});
  }
  for (const group of groups) {
    let allow = 0n, deny = 0n;
    for (const item of group) { allow |= item.allow; deny |= item.deny; }
    bits = (bits & ~deny) | allow;
  }
  return elevated || (Boolean(bits & VIEW) && (rule.permission === "view" || Boolean(bits & SEND)));
}
function compare(data) {
  if (!Array.isArray(data.rules) || !data.rules.length) throw Error("Inclua pelo menos uma regra.");
  return data.rules.map(rule => {
    const before = access(data.before,rule), after = access(data.after,rule);
    return {rule:rule.name || rule.channel,before,after,status:after === rule.expect ?
      (before === after ? "Passou" : "Corrigida") : (before === after ? "Falha existente" : "Regressão")};
  });
}
if (typeof module !== "undefined") module.exports = {compare,access};
