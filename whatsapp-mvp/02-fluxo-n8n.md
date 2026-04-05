# 2. Fluxo do n8n — Passo a Passo

## Visão Geral

O MVP usa 3 fluxos (workflows) separados no n8n:

1. **Fluxo A** — Captura de Consentimento (Opt-in)
2. **Fluxo B** — Envio de Campanha
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
- Frequência: 1 vez por dia, às 10h
- Motivo: enviar em horário comercial, sem exagero

**Nó 2 — Google Sheets (Read)**
- Operação: Read Rows
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

**Nó 6 — Google Sheets (Update)**
- Operação: Update Row
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

**Nó 4 — Google Sheets (Update)**
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
[2. Set - Extrair telefone, texto, timestamp]
        |
[3. Google Sheets - Buscar contato pelo telefone]
        |
[4. Switch - Verificar status_contato atual]
        |
    ┌───────────────────────────────┐
    |                               |
[5a. É resposta de opt-in]    [5b. É resposta de campanha]
    |                               |
[6a. IF - Classificar opt-in]  [6b. IF - Classificar interesse]
    |                               |
[7a. Google Sheets - Atualizar [7b. Google Sheets - Atualizar
     opt-in e status]               interesse e status]
```

### Detalhamento

**Nó 1 — Webhook**
- Tipo: Webhook
- Método: POST
- URL: gerada pelo n8n (ex: `https://seu-n8n.com/webhook/whatsapp-respostas`)
- Esta URL é configurada no Meta Business como Webhook de callback

**Nó 2 — Set**
- Extrai do payload:
  - `telefone` = número de quem enviou
  - `texto` = corpo da mensagem
  - `timestamp` = hora da mensagem
- O payload do WhatsApp Cloud API vem em:
  - `body.entry[0].changes[0].value.messages[0].from`
  - `body.entry[0].changes[0].value.messages[0].text.body`
  - `body.entry[0].changes[0].value.messages[0].timestamp`

**Nó 3 — Google Sheets (Lookup)**
- Operação: Read Rows
- Filtro: `telefone` = telefone recebido
- Retorna os dados atuais da cliente

**Nó 4 — Switch**
- Campo: `status_contato`
- Caso 1: `aguardando_resposta_optin` → vai para 5a
- Caso 2: `campanha_enviada` → vai para 5b
- Caso padrão: registra resposta genérica

**Nó 5a — É resposta de opt-in**
- Segue para classificação do consentimento

**Nó 6a — IF (Classificar opt-in)**
- Condição: texto contém alguma palavra positiva
- Palavras positivas: `sim`, `quero`, `pode`, `aceito`, `manda`, `ok`, `claro`
- Palavras negativas: `nao`, `não`, `parar`, `sair`, `não quero`

Se positiva:
- `opt_in` = `sim`
- `data_opt_in` = timestamp
- `status_contato` = `ativo`

Depois dessa atualização, o sistema chama o Fluxo B para enviar a mensagem pós-consentimento e o PDF.

Se negativa:
- `opt_in` = `nao`
- `opt_out` = `sim`
- `status_contato` = `opt_out`

**Nó 7a — Google Sheets (Update)**
- Coluna chave: `telefone`
- Atualiza os campos conforme a classificação

**Nó 5b — É resposta de campanha**
- Segue para classificação de interesse

**Nó 6b — IF (Classificar interesse)**
- Palavras de interesse: `quero`, `tenho interesse`, `me chama`, `sim`, `quanto custa`, `preço`, `quero saber`, `manda`, `pode`
- Palavras de desinteresse: `não`, `nao`, `agora não`, `depois`, `sem interesse`
- Palavras de opt-out: `parar`, `sair`, `não quero mais`, `cancelar`

Se interesse:
- `interessado` = `sim`
- `status_contato` = `interessada`
- `resposta_ultima_campanha` = texto da resposta
- `data_ultima_resposta` = timestamp

Se desinteresse:
- `interessado` = `nao`
- `status_contato` = `sem_interesse`
- `resposta_ultima_campanha` = texto da resposta
- `data_ultima_resposta` = timestamp

Se opt-out:
- `opt_out` = `sim`
- `status_contato` = `opt_out`
- `resposta_ultima_campanha` = texto da resposta
- `data_ultima_resposta` = timestamp

**Nó 7b — Google Sheets (Update)**
- Coluna chave: `telefone`
- Atualiza os campos conforme a classificação

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
