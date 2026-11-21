"use strict";
const find = selector => document.querySelector(selector);
function show(rows) {
  const body = find("#rule-table tbody");
  body.replaceChildren();
  for (const values of rows) {
    const row = body.insertRow();
    for (const [index, value] of values.entries()) {
      const cell = row.insertCell();
      if (index === 3) {
        const badge = document.createElement("strong");
        badge.className = "verdict";
        badge.dataset.status = value;
        badge.textContent = value;
        cell.append(badge);
      } else {
        cell.textContent = value;
      }
    }
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
const pageSize = 50;
const verdicts = ["Regressão","Falha existente","Corrigida","Passou"];
const normalize = text => text.normalize("NFD").replace(/\p{M}/gu,"").toLocaleLowerCase("pt-BR");
let page = 0, searchIndex = [];
const counters = verdicts.map(status => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.status = status;
  button.onclick = () => {
    const filter = find("#filter");
    filter.value = filter.value === status ? "" : status;
    page = 0; draw();
  };
  find("#rule-overview").append(button);
  return button;
});
function draw() {
  const selected = find("#filter").value, query = normalize(find("#rule-search").value.trim());
  const counts = new Map(), shown = [];
  rows.forEach((row,index) => {
    if (query && !searchIndex[index].some(value => value.includes(query))) return;
    counts.set(row.status,(counts.get(row.status) || 0) + 1);
    if (!selected || selected === row.status) shown.push(row);
  });
  for (const button of counters) {
    const status = button.dataset.status;
    button.textContent = status + " · " + (counts.get(status) || 0);
    button.setAttribute("aria-pressed",String(selected === status));
    button.disabled = !evaluated;
  }
  const pages = Math.max(1,Math.ceil(shown.length / pageSize));
  page = Math.min(pages-1,Math.max(0,page));
  find("#rule-pages").hidden = pages === 1;
  find("#rule-back").disabled = page === 0;
  find("#rule-next").disabled = page === pages-1;
  find("#rule-page").textContent = (page+1) + " / " + pages;
  const answer = value => value ? "Permitido" : "Negado";
  show(shown.slice(page*pageSize,(page+1)*pageSize).map(r=>[r.rule,answer(r.before),answer(r.after),r.status,r.beforeReason,r.afterReason]));
  find("#message").textContent = (shown.length ? "" : "Nenhuma regra corresponde aos filtros. ") + shown.length + " de " + rows.length + " regra(s).";
}
find("#rule-back").onclick = () => {page--;draw();};
find("#rule-next").onclick = () => {page++;draw();};
function drawMatrix() {
  const body = find("#matrix-rows");
  body.replaceChildren();
  if (!evaluated || !find("#matrix-panel").open) return;
  const member = find("#matrix-member").value, byChannel = new Map();
  evaluated.rules.forEach((rule,index) => {
    if (rule.member !== member) return;
    const roles = [...rule.roles].sort(), key = JSON.stringify([rule.channel,roles]);
    if (!byChannel.has(key)) byChannel.set(key,{channel:rule.channel,roles});
    byChannel.get(key)[rule.permission] = rows[index];
  });
  const transition = result => result ? [result.before,result.after].map(v => v ? "Permitido" : "Negado").join(" → ") : "Sem regra";
  const fragment = document.createDocumentFragment();
  for (const item of byChannel.values()) {
    const tr = document.createElement("tr");
    for (const value of [item.channel,item.roles.join(", ") || "Sem cargos",transition(item.view),transition(item.send)]) tr.insertCell().textContent = value;
    fragment.append(tr);
  }
  body.append(fragment);
}
find("#matrix-panel").ontoggle = drawMatrix;
find("#matrix-member").onchange = drawMatrix;
function apply(data, rewrite) {
  const result = compare(data);
  if (rewrite) source.value = JSON.stringify(data,null,2);
  evaluated = data; rows = result; page = 0;
  const memberSelect = find("#matrix-member"), oldMember = memberSelect.value;
  const members = [...new Set(data.rules.map(rule => rule.member))].sort();
  memberSelect.replaceChildren(...members.map(member => new Option(member,member)));
  if (members.includes(oldMember)) memberSelect.value = oldMember;
  drawMatrix();
  searchIndex = data.rules.map((rule,index) => [result[index].rule,rule.channel,rule.member,...rule.roles].map(normalize));
  find("#csv").disabled = find("#download").disabled = find("#save").disabled = false;
  draw();
}
function parse(text) {
  if(new Blob([text]).size>2*1024*1024)throw Error("Use um JSON de até 2 MiB.");
  return JSON.parse(text.replace(/^\uFEFF/,""));
}
function error(e) {find("#message").textContent=e.message;}
source.oninput=()=>{
  generation++;evaluated=null;find("#matrix-member").replaceChildren();drawMatrix();rows=[];searchIndex=[];page=0;draw();find("#csv").disabled=find("#download").disabled=find("#save").disabled=true;
  find("#message").textContent="Configuração editada. Execute as regras para atualizar o relatório.";
};
find("#editor").onsubmit=e=>{e.preventDefault();generation++;try{apply(parse(source.value),false);}catch(err){error(err);}};
find("#rule-search").oninput=()=>{if(evaluated){page=0;draw();}};
find("#filter").onchange=()=>{if(evaluated){page=0;draw();}};
find("#import").onchange=async e=>{
  const file=e.target.files[0],id=++generation;if(!file)return;
  try{if(file.size>2*1024*1024)throw Error("Use um JSON de até 2 MiB.");
    const text=await file.text();if(id===generation)apply(parse(text),true);
  }catch(err){if(id===generation)error(new Error("Arquivo não importado. " + err.message + (evaluated ? " A tabela e os downloads continuam com a última configuração válida." : "")));}finally{if(id===generation)e.target.value="";}
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
