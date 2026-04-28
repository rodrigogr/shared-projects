# 1. Estrutura Final da Planilha

## Visão Geral

A planilha `planilha_contatos_template.csv` é a base de dados do MVP.
Pode ser usada no Google Sheets, conectada ao n8n.

---

## Colunas

| # | Campo | Quem preenche | Tipo | Valores aceitos | Exemplo |
|---|-------|--------------|------|----------------|---------|
| 1 | `nome` | Você | texto | nome da cliente | Maria Silva |
| 2 | `telefone` | Você | texto | formato 55DDDNÚMERO (sem `+`, sem espaços, sem traços) | 5511999990001 |
| 3 | `segmento` | Você | texto | categoria personalizada da mensagem | bolsas |
| 4 | `opt_in` | Sistema | texto | vazio / sim / nao | sim |
| 5 | `data_opt_in` | Sistema | data/hora | ISO 8601 | 2026-03-28T15:47:00 |
| 6 | `ultima_campanha` | Sistema | texto | identificador da campanha | promo_abril_01 |
| 7 | `data_ultimo_envio` | Sistema | data/hora | ISO 8601 | 2026-04-01T10:00:00 |
| 8 | `status_contato` | Sistema | texto | ver tabela abaixo | ativo |
| 9 | `resposta_ultima_campanha` | Sistema | texto | texto da resposta | quero saber mais |
| 10 | `data_ultima_resposta` | Sistema | data/hora | ISO 8601 | 2026-04-01T10:35:00 |
| 11 | `interessado` | Sistema | texto | vazio / sim / nao | sim |
| 12 | `opt_out` | Sistema | texto | vazio / sim | sim |
| 13 | `observacoes` | Você | texto | notas livres | Comprou em dezembro |
| 14 | `texto_opt_in` | Sistema | texto | resposta crua que confirmou o opt-in (auditoria LGPD) | sim, quero receber |
| 15 | `versao_template_optin` | Sistema | texto | nome+versão do template usado | solicitar_consentimento_v1 |
| 16 | `tentativas_envio` | Sistema | inteiro | contador de tentativas com erro | 0 |
| 17 | `ultimo_erro` | Sistema | texto | código/mensagem do último erro Meta | 131026 - not a WhatsApp user |

---

## Campos que você preenche (3)

1. **nome** — nome da cliente
2. **telefone** — número com código do país e DDD, sem espaços, sem traços
3. **segmento** — termo personalizado que entra no texto da campanha

Sugestões de uso para `segmento`:
- `bolsas`
- `mochilas`
- `carteiras`
- `acessorios`
- `novidades`
- `seleção especial`

---

## Campos que o sistema preenche (9)

### opt_in
- Começa vazio
- Preenchido quando a cliente responde à mensagem de consentimento
- `sim` = autorizou receber promoções
- `nao` = recusou

### data_opt_in
- Começa vazio
- Preenchido com data e hora exata da resposta positiva
- Formato: `2026-03-28T15:47:00`

### ultima_campanha
- Identificador da última campanha enviada
- Exemplo: `promo_abril_01`, `reativacao_maio`

### data_ultimo_envio
- Data e hora do último envio de campanha
- Usado para controlar frequência

### status_contato
- Estado atual da cliente no funil

| Status | Significado |
|--------|-------------|
| `sem_consentimento` | Recém-cadastrada, ainda sem opt-in |
| `aguardando_resposta_optin` | Mensagem de consentimento enviada, sem resposta ainda |
| `ativo` | Tem opt-in, pode receber campanhas |
| `campanha_enviada` | Campanha enviada, aguardando resposta |
| `interessada` | Respondeu com interesse |
| `sem_interesse` | Respondeu sem interesse |
| `aguardando_atendimento` | Interesse confirmado, você precisa atender |
| `atendida` | Você já deu continuidade |
| `opt_out` | Pediu para não receber mais |
| `numero_invalido` | Meta retornou que o número não é WhatsApp |
| `falha_envio` | Erro técnico no envio (rate limit, template paused etc.) — para revisão |
| `revisao_manual` | Resposta não classificável automaticamente |

### resposta_ultima_campanha
- Texto exato ou resumo da última resposta da cliente

### data_ultima_resposta
- Data e hora da última resposta recebida

### interessado
- `sim` se a resposta indica interesse
- `nao` se a resposta indica desinteresse
- vazio se ainda não respondeu

### opt_out
- `sim` se a cliente pediu para parar de receber
- vazio enquanto não pedir

---

## Campos opcionais (você preenche se quiser)

1. **observacoes** — notas livres sobre a cliente

---

## Estado inicial de um novo contato

Quando você adiciona uma cliente nova, a linha fica assim (todos os campos do sistema vazios, exceto `status_contato`, `tentativas_envio`):

| nome | telefone | segmento | status_contato | tentativas_envio | observacoes |
|------|----------|----------|----------------|-----------------:|-------------|
| Maria Silva | 5511999990001 | bolsas | sem_consentimento | 0 | Cliente indicada |

Demais colunas (`opt_in`, `data_opt_in`, `ultima_campanha`, `data_ultimo_envio`, `resposta_ultima_campanha`, `data_ultima_resposta`, `interessado`, `opt_out`, `texto_opt_in`, `versao_template_optin`, `ultimo_erro`) começam vazias e são preenchidas pelo sistema.

---

## Regra de ouro

**O sistema NUNCA envia campanha para contatos com `opt_in` diferente de `sim`.**
