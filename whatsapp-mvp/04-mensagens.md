# 4. Mensagens Iniciais — Consentimento e Campanha

## Importante

Todas as mensagens enviadas pela empresa (sem que a cliente tenha falado primeiro nas últimas 24h)
precisam ser **templates aprovados** no Meta Business.

Você cria o template no Meta Business > WhatsApp Manager > Message Templates.
Depois de aprovado, usa o nome do template no n8n.

> **Versionamento de templates:** sempre que mudar o texto do template de opt-in, crie um novo nome (`solicitar_consentimento_v2`, `_v3`, ...). Isso é obrigatório para auditoria LGPD — você precisa saber **qual texto** a cliente viu quando consentiu. O nome usado é gravado na coluna `versao_template_optin`.

---

## Mensagem 1 — Solicitação de Consentimento (Opt-in)

### Template para aprovar no Meta

**Nome do template:** `solicitar_consentimento` (ref. interna: `solicitar_consentimento_v1`)
**Categoria:** UTILITY
**Idioma:** Português (BR)

**Corpo da mensagem:**
```
Olá {{1}}! 👋

Aqui é a Anni da Luz da Lua.

Gostaria de te enviar promoções exclusivas e novidades por aqui.

Se quiser receber, responda SIM.
Se preferir não receber, responda NÃO.

Você pode mudar de ideia a qualquer momento. 😊
```

**Parâmetro {{1}}:** nome da cliente (vem da planilha)

**Botões Quick Reply (recomendado):**
- Botão 1 — texto: `SIM`, payload/id sugerido: `OPTIN_SIM`
- Botão 2 — texto: `NÃO`, payload/id sugerido: `OPTIN_NAO`

> Quando a cliente clica no botão, o webhook recebe o `payload`/`id` exato. Isso elimina ambiguidade de classificação por texto. As expressões do Fluxo C já priorizam esses payloads.

### Variações aceitas pela Meta
Se o template acima não for aprovado, tente uma versão mais simples:

```
Olá {{1}}, tudo bem?

Aqui é a Anni da Luz da Lua.

Posso te enviar promoções e novidades por aqui?

Responda SIM para receber ou NÃO se preferir não receber.
```

---

## Mensagem 2 — Pós-consentimento + PDF do Catálogo

Essa mensagem é enviada somente depois que a cliente responde `SIM` ao consentimento.
Como acontece dentro da janela de 24 horas, pode ser enviada como mensagem normal junto com o PDF, sem template.

```
Separei um catálogo com {{segmento}} da Luz da Lua que estão em promoção e queria te mostrar.
Se gostar de algum modelo, me manda um print por aqui que eu te ajudo na escolha.
Se preferir não receber mais mensagens assim, é só me avisar.

Anni.
```

### Exemplo preenchido
```
Separei um catálogo com bolsas da Luz da Lua que estão em promoção e queria te mostrar.

Se gostar de algum modelo, me manda um print por aqui que eu te ajudo na escolha.

Se preferir não receber mais mensagens assim, é só me avisar.

Anni.
```

### Como enviar no fluxo

1. Cliente responde `SIM` na mensagem de consentimento
2. Sistema grava `opt_in = sim`
3. Sistema envia esta mensagem em texto livre
4. Sistema envia o PDF do catálogo logo em seguida

### Observação importante

O PDF do catálogo é enviado somente depois que a cliente responde positivamente ou autoriza o recebimento.

### Valores recomendados para o campo `segmento`
```
- bolsas
- mochilas
- carteiras
- acessórios
- novidades
- seleção especial
```

---

## Mensagem 3 — Confirmação de Opt-in (resposta automática)

Essa mensagem deixa de ser necessária se você já for enviar imediatamente a mensagem com o catálogo em PDF após o consentimento.
Se quiser, pode manter uma confirmação curta antes do PDF, mas no MVP ela é opcional.

```
Ótimo, {{nome}}! 🎉

Você vai receber nossas melhores promoções por aqui.

Se em algum momento quiser parar de receber, é só responder SAIR.

Obrigado(a) pela confiança! 💛
```

---

## Mensagem 4 — Confirmação de Opt-out (resposta automática)

Enviada quando a cliente pede para parar.
Também é resposta dentro de 24h, NÃO precisa ser template.

```
Entendido, {{nome}}.

Você não receberá mais promoções por aqui.

Se mudar de ideia, é só me chamar! 😊
```

---

## Mensagem 5 — Resposta quando a cliente demonstra interesse

Enviada quando a cliente responde com interesse a uma campanha.
Resposta dentro de 24h, NÃO precisa ser template.

```
Que ótimo, {{nome}}! 😊

Vou te passar todos os detalhes.

[AQUI VOCÊ ASSUME O ATENDIMENTO MANUALMENTE]
```

Essa mensagem pode ser automática ou manual.
No MVP, recomendo que ela sirva como aviso para você continuar manualmente.

---

## Dicas para aprovação de templates

1. Não use linguagem agressiva ou de urgência extrema
2. Inclua sempre opção de saída (SAIR / NÃO QUERO MAIS)
3. Não prometa preços específicos no template genérico
4. Mantenha o tom amigável e direto
5. Categoria MARKETING para promoções, UTILITY para consentimento
6. Não use links encurtados (bit.ly etc.)
7. Envie para aprovação e aguarde (pode levar de minutos a 24h)

---

## Resumo das mensagens

| # | Mensagem | Tipo | Precisa template? |
|---|----------|------|-------------------|
| 1 | Solicitar consentimento | Envio empresa | Sim |
| 2 | Pós-consentimento + PDF | Resposta em 24h | Não |
| 3 | Confirmação de opt-in | Resposta em 24h | Não, opcional |
| 4 | Confirmação de opt-out | Resposta em 24h | Não |
| 5 | Interesse detectado | Resposta em 24h | Não |
