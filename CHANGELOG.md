# Changelog

## 2026-11-20 · Origem da decisão

A tabela mostra a última etapa que alterou o acesso efetivo no cenário final. No JSON do terminal, os campos beforeReason e afterReason mostram as etapas para os dois cenários. Uma sobrescrita redundante não altera a explicação.

## 2026-11-20 · Usar em um pipeline

Execute `node check.js exemplo.json --json`. O relatório vai para a saída padrão. O código de saída é **0** quando todas as regras passam no estado final, **1** quando alguma falha e **2** para arquivo ausente, JSON inválido ou configuração incompatível. O exemplo incluído termina com **1** porque contém uma regressão intencional. Omita `--json` para ler o resultado por linha.
