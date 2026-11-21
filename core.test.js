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
test("valida canais sem regra e versão mesmo com acesso elevado",()=>{
 const doc=structuredClone(fixture);doc.after.channels.outro={overwrites:[{type:"role",id:"ausente",allow:"0",deny:"1"}]};
 assert.throws(()=>compare(doc),/alvo/);
 assert.throws(()=>compare({...fixture,schemaVersion:99}),/Versão/);
});
test("conflito de cargos agrega as permissões antes da decisão e aceita bits altos",()=>{
 const doc=structuredClone(fixture);doc.after.roles.equipe=String(1n<<54n);
 doc.after.channels.tickets.overwrites.push({type:"role",id:"equipe",deny:"1024",allow:"0"});
 const result=access(doc.after,{...rule,roles:["equipe","visitante"]});assert.equal(result,true);
 doc.after.channels.tickets.overwrites.push({type:"role",id:"equipe",deny:"0",allow:"0"});
 assert.throws(()=>compare(doc),/repetida/);
});
