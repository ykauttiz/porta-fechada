"use strict";
// Modelo para canais de texto comuns. A entrada descreve cargos e sobrescritas já resolvidas.
const VIEW = 1024n, SEND = 2048n, ADMIN = 8n;
function mask(value) {
  if (typeof value !== "string" || !/^\d{1,20}$/.test(value)) throw Error("Permissões devem ser inteiros decimais em texto.");
  return BigInt(value);
}
const dict = value => value !== null && typeof value === "object" && !Array.isArray(value);
const idOK = value => typeof value === "string" && value.trim().length > 0 && value.length <= 128;
function validateSnapshot(s, label) {
  if (!dict(s) || !dict(s.roles) || !dict(s.channels) || (s.owner !== undefined && !idOK(s.owner)))
    throw Error(label + ": configuração incompleta.");
  mask(s.everyone);
  for (const [id, raw] of Object.entries(s.roles)) {
    if (!idOK(id)) throw Error(label + ": ID de cargo inválido.");
    mask(raw);
  }
  for (const [id, room] of Object.entries(s.channels)) {
    if (!idOK(id) || !dict(room) || !Array.isArray(room.overwrites)) throw Error(label + ": canal inválido: " + id);
    const seen = new Set();
    for (const item of room.overwrites) {
      if (!dict(item) || !["everyone","role","member"].includes(item.type) ||
          (item.type !== "everyone" && !idOK(item.id)) ||
          (item.type === "role" && !Object.hasOwn(s.roles,item.id)))
        throw Error(label + " · " + id + ": alvo da sobrescrita inválido.");
      const key = JSON.stringify([item.type,item.type === "everyone" ? "" : item.id]);
      if (seen.has(key) || (mask(item.allow) & mask(item.deny)) !== 0n)
        throw Error(label + " · " + id + ": sobrescrita repetida ou contraditória.");
      seen.add(key);
    }
  }
}
function decision(snapshot, rule) {
  if (!snapshot || typeof snapshot !== "object" || !rule || typeof rule !== "object")
    throw Error("Informe a configuração e a regra como objetos.");
  if (!Array.isArray(rule.roles) || !rule.roles.every(k => typeof k === "string") ||
      typeof rule.member !== "string" || typeof rule.channel !== "string" ||
      !["view","send"].includes(rule.permission) || typeof rule.expect !== "boolean")
    throw Error("Regra inválida.");
  if (!idOK(rule.member) || !idOK(rule.channel) || !rule.roles.every(idOK) ||
      new Set(rule.roles).size !== rule.roles.length || (rule.name !== undefined && typeof rule.name !== "string"))
    throw Error("Identificadores inválidos na regra.");
  const room = Object.hasOwn(snapshot.channels, rule.channel) && snapshot.channels[rule.channel];
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
  const permitted = value => Boolean(value & VIEW) && (rule.permission === "view" || Boolean(value & SEND));
  let reason = "Permissões do servidor";
  if (elevated) {
    reason = rule.member === snapshot.owner ? "Dono do servidor" : "Administrador";
    return {allowed:true,reason,steps:[{stage:reason,allowed:true}]};
  }
  const steps = [{stage:reason,allowed:permitted(bits)}];
  const labels = ["Canal · todos", "Canal · cargos do membro", "Canal · membro"];
  for (const [index, group] of groups.entries()) {
    let allow = 0n, deny = 0n;
    for (const item of group) { allow |= item.allow; deny |= item.deny; }
    const next = (bits & ~deny) | allow;
    if (permitted(next) !== permitted(bits)) reason = labels[index];
    if (group.length) steps.push({stage:labels[index],allowed:permitted(next)});
    bits = next;
  }
  return {allowed:permitted(bits), reason, steps};
}
function access(snapshot, rule) {
  validateSnapshot(snapshot,"Configuração");
  return decision(snapshot, rule).allowed;
}
function compare(data) {
  if (!Array.isArray(data?.rules) || !data.rules.length) throw Error("Inclua pelo menos uma regra.");
  if (data.schemaVersion !== undefined && data.schemaVersion !== 1) throw Error("Versão de arquivo incompatível.");
  if (data.rules.length > 2000) throw Error("Use até 2 mil regras por comparação.");
  validateSnapshot(data.before,"Antes");
  validateSnapshot(data.after,"Depois");
  return data.rules.map(rule => {
    const previous = decision(data.before,rule), current = decision(data.after,rule);
    const before = previous.allowed, after = current.allowed;
    return {rule:rule.name || rule.channel,before,after,beforeReason:previous.reason,afterReason:current.reason,beforeSteps:previous.steps,afterSteps:current.steps,status:after === rule.expect ?
      (before === after ? "Passou" : "Corrigida") : (before === after ? "Falha existente" : "Regressão")};
  });
}
if (typeof module !== "undefined") module.exports = {compare,access};
