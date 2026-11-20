# Porta Fechada

Um visitante deve ficar fora do canal de tickets. Uma mudança de cargo passou a permitir a leitura. Abra **index.html** para ver a regra quebrar e a coluna que mudou de “Negado” para “Permitido”.

Baixe a pasta para usar offline. O editor aceita o formato de **exemplo.json**. Os objetos `before` e `after` descrevem o cargo geral, os cargos adicionais e as sobrescritas de cada canal. Cada regra identifica membro, cargos, canal, permissão e resultado esperado. Máscaras são strings decimais. O verificador lê exclusivamente o documento fornecido.

O cálculo combina permissões do servidor, aplica a sobrescrita geral, agrega as dos cargos e aplica a do membro por último. Dono e administrador têm acesso. Enviar mensagens requer visibilidade do canal. O escopo desta edição é leitura e envio em canais comuns de texto. Use as sobrescritas efetivas do canal. Threads, timeout, canais de voz e hierarquia de moderação ficam fora do modelo.

Node 20+ · `node --test`. Os testes cobrem o exemplo, precedência do membro, administrador e configurações inválidas.

[Referência de permissões do Discord](https://discord.com/developers/docs/topics/permissions)
