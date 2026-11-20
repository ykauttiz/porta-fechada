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
find("#source").value = JSON.stringify(example,null,2);
function run() {
  try {
    const result = compare(JSON.parse(find("#source").value));
    const answer = value => value ? "Permitido" : "Negado";
    show(result.map(r=>[r.rule,answer(r.before),answer(r.after),r.status]));
    find("#message").textContent = result.length + " regra(s) avaliada(s).";
  } catch (error) { show([]); find("#message").textContent = error.message; }
}
find("form").onsubmit = event => { event.preventDefault(); run(); };
run();
