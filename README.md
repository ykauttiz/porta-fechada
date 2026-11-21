# Porta Fechada

[Experimentar no navegador](https://ykauttiz.github.io/porta-fechada/)

Um visitante deve ficar fora do canal de tickets. Uma mudança de cargo passou a permitir a leitura. Abra **index.html** para ver a regra quebrar e a coluna que mudou de “Negado” para “Permitido”.

Baixe a pasta para usar offline. O editor aceita o formato de **exemplo.json**. Os objetos `before` e `after` descrevem o cargo geral, os cargos adicionais e as sobrescritas de cada canal. Cada regra identifica membro, cargos, canal, permissão e resultado esperado. Máscaras são strings decimais. O verificador lê exclusivamente o documento fornecido.

O cálculo combina permissões do servidor, aplica a sobrescrita geral, agrega as dos cargos e aplica a do membro por último. Dono e administrador têm acesso. Enviar mensagens requer visibilidade do canal. O escopo desta edição é leitura e envio em canais comuns de texto. Use as sobrescritas efetivas do canal. Threads, timeout, canais de voz e hierarquia de moderação ficam fora do modelo.

Node 20+ · `node --test`. Os testes cobrem o exemplo, precedência do membro, administrador e configurações inválidas.

[Referência de permissões do Discord](https://discord.com/developers/docs/topics/permissions)

## Usar em um pipeline

Execute `node check.js exemplo.json --json`. O relatório vai para a saída padrão. O código de saída é **0** quando todas as regras passam no estado final, **1** quando alguma falha e **2** para arquivo ausente, JSON inválido ou configuração incompatível. O exemplo incluído termina com **1** porque contém uma regressão intencional. Omita `--json` para ler o resultado por linha.

## Origem da decisão

A tabela mostra a última etapa que alterou o acesso efetivo no cenário final. No JSON do terminal, os campos beforeReason e afterReason mostram as etapas para os dois cenários. Uma sobrescrita redundante não altera a explicação.

## Comparar configurações locais

Carregue o exemplo, importe um JSON ou abra o editor. No formulário de regras, informe o canal, o membro, seus cargos, a operação e o resultado esperado. O painel mostra as etapas decisivas antes e depois da mudança. Filtre regressões para investigar e baixe a configuração para repetir a análise ou o relatório para consultá-lo depois. O relatório inclui todas as regras avaliadas.

O formato reconhece `schemaVersion: 1` e os arquivos antigos sem versão. As máscaras são strings decimais. Sobrescritas repetidas, cargos desconhecidos e bits simultaneamente permitidos e negados são recusados mesmo em canais que não aparecem nas regras. O limite é de 2 MiB por arquivo e 2 mil regras. As regras cobrem visualização e envio em canais comuns de texto. A simulação usa dados fornecidos localmente, sem conexão com o servidor Discord.

[Referência de permissões do Discord](https://docs.discord.com/developers/topics/permissions)

O relatório CSV contém todas as regras avaliadas, os cargos, a expectativa, as decisões e as etapas decisivas. No terminal, use `node check.js exemplo.json --csv > evidencias.csv`. O relatório do navegador e o CSV do terminal incluem o SHA-256 do JSON compacto em UTF-8, útil para comparar a entrada usada nas duas análises. A ordem das propriedades faz parte do cálculo.

Busque regras por nome, canal, membro ou cargo e combine a busca com o filtro de resultado. Os downloads continuam representando a comparação completa. Uma importação inválida identifica qual configuração continua em uso.

O painel de resultados conta os quatro tipos de decisão dentro da busca atual. Selecione um contador para filtrar e selecione-o novamente para remover o filtro. A tabela apresenta 50 regras por página, e CSV e JSON incluem a análise completa.
