# Política de segurança

## Versões cobertas

Só a versão da branch `main`, publicada na [demonstração](https://ykauttiz.github.io/porta-fechada/), recebe correções. Porta Fechada é um projeto pessoal mantido por uma pessoa, e não há prazo garantido de resposta.

## Como relatar

1. Se a aba **Security** do repositório tiver o botão **Report a vulnerability**, use-o. O relato fica privado.
2. Se o botão não estiver disponível, abra uma [issue](https://github.com/ykauttiz/porta-fechada/issues/new/choose) com o título "Segurança: resumo", descrevendo o **impacto** e sem o passo a passo de exploração nem dados reais. O mantenedor combina um canal privado antes de qualquer detalhe técnico.

Nunca publique tokens, senhas ou dados de terceiros em um relato.

## O que interessa

- Um JSON ou CSV que consiga injetar HTML ou fórmulas de planilha nos relatórios.
- Um erro de cálculo que **conceda** acesso que a regra deveria negar, com um exemplo mínimo e fictício.
- Arquivos grandes que travem ou esgotem a memória do navegador, apesar dos limites de 2 MiB e 2 mil regras.

## Fora de escopo

- Pedidos de recurso e erros de cálculo sem impacto de segurança: use [Relatar um problema](https://github.com/ykauttiz/porta-fechada/issues/new/choose).
- Falhas em serviços de terceiros (GitHub, Discord, plataformas de delivery): relate ao serviço.

## O que o código faz com os dados

O código do aplicativo não usa telemetria nem scripts de terceiros e não envia os dados do usuário a um servidor. A hospedagem na GitHub Pages registra acessos como qualquer site estático. Ausência de alertas não prova ausência de falhas.
