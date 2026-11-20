const test = require("node:test"), assert = require("node:assert/strict");
const {access,compare} = require("./core");
const fixture = require("./exemplo.json");
const rule = fixture.rules[0];
test("detecta regressão do exemplo",()=>assert.equal(compare(fixture)[0].status,"Regressão"));
test("sobrescrita de membro vence cargos",()=>{
  const snapshot = structuredClone(fixture.after);
  snapshot.channels.tickets.overwrites.push({type:"member",id:rule.member,deny:"1024",allow:"0"});
  assert.equal(access(snapshot,{...rule,permission:"send"}),false);
});
test("administrador ignora bloqueio do canal",()=>{
  const snapshot = structuredClone(fixture.before);snapshot.roles.visitante="8";
  assert.equal(access(snapshot,rule),true);
});
test("cargo ausente ou máscara inválida produz erro",()=>{
  assert.throws(()=>access(fixture.before,{...rule,roles:["desconhecido"]}));
  assert.throws(()=>access({...fixture.before,everyone:"-1"},rule));
});
test("identifica a etapa que mudou o acesso",()=>{
  const [result] = compare(fixture);
  assert.equal(result.beforeReason,"Canal · todos");
  assert.equal(result.afterReason,"Canal · cargos do membro");
  const overwritten = structuredClone(fixture);
  overwritten.after.channels.tickets.overwrites.push({type:"member",id:rule.member,deny:"1024",allow:"0"});
  assert.equal(compare(overwritten)[0].afterReason,"Canal · membro");
  assert.throws(()=>compare(null),/regra/);
});
