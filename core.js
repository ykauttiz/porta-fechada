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
function validateThreads(snapshot) {
  if (snapshot.threads === undefined) return;
  if (!dict(snapshot.threads)) throw Error("Lista de threads inválida.");
  for (const [id,thread] of Object.entries(snapshot.threads)) {
    if (!idOK(id) || Object.hasOwn(snapshot.channels,id) || !dict(thread) ||
        !idOK(thread.parent) || !Object.hasOwn(snapshot.channels,thread.parent) ||
        !["public","private"].includes(thread.type) || !Array.isArray(thread.members) ||
        !thread.members.every(idOK) || new Set(thread.members).size !== thread.members.length ||
        typeof thread.locked !== "boolean" || typeof thread.archived !== "boolean")
      throw Error("Thread inválida: " + id + ". Confira canal pai, tipo, membros e estado.");
  }
}
const MANAGE_THREADS = 1n << 34n;
const SEND_IN_THREADS = 1n << 38n;
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
  const thread = snapshot.threads && Object.hasOwn(snapshot.threads,rule.channel) ? snapshot.threads[rule.channel] : null;
  const parent = thread ? thread.parent : rule.channel;
  const room = Object.hasOwn(snapshot.channels,parent) && snapshot.channels[parent];
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
  const permitted = value => Boolean(value & VIEW) && (rule.permission === "view" || Boolean(value & (thread ? SEND_IN_THREADS : SEND)));
  let reason = "Permissões do servidor";
  if (elevated) {
    reason = rule.member === snapshot.owner ? "Dono do servidor" : "Administrador";
    const steps = [{stage:reason,allowed:true}];
    if (thread?.locked && thread.archived && rule.permission === "send") {
      reason = "Reabra a thread bloqueada antes de enviar";
      steps.push({stage:reason,allowed:false});
      return {allowed:false,reason,steps};
    }
    return {allowed:true,reason,steps};
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
  let allowed = permitted(bits);
  if (thread) {
    const manages = Boolean(bits & MANAGE_THREADS);
    const checks = [];
    if (thread.type === "private") checks.push(["Thread privada · convite ou moderação",manages || thread.members.includes(rule.member)]);
    if (rule.permission === "send" && thread.locked) {
      checks.push(["Thread bloqueada · moderação",manages]);
      if (thread.archived) checks.push(["Reabra a thread bloqueada antes de enviar",false]);
    }
    for (const [stage,passes] of checks) {
      if (allowed && !passes) reason = stage;
      allowed = allowed && passes;
      steps.push({stage,allowed});
    }
  }
  return {allowed, reason, steps};
}
function access(snapshot, rule) {
  validateSnapshot(snapshot,"Configuração");
  validateThreads(snapshot);
  return decision(snapshot, rule).allowed;
}
function compare(data) {
  if (!Array.isArray(data?.rules) || !data.rules.length) throw Error("Inclua pelo menos uma regra.");
  if (data.schemaVersion !== undefined && ![1,2].includes(data.schemaVersion)) throw Error("Versão de arquivo incompatível.");
  if (data.rules.length > 2000) throw Error("Use até 2 mil regras por comparação.");
  validateSnapshot(data.before,"Antes");
  validateSnapshot(data.after,"Depois");
  if ((data.before.threads !== undefined || data.after.threads !== undefined) && data.schemaVersion !== 2)
    throw Error("Use schemaVersion 2 para comparar threads.");
  validateThreads(data.before);
  validateThreads(data.after);
  return data.rules.map(rule => {
    const previous = decision(data.before,rule), current = decision(data.after,rule);
    const before = previous.allowed, after = current.allowed;
    return {rule:rule.name || rule.channel,before,after,beforeReason:previous.reason,afterReason:current.reason,beforeSteps:previous.steps,afterSteps:current.steps,status:after === rule.expect ?
      (before === after ? "Passou" : "Corrigida") : (before === after ? "Falha existente" : "Regressão")};
  });
}
if (typeof module !== "undefined") module.exports = {compare,access};
