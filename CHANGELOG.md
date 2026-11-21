# Changelog

## 2026-11-21

O relatório CSV contém todas as regras avaliadas, os cargos, a expectativa, as decisões e as etapas decisivas. No terminal, use `node check.js exemplo.json --csv > evidencias.csv`. O relatório do navegador e o CSV do terminal incluem o SHA-256 do JSON compacto em UTF-8, útil para comparar a entrada usada nas duas análises. A ordem das propriedades faz parte do cálculo.

Importação de JSON versionado, criação de regras pelo formulário, filtro por resultado e exportação da configuração e do relatório. Validação das duas configurações completas, incluindo canais sem regras.

## 2026-11-20 · Origem da decisão

A tabela mostra a última etapa que alterou o acesso efetivo no cenário final. No JSON do terminal, os campos beforeReason e afterReason mostram as etapas para os dois cenários. Uma sobrescrita redundante não altera a explicação.

## 2026-11-20 · Usar em um pipeline

Execute `node check.js exemplo.json --json`. O relatório vai para a saída padrão. O código de saída é **0** quando todas as regras passam no estado final, **1** quando alguma falha e **2** para arquivo ausente, JSON inválido ou configuração incompatível. O exemplo incluído termina com **1** porque contém uma regressão intencional. Omita `--json` para ler o resultado por linha.
