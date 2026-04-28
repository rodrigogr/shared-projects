# 2. Fluxo do n8n — Passo a Passo

## Visão Geral

O MVP usa 3 fluxos (workflows) separados no n8n:

1. **Fluxo A** — Captura de Consentimento (Opt-in)
2. **Fluxo B** — Pós-consentimento + PDF
3. **Fluxo C** — Recebimento e Classificação de Respostas

---

## Fluxo A — Captura de Consentimento

**Objetivo:** Enviar mensagem de opt-in para contatos novos e registrar a resposta.

### Nós do fluxo

```
[1. Schedule Trigger]
        |
[2. Google Sheets - Ler contatos]
        |
[3. Filter - opt_in vazio E status = sem_consentimento]
        |
[4. Limit - máximo 30 por execução]
        |
[5. WhatsApp Cloud API - Enviar mensagem de consentimento]
        |
[6. Google Sheets - Atualizar status para aguardando_resposta_optin]
```

### Detalhamento

**Nó 1 — Schedule Trigger**
- Tipo: Schedule Trigger
- Frequência: 1 vez por dia, **às 10h no horário de Brasília (America/Sao_Paulo)**
- Importante: o n8n na nuvem (Railway/n8n Cloud) roda em **UTC** por padrão. Configure a variável de ambiente `GENERIC_TIMEZONE=America/Sao_Paulo` no serviço, **ou** ajuste o cron para `0 13 * * 1-5` (= 10h BRT em UTC, dias úteis)
- Motivo: enviar em horário comercial em dias úteis, sem exagero. **Evite finais de semana e feriados** — elevam reportes de spam.

**Nó 2 — Google Sheets**
- Ação: **Get row(s) in sheet**
- Planilha: planilha_contatos
- Aba: Contatos
- Retorna todas as linhas

**Nó 3 — Filter**
- Condição 1: `opt_in` está vazio (is empty)
- Condição 2: `status_contato` é igual a `sem_consentimento`
- Lógica: AND (ambas precisam ser verdadeiras)

**Nó 4 — Limit**
- Máximo: 30 contatos por execução
- Motivo: evitar volume alto de uma vez, reduzir risco

**Nó 5 — WhatsApp Cloud API (HTTP Request)**
- Método: POST
- URL: `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- Headers:
  - `Authorization: Bearer {ACCESS_TOKEN}`
  - `Content-Type: application/json`
- Body:
```json
{
  "messaging_product": "whatsapp",
  "to": "{{$json.telefone}}",
  "type": "template",
  "template": {
    "name": "solicitar_consentimento",
    "language": { "code": "pt_BR" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "{{$json.nome}}" }
        ]
      }
    ]
  }
}
```

**Nó 6 — Google Sheets**
- Ação: **Update row in sheet**
- Coluna chave: `telefone`
- Campos atualizados:
  - `status_contato` = `aguardando_resposta_optin`
  - `data_ultimo_envio` = `{{$now.toISO()}}`

---

## Fluxo B — Pós-consentimento + Envio do PDF

**Objetivo:** Assim que a cliente aprovar o recebimento, enviar a mensagem com o catálogo em PDF.

### Nós do fluxo

```
[1. Trigger interno após resposta SIM no Fluxo C]
                                |
[2. WhatsApp Cloud API - Enviar mensagem pós-consentimento]
                                |
[3. WhatsApp Cloud API - Enviar documento PDF]
                                |
[4. Google Sheets - Atualizar campos de envio]
```

### Detalhamento

**Nó 1 — Trigger**
- Esse fluxo pode ser um subfluxo chamado logo após a resposta positiva ao consentimento
- Também pode ser feito dentro do próprio Fluxo C

**Nó 2 — WhatsApp Cloud API (HTTP Request)**
- Método: POST
- URL: `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- Body:
```json
{
        "messaging_product": "whatsapp",
        "to": "{{$json.telefone}}",
        "type": "text",
        "text": {
                "body": "Separei um catálogo com {{$json.segmento}} da Luz da Lua que estão em promoção e queria te mostrar.\nSe gostar de algum modelo, me manda um print por aqui que eu te ajudo na escolha.\nSe preferir não receber mais mensagens assim, é só me avisar.\n\nAnni."
        }
}
```

**Nó 3 — WhatsApp Cloud API (HTTP Request)**
- Método: POST
- URL: `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- Body:
```json
{
        "messaging_product": "whatsapp",
        "to": "{{$json.telefone}}",
        "type": "document",
        "document": {
                "link": "https://SEU_DOMINIO/catalogos/catalogo-luz-da-lua.pdf",
                "filename": "catalogo-luz-da-lua.pdf"
        }
}
```

**Nó 4 — Google Sheets**
- Ação: **Update row in sheet**
- Coluna chave: `telefone`
- Campos atualizados:
  - `ultima_campanha` = `catalogo_pdf_inicial`
  - `data_ultimo_envio` = `{{$now.toISO()}}`
  - `status_contato` = `campanha_enviada`
  - `resposta_ultima_campanha` = vazio
  - `interessado` = vazio

---

## Fluxo C — Recebimento e Classificação de Respostas

**Objetivo:** Receber respostas das clientes, classificar e atualizar a planilha.

### Nós do fluxo

```
[1. Webhook - Receber mensagem do WhatsApp]
        |
[2. Edit Fields (Set) - Extrair telefone, texto, timestamp]
        |
[3. Google Sheets - Buscar contato pelo telefone]
        |
[4. Switch - status_contato]
        |
    ┌──────────────┼──────────────┐
    |              |              |
  opt-in       campanha       fallback
    |              |              |
[5a. IF opt-out?] [5c. IF opt-out?] [4x. Sheets
    |              |              resposta genérica]
    ├─true→6a-out  ├─true→opt_out
    └─false→       └─false→
[5b. IF positivo?] [5d. IF interesse?]
    |              |
    ├─true→6a-sim  ├─true→6b-interesse
    └─false→6a-nao └─false→6b-sem
```

### Detalhamento

**Nó 1 — Webhook**
- Tipo: Webhook
- Método: POST
- URL: gerada pelo n8n (ex: `https://seu-n8n.com/webhook/whatsapp-respostas`)
- Esta URL é configurada no Meta Business como Webhook de callback

**Nó 2 — Edit Fields (Set)**
- No n8n, procure por `set` na barra de busca e selecione **Edit Fields (Set)**
- Esse nó extrai os dados da mensagem recebida pelo webhook

**Opção A — Usando JSON (recomendado)**
1. Em **Mode**, selecione **JSON**
2. Cole este JSON no campo:
```json
{
  "telefone": "{{ $json.entry[0].changes[0].value.messages[0].from }}",
  "texto": "{{ $json.entry[0].changes[0].value.messages[0].text.body }}",
  "texto_lower": "{{ $json.entry[0].changes[0].value.messages[0].text.body.toLowerCase() }}",
  "timestamp": "{{ $json.entry[0].changes[0].value.messages[0].timestamp }}"
}
```

**Opção B — Usando Manual Mapping**
1. Em **Mode**, selecione **Manual Mapping**
2. Clique em **Add Field** 3 vezes e preencha:

| Nome do campo | Valor (expressão) |
|---------------|-------------------|
| `telefone` | `{{ $json.entry[0].changes[0].value.messages[0].from }}` |
| `texto` | `{{ $json.entry[0].changes[0].value.messages[0].text.body }}` |
| `texto_lower` | `{{ $json.entry[0].changes[0].value.messages[0].text.body.toLowerCase() }}` |
| `timestamp` | `{{ $json.entry[0].changes[0].value.messages[0].timestamp }}` |

3. Para inserir expressões, clique no ícone de engrenagem ao lado do campo de valor e ative o modo **Expression**

**Importante:** desative a opção **Include Other Input Fields** para que o nó passe adiante apenas os 4 campos extraídos

**Nó 3 — Google Sheets**
- Ação: **Get row(s) in sheet**
- Filtro: `telefone` = telefone recebido
- Retorna os dados atuais da cliente

**Nó 4 — Switch**
- Mode: **Rules**
- **Routing Rule 1:** `{{ $json.status_contato }}` `is equal to` `aguardando_resposta_optin` → Rename Output: `opt-in`
- **Routing Rule 2:** `{{ $json.status_contato }}` `is equal to` `campanha_enviada` → Rename Output: `campanha`
- **Fallback (saída automática):** é a 3ª saída do próprio Switch. Conecte essa saída a um nó Google Sheets de atualização para registrar resposta genérica (`resposta_ultima_campanha` e `data_ultima_resposta`) sem alterar `status_contato`

**Nó 5a — IF (É opt-out?)**
- `value1`: `{{ $json.texto_lower }}`
- Operador: `contains`
- `value2`: `parar, sair, cancelar, nao quero mais, não quero mais`
- Se `true` → Nó 6a-out
- Se `false` → Nó 5b

**Nó 5b — IF (É positivo?)**
- `value1`: `{{ $json.texto_lower }}`
- Operador: `contains`
- `value2`: `sim, quero, pode, aceito, ok, claro`
- Se `true` → Nó 6a-sim
- Se `false` → Nó 6a-nao

**Nó 6a-sim — Google Sheets**
- Ação: **Update row in sheet**
- Coluna chave: `telefone`
- `opt_in` = `sim`
- `data_opt_in` = `={{ $now.toISO() }}`
- `status_contato` = `ativo`
- `data_ultima_resposta` = `={{ $now.toISO() }}`

Depois dessa atualização, o sistema chama o Fluxo B para enviar a mensagem pós-consentimento e o PDF.

**Nó 6a-nao — Google Sheets**
- Ação: **Update row in sheet**
- Coluna chave: `telefone`
- `opt_in` = `nao`
- `opt_out` = `sim`
- `status_contato` = `opt_out`
- `data_ultima_resposta` = `={{ $now.toISO() }}`

**Nó 6a-out — Google Sheets**
- Ação: **Update row in sheet**
- Mesmo que Nó 6a-nao

**Ramo Campanha:**

**Nó 5c — IF (É opt-out?)**
- `value1`: `{{ $json.texto_lower }}`
- Operador: `contains`
- `value2`: `parar, sair, cancelar, nao quero mais, não quero mais`
- Se `true` → atualizar para opt_out (mesma lógica do Nó 6a-out)
- Se `false` → Nó 5d

**Nó 5d — IF (É interesse?)**
- `value1`: `{{ $json.texto_lower }}`
- Operador: `contains`
- `value2`: `quero, interesse, me chama, sim, quanto custa, preço`
- Se `true` → Nó 6b-interesse
- Se `false` → Nó 6b-sem

**Nó 6b-interesse — Google Sheets**
- Ação: **Update row in sheet**
- Coluna chave: `telefone`
- `interessado` = `sim`
- `status_contato` = `interessada`
- `resposta_ultima_campanha` = `={{ $json.texto }}`
- `data_ultima_resposta` = `={{ $now.toISO() }}`

**Nó 6b-sem — Google Sheets**
- Ação: **Update row in sheet**
- Coluna chave: `telefone`
- `interessado` = `nao`
- `status_contato` = `sem_interesse`
- `resposta_ultima_campanha` = `={{ $json.texto }}`
- `data_ultima_resposta` = `={{ $now.toISO() }}`

---

## Resumo dos 3 fluxos

| Fluxo | Trigger | Frequência | O que faz |
|-------|---------|------------|-----------|
| A - Opt-in | Schedule | 1x por dia | Pede consentimento para novos contatos |
| B - Pós-consentimento + PDF | Interno após resposta SIM | Imediato | Envia texto e catálogo PDF para quem autorizou |
| C - Respostas | Webhook | Tempo real | Classifica respostas e atualiza planilha |

---

## Configuração do Webhook no Meta

1. No Meta Business > WhatsApp > Configuração > Webhooks
2. URL de callback: a URL do Webhook do Fluxo C
3. Token de verificação: defina um token e configure no n8n
4. Eventos inscritos: `messages`
