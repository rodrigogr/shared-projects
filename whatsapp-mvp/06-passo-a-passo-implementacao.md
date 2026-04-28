# 6. Passo a Passo Completo — Implementação do MVP

> Escopo deste arquivo: implementação **rápida** da automação no n8n usando os 5 workflows já prontos em [`n8n-workflows/`](n8n-workflows/).
>
> Pré-requisitos de contas, infraestrutura e custos: ver [`00-pre-requisitos-contas-infra-custos.md`](00-pre-requisitos-contas-infra-custos.md).
>
> Detalhes técnicos de cada workflow: ver [`n8n-workflows/README.md`](n8n-workflows/README.md).

---

## Visão geral do que você vai fazer

| Fase | O que acontece | Onde | Tempo estimado |
|------|----------------|------|----------------|
| 1 | Preparar planilha + template + PDF | Google Sheets / Meta / hosting | Dia 1-3 |
| 2 | Criar credenciais e variáveis no n8n | n8n | Dia 3 |
| 3 | **Importar os 5 JSONs prontos** | n8n | Dia 3 (15 min) |
| 4 | Substituir placeholders em cada workflow | n8n | Dia 3 (10 min) |
| 5 | Configurar webhook no Meta + testar com seu número | Meta + WhatsApp | Dia 4 |
| 6 | Ativar na ordem certa e iniciar warm-up | n8n | Dia 5+ |

---

## Fase 1 — Pré-requisitos de dados (Dia 1-3)

### Passo 1: Planilha no Google Sheets
1. A planilha **Luz da Lua - Contatos** já existe:
   - URL: `https://docs.google.com/spreadsheets/d/1_ugB7rzZ7IQ7jzDo1buuCIUj5Oq0H9O3wpEMvapQXB4/edit`
   - **ID da planilha:** `1_ugB7rzZ7IQ7jzDo1buuCIUj5Oq0H9O3wpEMvapQXB4`
   - Aba: `Página1`
2. 2.611 contatos já importados com `status_contato = sem_consentimento`.
3. Preencha a coluna `segmento` nos contatos que quiser trabalhar primeiro.
4. **Confirme as 17 colunas** do template ([`planilha_contatos_template_v2.csv`](planilha_contatos_template_v2.csv)). Se faltar alguma das novas, adicione ao final:
   - `texto_opt_in` — auditoria LGPD: resposta crua que confirmou o opt-in
   - `versao_template_optin` — auditoria LGPD: versão do template usado
   - `tentativas_envio` — contador de erros (inicial = `0`)
   - `ultimo_erro` — último código de erro retornado pela Meta

### Passo 2: Template `solicitar_consentimento` aprovado no Meta

Você precisa **criar e aprovar** o template antes de qualquer envio. Os JSONs já enviam o body com a variável `{{1}}` = nome da cliente.

1. Acesse `https://business.facebook.com/wa/manage/message-templates/`
2. **Create template** com:
   - **Name:** `solicitar_consentimento`
   - **Category:** `Utility`
   - **Language:** `Portuguese (BR)` / `pt_BR`
3. **Body:**
   ```
   Olá {{1}}! 👋

   Aqui é a Anni da Luz da Lua.

   Gostaria de te enviar catálogo dos produtos da coleção.

   Se quiser receber, responda SIM.
   Se preferir não receber, responda NÃO.

   Você pode mudar de ideia a qualquer momento. 😊
   ```
4. **Buttons → Quick Reply** (2 botões):
   - Botão 1 — texto: `SIM`
   - Botão 2 — texto: `NÃO`
5. **Exemplo da variável `{{1}}`:** `Anni`
6. Envie para aprovação (geralmente sai em minutos, até 24h no pior caso).

> **Importante:** os textos exatos dos botões são `SIM` e `NÃO`. O Fluxo C também aceita os payloads `OPTIN_SIM`/`OPTIN_NAO` caso você prefira nomeá-los assim. **Não mude** os textos sem atualizar o Fluxo C.

#### Plano B: criar template via API (se a UI bloquear)

Se o WhatsApp Manager retornar erro de permissão:

1. No n8n, crie um workflow temporário com **Trigger manually** + **HTTP Request**:
   - Method: `POST`
   - URL: `https://graph.facebook.com/v23.0/SEU_WABA_ID/message_templates`
   - Header `Authorization: Bearer SEU_ACCESS_TOKEN`
   - Header `Content-Type: application/json`
   - Body (JSON):
   ```json
   {
     "name": "solicitar_consentimento",
     "category": "UTILITY",
     "language": "pt_BR",
     "components": [
       {
         "type": "BODY",
         "text": "Olá {{1}}! 👋\n\nAqui é a Anni da Luz da Lua.\n\nGostaria de te enviar catálogo dos produtos da coleção.\n\nSe quiser receber, responda SIM.\nSe preferir não receber, responda NÃO.\n\nVocê pode mudar de ideia a qualquer momento. 😊",
         "example": { "body_text": [["Anni"]] }
       },
       {
         "type": "BUTTONS",
         "buttons": [
           { "type": "QUICK_REPLY", "text": "SIM" },
           { "type": "QUICK_REPLY", "text": "NÃO" }
         ]
       }
     ]
   }
   ```
2. Execute. Guarde o `id` retornado e acompanhe o status no WhatsApp Manager.

### Passo 3: Template de campanha (`campanha_promo_mensal`)

Necessário **apenas** quando você for ativar o Fluxo D (semana 4+). Mesmas etapas do passo 2, mas:
- **Category:** `MARKETING`
- **Name:** `campanha_promo_mensal` (ou outro nome — atualize o Fluxo D depois)

### Passo 4: PDF do catálogo em URL pública

1. Hospede o PDF em URL pública e estável (S3, Supabase Storage, Cloudinary, Drive público com link direto, ou seu domínio).
2. **Guarde a URL final** — vai virar a variável de ambiente `CATALOGO_PDF_URL`.

---

## Fase 2 — Configurar credenciais e variáveis no n8n (Dia 3)

### Passo 5: Variáveis de ambiente do n8n

No painel do n8n (Railway / VPS / n8n Cloud → **Settings → Variables** ou `.env`):

```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=meu_token_secreto_123
CATALOGO_PDF_URL=https://seu-dominio.com/catalogos/catalogo-luz-da-lua.pdf
GENERIC_TIMEZONE=America/Sao_Paulo
```

> Se **não puder** configurar `GENERIC_TIMEZONE`, os crons já estão em UTC (10h BRT = `0 13 * * 1-5`). Se configurar, troque para `0 10 * * 1-5` no Fluxo A e `0 10 * * 1` no Fluxo D.

Reinicie o n8n para que as variáveis sejam carregadas.

### Passo 6: Credenciais (criar uma vez só)

#### 6.1 — Google Sheets OAuth2
1. **Credentials → New → Google Sheets OAuth2 API**
2. Use o Client ID/Secret do Google Cloud (passo 4 do [`00-pre-requisitos-contas-infra-custos.md`](00-pre-requisitos-contas-infra-custos.md))
3. Faça OAuth → autorize a conta que tem acesso à planilha
4. **Nome sugerido:** `Google Sheets - Luz da Lua`
5. **Anote o ID da credencial** (visível na URL ao editar a credencial: `/credentials/AbCdEf123...`) — você vai precisar dele no Passo 8.

#### 6.2 — WhatsApp Cloud API (Header Auth)
1. **Credentials → New → Header Auth**
2. **Name:** `Authorization`
3. **Value:** `Bearer SEU_ACCESS_TOKEN_PERMANENTE` (use **token de System User**, não o token temporário)
4. **Nome sugerido:** `WhatsApp Cloud API - Bearer`
5. **Anote o ID da credencial.**

---

## Fase 3 — Importar os workflows prontos (Dia 3, 15 min)

### Passo 7: Importar os 5 JSONs **nesta ordem**

> A ordem importa porque o Fluxo C precisa do **ID do Fluxo B** para chamá-lo.

| Ordem | Arquivo | Por que nessa ordem |
|------:|---------|---------------------|
| 1 | [`webhook-verify-get.json`](n8n-workflows/webhook-verify-get.json) | Independente — pode subir primeiro |
| 2 | [`fluxo-b-pos-consentimento.json`](n8n-workflows/fluxo-b-pos-consentimento.json) | Precisa existir antes do C para você copiar o ID |
| 3 | [`fluxo-c-respostas.json`](n8n-workflows/fluxo-c-respostas.json) | Referencia o Fluxo B |
| 4 | [`fluxo-a-opt-in.json`](n8n-workflows/fluxo-a-opt-in.json) | Independente, mas só faz sentido com C ativo |
| 5 | [`fluxo-d-campanhas-recorrentes.json`](n8n-workflows/fluxo-d-campanhas-recorrentes.json) | Só ativar depois do warm-up |

Para cada arquivo:
1. No n8n: **Workflows → Import from File**
2. Selecione o JSON
3. **NÃO ative ainda** — só importe.
4. Ao terminar de importar o Fluxo B, **copie o ID do workflow** (visível na URL: `/workflow/AbCd1234...`). Você vai usar no Passo 8.

---

## Fase 4 — Substituir placeholders (Dia 3, 10 min)

### Passo 8: Tabela mestre de substituições

Abra cada workflow importado e substitua os placeholders abaixo. Para a maioria, basta abrir o nó na UI e selecionar o item correto no dropdown — o n8n preenche o ID automaticamente.

| Placeholder | Onde aparece | Substitua por |
|-------------|--------------|---------------|
| `PLACEHOLDER_SPREADSHEET_ID` | Todos os nós Google Sheets (Fluxos A, B, C, D) | `1_ugB7rzZ7IQ7jzDo1buuCIUj5Oq0H9O3wpEMvapQXB4` |
| `PLACEHOLDER_SHEET_NAME` | Todos os nós Google Sheets | `Página1` |
| `PLACEHOLDER_GS_CRED_ID` | Credencial dos nós Google Sheets | ID da credencial criada no Passo 6.1 |
| `PLACEHOLDER_WA_CRED_ID` | Credencial dos nós HTTP Request (Fluxos A, B, D) | ID da credencial criada no Passo 6.2 |
| `PLACEHOLDER_FLUXO_B_ID` | Fluxo C → nó **Execute Fluxo B (PDF)** | ID do Fluxo B copiado no Passo 7 |

**Atalho via UI:** ao abrir um nó Google Sheets, basta clicar em **Document** e selecionar a planilha pelo nome (`Luz da Lua - Contatos`). O mesmo vale para **Credential** — selecione no dropdown.

### Passo 8.1: Verificação visual em cada workflow

Abra cada workflow e confirme:
- [ ] Nenhum nó está em **vermelho** (credencial faltando)
- [ ] Nenhum campo mostra a string `PLACEHOLDER_`
- [ ] No Fluxo C, o nó **Execute Fluxo B (PDF)** mostra o nome `Fluxo B - Pós-consentimento` no dropdown (não um ID solto)
- [ ] Variáveis `{{ $env.WHATSAPP_PHONE_NUMBER_ID }}`, `{{ $env.WHATSAPP_VERIFY_TOKEN }}`, `{{ $env.CATALOGO_PDF_URL }}` resolvem (clique no nó → aba **Output** após executar uma vez)

> **Dica:** se sua instância do n8n suportar, use a aba **JSON** do workflow (canto superior direito → **<>**) para fazer um find/replace em massa de cada placeholder. Cuidado para não trocar valores dentro de strings de outros lugares.

---

## Fase 5 — Webhook no Meta + teste com seu número (Dia 4)

### Passo 9: Ativar o Webhook Verify GET

1. Abra **Webhook Verify GET** e clique em **Activate** (toggle no topo).
2. Copie a URL **de produção** do nó Webhook (ex.: `https://seu-n8n.com/webhook/whatsapp-respostas`).
   - ⚠️ Não use a URL de teste (`/webhook-test/...`). Ela só funciona com o workflow aberto.

### Passo 10: Configurar webhook no Meta

1. Meta for Developers → seu App → **WhatsApp → Configuration → Webhook**
2. **Callback URL:** cole a URL do passo anterior
3. **Verify Token:** exatamente o mesmo valor de `WHATSAPP_VERIFY_TOKEN` (Passo 5)
4. Clique em **Verify and Save**
   - O Meta vai fazer um GET com `hub.challenge` → o workflow Verify devolve o challenge → ✅
   - Se falhar: confira que o workflow está **Active** e que a URL é a de produção
5. Em **Webhook fields**, inscreva-se em **`messages`**

> O n8n permite **GET e POST no mesmo path**. O GET é tratado pelo `Webhook Verify GET`, o POST pelo `Fluxo C - Respostas`.

### Passo 11: Ativar Fluxo C e Fluxo B

1. Abra **Fluxo C - Respostas** → **Activate**
2. Abra **Fluxo B - Pós-consentimento** → **Activate** (fica em standby, é chamado pelo C)

### Passo 12: Teste end-to-end com **seu próprio número**

1. Adicione seu número à planilha:
   - `nome` = seu nome
   - `telefone` = `55DDDNUMERO` (sem `+`, sem espaços)
   - `segmento` = qualquer valor (ex.: `acessorios`)
   - `status_contato` = `sem_consentimento`
   - demais colunas vazias
2. Abra **Fluxo A - Opt-in** → **Test workflow** (botão de play, sem ativar ainda)
3. Checklist:
   - [ ] Recebeu a mensagem com botões **SIM** e **NÃO** no WhatsApp?
   - [ ] Planilha atualizou para `status_contato = aguardando_resposta_optin`?
   - [ ] Clique em **SIM** → planilha vai para `status_contato = ativo`, `opt_in = sim`, `data_opt_in` preenchida?
   - [ ] Recebeu a mensagem do catálogo + PDF automaticamente?
   - [ ] Planilha atualizou para `status_contato = campanha_enviada`?
   - [ ] Responda `SAIR` → planilha vai para `status_contato = opt_out`, `opt_out = sim`?
   - [ ] Execute o Fluxo A novamente → seu número **não** recebe mais nada (já tem `opt_in` preenchido)

Se algum item falhar, use a aba **Executions** do n8n para ver o payload e diagnosticar.

---

## Fase 6 — Ativar Fluxo A e iniciar warm-up (Dia 5+)

### Passo 13: Ativar o Fluxo A com volume seguro

1. Abra **Fluxo A - Opt-in** → confirme que o nó **Limit** está com `Max items = 20` (semana 1)
2. **Activate**
3. O cron dispara automaticamente em dias úteis às 10h BRT

### Passo 14: Cronograma de warm-up

Ajuste o nó **Limit** do Fluxo A semanalmente, conforme [`07-warmup-e-qualidade.md`](07-warmup-e-qualidade.md):

| Semana | Max items diário |
|-------:|------------------:|
| 1 | 20 |
| 2 | 40 |
| 3 | 80 |
| 4 | 150 |
| 5+ | 250 (limite Meta tier inicial) |

### Passo 15: Ativar o Fluxo D (apenas semana 4+)

Só faz sentido quando houver base de clientes em `ativo` / `sem_interesse` / `atendida`:

1. Confirme que o template `campanha_promo_mensal` (categoria MARKETING) está aprovado
2. Confirme que o nome do template no nó HTTP do Fluxo D bate com o aprovado
3. **Activate**

---

## Operação contínua

### Rotina diária (Anni)
- Filtrar planilha por `status_contato = interessada` → atender no WhatsApp manualmente
- Após atender, mudar `status_contato` para `atendida`
- Verificar `status_contato = revisao_manual` (respostas ambíguas) e classificar à mão
- Conferir o painel **Executions** do n8n por erros (status `131026` é normal — número sem WhatsApp)

### Rotina semanal
- Cadastrar novos contatos (`status_contato = sem_consentimento`)
- Ajustar `Max items` do Fluxo A se estiver em fase de warm-up
- Revisar contatos com `status_contato = falha_envio` (tentativas_envio ≥ 3)

### Rotina mensal
- Métricas: % opt-in, % interesse, % opt-out, % vendas concretizadas
- Verificar **Quality Rating** do número no Meta Business Manager → se cair para `MEDIUM`, **reduza volume pela metade**
- Ajustar mensagens / segmentação

---

## Checklist final antes do go-live

- [ ] Template `solicitar_consentimento` **aprovado** com botões SIM/NÃO
- [ ] PDF do catálogo em URL pública estável
- [ ] 4 variáveis de ambiente configuradas no n8n
- [ ] 2 credenciais criadas (Google Sheets OAuth2 + Header Auth WhatsApp)
- [ ] 5 workflows importados na ordem correta
- [ ] Todos os placeholders substituídos (busque por `PLACEHOLDER_` em cada workflow)
- [ ] Webhook verificado no Meta (status: ✅)
- [ ] Inscrito no campo `messages`
- [ ] Teste completo com seu próprio número (6 itens do Passo 12)
- [ ] Workflows ativos: Verify GET, Fluxo C, Fluxo B, Fluxo A
- [ ] Fluxo D **inativo** até semana 4+

---

## Avisos importantes

1. **Access Token:** sempre use **System User Token permanente**. O token temporário expira em horas.
2. **Volume inicial:** comece com 20/dia. Subir muito rápido = ban.
3. **Opção de saída:** todas as mensagens devem permitir resposta "SAIR" — o Fluxo C já trata.
4. **Quality Rating:** monitore em Meta Business → WhatsApp → Phone Numbers. Se cair, reduza volume **imediatamente**.
5. **Número exclusivo:** não use seu número pessoal. Use um chip/eSIM dedicado ao projeto.
6. **Auditoria LGPD:** as colunas `texto_opt_in`, `versao_template_optin` e `data_opt_in` são suas provas de consentimento. Não delete.
7. **Versão do n8n:** os JSONs usam tipos de nó **≥1.50**. Se sua instância for antiga, atualize antes de importar.
