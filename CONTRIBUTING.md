# Como contribuir com Porta Fechada

Obrigado pelo interesse. Porta Fechada é um projeto pessoal e pequeno. Relatos de problemas e sugestões com um exemplo fictício ajudam mais do que código sem contexto.

## Antes de começar

- Procure uma [issue](https://github.com/ykauttiz/porta-fechada/issues) existente ou abra uma com os formulários de relato ou melhoria.
- Para mudanças maiores, abra a issue antes e combine o escopo.
- Licença: ainda não declarada pelo autor. Converse na issue antes de enviar código.

## Dados

Use somente dados fictícios ou anonimizados em issues, testes e capturas. Não envie IDs reais de servidores, cargos ou membros do Discord. Troque-os por números fictícios antes de colar um JSON.

## Rodar os testes

Requisitos: Node 22 ou 24 (a CI usa essas versões).

```sh
node --test
```

A CI também roda `node --test --experimental-test-coverage` e o teste de navegador. Para o navegador, use Python 3 com `python3 -m pip install playwright==1.55.0` e rode `python3 tests/browser.py` (use `ENGINE=firefox` para o Firefox, depois de `python3 -m playwright install firefox`).

Ao editar `style.css`, atualize o parâmetro `?v=` em `index.html` com os 12 primeiros caracteres de `sha256sum style.css`.

## Pull requests

1. Crie uma branch a partir da `main`. Não reescreva o histórico.
2. Faça uma mudança de cada vez, com um teste que falhe sem ela e passe com ela.
3. Atualize README e CHANGELOG quando o comportamento mudar.
4. Preencha o modelo do pull request com os comandos executados e os resultados reais.
5. A CI (Verificar projeto) precisa passar. Uma entrega marcada usa um commit `release(vAAAA.MM.DD) Título`, feito pelo mantenedor.

## Estilo e acessibilidade

O `.editorconfig` define codificação, quebras de linha e indentação. Em mudanças de interface, confira navegação por teclado, foco visível, contraste nos temas claro e escuro, telas de 320 px e `prefers-reduced-motion`.
