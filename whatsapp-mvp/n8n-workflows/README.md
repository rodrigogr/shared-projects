# Workflows n8n — prontos para importar

5 arquivos JSON nesta pasta. Importe **na ordem abaixo** porque o Fluxo C precisa do ID do Fluxo B.

| Ordem | Arquivo | O que é |
|------:|---------|---------|
| 1 | [`webhook-verify-get.json`](webhook-verify-get.json) | Validação `hub.challenge` da Meta |
| 2 | [`fluxo-b-pos-consentimento.json`](fluxo-b-pos-consentimento.json) | Mensagem + PDF (chamado pelo C) |
| 3 | [`fluxo-c-respostas.json`](fluxo-c-respostas.json) | Webhook + classificação + estados |
| 4 | [`fluxo-a-opt-in.json`](fluxo-a-opt-in.json) | Disparo diário de consentimento |
| 5 | [`fluxo-d-campanhas-recorrentes.json`](fluxo-d-campanhas-recorrentes.json) | Campanha semanal (após base aquecida) |

---

## Como importar

No n8n:
1. Menu lateral → **Workflows** → **Import from File**
2. Selecione o JSON
3. Após importar, abra o workflow e configure os placeholders abaixo

---

## Placeholders a substituir em cada workflow

Depois de importar cada workflow, abra cada nó marcado e ajuste:

| Placeholder | Onde aparece | Substitua por |
|---|---|---|
| `PLACEHOLDER_SPREADSHEET_ID` | nós Google Sheets | `1_ugB7rzZ7IQ7jzDo1buuCIUj5Oq0H9O3wpEMvapQXB4` (ou seu ID) |
| `PLACEHOLDER_SHEET_NAME` | nós Google Sheets | `Página1` (ou nome da aba) |
| `PLACEHOLDER_GS_CRED_ID` | credencial nos nós Google Sheets | selecione sua credencial OAuth2 |
| `PLACEHOLDER_WA_CRED_ID` | credencial nos nós HTTP Request (WhatsApp) | selecione sua credencial Header Auth |
| `PLACEHOLDER_FLUXO_B_ID` | Fluxo C → nó **Execute Fluxo B (PDF)** | ID do workflow Fluxo B (visível na URL após importar) |

---

## Variáveis de ambiente do n8n

Configure no Railway / VPS / n8n Cloud (Settings → Variables):

```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=meu_token_secreto_123
CATALOGO_PDF_URL=https://seu-dominio.com/catalogos/catalogo-luz-da-lua.pdf
GENERIC_TIMEZONE=America/Sao_Paulo
```

> Se não puder setar `GENERIC_TIMEZONE`, os crons já estão em UTC equivalente a 10h BRT (`0 13 * * 1-5` no Fluxo A e `0 13 * * 1` no Fluxo D). Caso configure o timezone, troque para `0 10 * * ...`.

---

## Credenciais a criar (uma vez só, no n8n)

### 1. Google Sheets OAuth2
- Type: **Google Sheets OAuth2 API**
- Siga o passo 4 do [00-pre-requisitos-contas-infra-custos.md](../00-pre-requisitos-contas-infra-custos.md)
- Nome sugerido: `Google Sheets - Luz da Lua`

### 2. WhatsApp Cloud API (Header Auth)
- Type: **Header Auth**
- Name: `Authorization`
- Value: `Bearer SEU_ACCESS_TOKEN_PERMANENTE`
- Nome sugerido: `WhatsApp Cloud API - Bearer`

> Use **token permanente de System User** (não o token temporário de teste).

---

## Configurações no Meta após importar

1. Crie e aprove o template **`solicitar_consentimento`** (UTILITY) com botões `SIM` (`OPTIN_SIM`) e `NÃO` (`OPTIN_NAO`)
2. Crie o template de campanha (ex.: `campanha_promo_mensal`) com categoria MARKETING — usado pelo Fluxo D
3. Configure o **Webhook** apontando para a URL pública do **Fluxo C** (path `whatsapp-respostas`)
4. Use o mesmo `WHATSAPP_VERIFY_TOKEN` do .env
5. Inscreva-se no campo **`messages`**

---

## Ordem de ativação

1. Ative `Webhook Verify GET` → faça a verificação no Meta (precisa estar **active**, não **test**)
2. Ative `Fluxo C - Respostas`
3. Ative `Fluxo B` (fica em standby, é chamado pelo C)
4. Ative `Fluxo A` (começa a disparar opt-in nos próximos 10h BRT do dia útil)
5. Ative `Fluxo D` apenas depois de ter base de clientes em `ativo` (semana 4+)

---

## Checklist de teste antes do go-live

- [ ] Coloque **seu próprio número** na planilha como contato de teste
- [ ] Execute Fluxo A manualmente (botão **Test workflow**)
- [ ] Recebeu a mensagem com botões SIM/NÃO?
- [ ] Clique em SIM → planilha atualizou para `ativo`?
- [ ] Recebeu o catálogo PDF automaticamente?
- [ ] Responda "SAIR" → planilha foi para `opt_out`?
- [ ] Execute Fluxo A novamente → seu número **não** recebe mais

Só depois desses 6 itens, comece o ramp-up do warm-up (ver [07-warmup-e-qualidade.md](../07-warmup-e-qualidade.md)).

---

## Avisos importantes

- Os JSONs usam **versões de nó atuais do n8n (≥1.50)**. Se sua instância for mais antiga, alguns parâmetros podem falhar — atualize o n8n.
- O nó **Set** com regex usa unicode escapes (`\\u00e3` para `ã`). Funciona normalmente, mas se for editar na UI, mantenha o `\\` duplo.
- O nó **Wait** com expressão dinâmica (`Math.random()`) pausa cada execução individualmente — em planos com limite de execuções (n8n Cloud), conta como execução suspensa.
