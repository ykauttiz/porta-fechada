# Changelog

## 2026-11-21

Navegação visual revista, foco de teclado explícito, link para o portfólio e roteiro curto no README.

O CSV de evidências neutraliza também prefixos de controle e variantes Unicode que podem iniciar fórmulas em planilhas.

Simulação local de threads públicas e privadas no formato 2, com exemplo de convite e decisões explicadas. Os testes de interface também exercitam telas de 320 pixels.

Na tabela de resultados, expanda cada etapa decisiva para acompanhar a permissão desde a configuração do servidor até a última sobrescrita aplicável. O relatório JSON inclui esse percurso.

Histórico de comparações nomeadas no navegador, com reabertura, validação e remoção pela interface. O download da configuração permite manter uma cópia fora do navegador.

A matriz por membro mostra leitura e envio antes e depois, separados por canal e conjunto de cargos declarado. Uma operação sem regra aparece explicitamente como tal.

O CI executa os testes do motor e da CLI com cobertura no Node 22 e 24. Abra a etapa de testes para consultar as linhas e ramos cobertos. O CI disponibiliza capturas em duas larguras.

O painel de resultados conta os quatro tipos de decisão dentro da busca atual. Selecione um contador para filtrar e selecione-o novamente para remover o filtro. A tabela apresenta 50 regras por página, e CSV e JSON incluem a análise completa.

Busque regras por nome, canal, membro ou cargo e combine a busca com o filtro de resultado. Os downloads continuam representando a comparação completa. Uma importação inválida identifica qual configuração continua em uso.

- Configuração e resultados em painéis próprios, com navegação direta e identificação visual dos resultados.

O relatório CSV contém todas as regras avaliadas, os cargos, a expectativa, as decisões e as etapas decisivas. No terminal, use `node check.js exemplo.json --csv > evidencias.csv`. O relatório do navegador e o CSV do terminal incluem o SHA-256 do JSON compacto em UTF-8, útil para comparar a entrada usada nas duas análises. A ordem das propriedades faz parte do cálculo.

Importação de JSON versionado, criação de regras pelo formulário, filtro por resultado e exportação da configuração e do relatório. Validação das duas configurações completas, incluindo canais sem regras.

## 2026-11-20 · Origem da decisão

A tabela mostra a última etapa que alterou o acesso efetivo no cenário final. No JSON do terminal, os campos beforeReason e afterReason mostram as etapas para os dois cenários. Uma sobrescrita redundante não altera a explicação.

## 2026-11-20 · Usar em um pipeline

Execute `node check.js exemplo.json --json`. O relatório vai para a saída padrão. O código de saída é **0** quando todas as regras passam no estado final, **1** quando alguma falha e **2** para arquivo ausente, JSON inválido ou configuração incompatível. O exemplo incluído termina com **1** porque contém uma regressão intencional. Omita `--json` para ler o resultado por linha.
