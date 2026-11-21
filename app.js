"use strict";
const find = selector => document.querySelector(selector);
function show(rows) {
  const body = find("tbody");
  body.replaceChildren();
  for (const values of rows) {
    const row = body.insertRow();
    for (const value of values) row.insertCell().textContent = value;
  }
}
const example = {
  "before": {
    "everyone": "3072",
    "roles": {
      "visitante": "0"
    },
    "channels": {
      "tickets": {
        "overwrites": [
          {
            "type": "everyone",
            "deny": "1024",
            "allow": "0"
          }
        ]
      }
    }
  },
  "after": {
    "everyone": "3072",
    "roles": {
      "visitante": "0"
    },
    "channels": {
      "tickets": {
        "overwrites": [
          {
            "type": "everyone",
            "deny": "1024",
            "allow": "0"
          },
          {
            "type": "role",
            "id": "visitante",
            "allow": "1024",
            "deny": "0"
          }
        ]
      }
    }
  },
  "rules": [
    {
      "name": "Tickets privados para visitantes",
      "channel": "tickets",
      "member": "exemplo",
      "roles": [
        "visitante"
      ],
      "permission": "view",
      "expect": false
    }
  ]
};
const source = find("#source");
let evaluated = null, rows = [], generation = 0;
function draw() {
  const selected = find("#filter").value;
  const answer = value => value ? "Permitido" : "Negado";
  const shown = rows.filter(r => !selected || r.status === selected);
  show(shown.map(r=>[r.rule,answer(r.before),answer(r.after),r.status,r.beforeReason,r.afterReason]));
  find("#message").textContent = shown.length + " de " + rows.length + " regra(s) · " +
    rows.filter(r=>r.status==="Regressão").length + " regressão(ões).";
}
function apply(data, rewrite) {
  const result = compare(data);
  if (rewrite) source.value = JSON.stringify(data,null,2);
  evaluated = data; rows = result;
  find("#csv").disabled = find("#download").disabled = find("#save").disabled = false;
  draw();
}
function parse(text) {
  if(new Blob([text]).size>2*1024*1024)throw Error("Use um JSON de até 2 MiB.");
  return JSON.parse(text.replace(/^\uFEFF/,""));
}
function error(e) {find("#message").textContent=e.message;}
source.oninput=()=>{
  generation++;evaluated=null;rows=[];show([]);find("#csv").disabled=find("#download").disabled=find("#save").disabled=true;
  find("#message").textContent="Configuração editada. Execute as regras para atualizar o relatório.";
};
find("#editor").onsubmit=e=>{e.preventDefault();generation++;try{apply(parse(source.value),false);}catch(err){error(err);}};
find("#filter").onchange=()=>{if(evaluated)draw();};
find("#import").onchange=async e=>{
  const file=e.target.files[0],id=++generation;if(!file)return;
  try{if(file.size>2*1024*1024)throw Error("Use um JSON de até 2 MiB.");
    const text=await file.text();if(id===generation)apply(parse(text),true);
  }catch(err){if(id===generation)error(err);}finally{if(id===generation)e.target.value="";}
};
find("#builder").onsubmit=e=>{
  e.preventDefault();generation++;
  try{const data=parse(source.value);
    data.rules.push({name:find("#ruleName").value.trim(),channel:find("#channel").value.trim(),
      member:find("#member").value.trim(),roles:find("#roles").value.split(",").map(s=>s.trim()).filter(Boolean),
      permission:find("#permission").value,expect:find("#expect").value==="true"});
    apply(data,true);
  }catch(err){error(err);}
};
function download(filename,value,type="application/json"){
  const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([type === "application/json" ? JSON.stringify(value,null,2) : value],{type}));
  link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}
find("#save").onclick=()=>download("configuracao.json",evaluated);
async function exportEvidence(format) {
  const config = evaluated, result = rows;
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(config));
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)), b => b.toString(16).padStart(2,"0")).join("");
    if (config !== evaluated) return;
    if (format === "csv") download("evidencias.csv", Reports.csv(config,result,hash), "text/csv;charset=utf-8");
    else download("relatorio.json",{schemaVersion:1,scope:"canais de texto",configSha256:hash,rules:result});
  } catch (err) { error(err); }
}
find("#csv").onclick=()=>exportEvidence("csv");
find("#download").onclick=()=>exportEvidence("json");
apply({...example,schemaVersion:1},true);
