# 6. Passo a Passo Completo — Implementação do MVP

## Fase 1 — Criar as Contas (Dia 1-2)

### Passo 1: Criar conta no Meta Business
1. Acesse https://business.facebook.com
2. Crie uma conta Business (ou use uma existente)
3. Verifique sua identidade se solicitado
4. Acesse o painel do Meta Business Suite

### Passo 2: Configurar WhatsApp Business Platform
1. No Meta Business Suite, vá em **Todos os Produtos** > **WhatsApp**
2. Clique em **Começar**
3. Crie um **App** no Meta for Developers (https://developers.facebook.com)
   - Tipo: Business
   - Adicione o produto **WhatsApp**
4. No painel do WhatsApp, você verá:
   - **Phone Number ID** — identificador do seu número
   - **WhatsApp Business Account ID**
   - **Access Token** (temporário para teste)
5. Adicione seu número dedicado
   - Verifique via SMS ou ligação
6. Anote:
   - `PHONE_NUMBER_ID`
   - `WABA_ID`
   - `ACCESS_TOKEN`

### Passo 3: Criar conta no n8n
**Opção A — n8n Cloud (mais fácil)**
1. Acesse https://n8n.io
2. Crie conta no plano Starter ou Trial
3. Seu n8n já fica online com URL pública para webhooks

**Opção B — n8n Self-hosted (mais barato)**
1. Contrate uma VPS (ex: Hostinger, DigitalOcean, Hetzner)
   - Mínimo: 1 vCPU, 1GB RAM, Ubuntu
2. Instale o n8n via Docker:
```bash
docker run -d --restart unless-stopped \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=seu_usuario \
  -e N8N_BASIC_AUTH_PASSWORD=sua_senha \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```
3. Configure um domínio ou subdomínio apontando para a VPS
4. Configure HTTPS (necessário para webhooks do WhatsApp)
   - Use Caddy, Nginx + Let's Encrypt, ou Cloudflare Tunnel

### Passo 4: Criar a planilha no Google Sheets
1. Acesse Google Sheets
2. Crie uma nova planilha chamada `Contatos WhatsApp MVP`
3. Na primeira linha, coloque os cabeçalhos:
```
nome | telefone | segmento | opt_in | data_opt_in | ultima_campanha | data_ultimo_envio | status_contato | resposta_ultima_campanha | data_ultima_resposta | interessado | opt_out | observacoes
```
4. A partir da linha 2, cadastre suas clientes com:
   - `nome`
   - `telefone` (formato: 5511999990001)
   - `segmento`
   - Deixe `status_contato` como `sem_consentimento`
   - Todos os outros campos ficam vazios

### Passo 5: Conectar Google Sheets ao n8n
1. No n8n, vá em **Credentials**
2. Adicione nova credencial **Google Sheets API**
3. Siga o fluxo OAuth2:
   - Permita acesso ao Google Sheets
   - Autorize o n8n a ler e escrever nas suas planilhas

---

## Fase 2 — Aprovar Templates no Meta (Dia 2-3)

### Passo 6: Criar template de consentimento
1. No Meta Business > WhatsApp Manager > **Message Templates**
2. Clique em **Create Template**
3. Preencha:
   - **Nome:** `solicitar_consentimento`
   - **Categoria:** UTILITY
   - **Idioma:** Português (BR)
   - **Corpo:**
```
Olá {{1}}, tudo bem?

Posso te enviar promoções e novidades por aqui?

Responda SIM para receber ou NÃO se preferir não receber.
```
4. Envie para aprovação
5. Aguarde aprovação (minutos a 24h)

### Passo 7: Preparar o PDF do catálogo
1. Salve o catálogo em PDF em uma URL pública e estável
2. Exemplo de opções:
   - seu próprio site/domínio
   - Google Drive com link direto público
   - armazenamento como Supabase Storage, S3 ou Cloudinary
3. Guarde a URL final do PDF
4. Essa URL será usada pelo n8n para enviar o documento depois do consentimento

---

## Fase 3 — Montar os Fluxos no n8n (Dia 3-5)

### Passo 8: Criar Fluxo A — Captura de Consentimento

1. No n8n, crie um novo workflow: `Fluxo A - Opt-in`
2. Adicione os nós na ordem:

**Nó 1 — Schedule Trigger**
- Intervalo: diário
- Hora: 10:00

**Nó 2 — Google Sheets (Read)**
- Credencial: sua conexão Google
- Planilha: `Contatos WhatsApp MVP`
- Operação: Read Rows

**Nó 3 — Filter**
- Campo: `opt_in`
- Condição: is empty
- E
- Campo: `status_contato`
- Condição: equals `sem_consentimento`

**Nó 4 — Limit**
- Max Items: 30

**Nó 5 — HTTP Request (WhatsApp API)**
- Método: POST
- URL: `https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID/messages`
- Authentication: Bearer Token → seu ACCESS_TOKEN
- Body (JSON):
```json
{
  "messaging_product": "whatsapp",
  "to": "={{ $json.telefone }}",
  "type": "template",
  "template": {
    "name": "solicitar_consentimento",
    "language": { "code": "pt_BR" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "={{ $json.nome }}" }
        ]
      }
    ]
  }
}
```

**Nó 6 — Google Sheets (Update)**
- Operação: Update Row
- Coluna de correspondência: `telefone`
- Campos:
  - `status_contato` = `aguardando_resposta_optin`
  - `data_ultimo_envio` = `={{ $now.toISO() }}`

3. Conecte os nós na sequência
4. Salve e ative o workflow

### Passo 9: Criar Fluxo C — Recebimento de Respostas

**Importante:** Crie este fluxo ANTES do Fluxo B, porque ele processa todas as respostas.

1. Crie novo workflow: `Fluxo C - Respostas`

**Nó 1 — Webhook**
- Método: POST
- Path: `whatsapp-respostas`
- Anote a URL gerada (ex: `https://seu-n8n.com/webhook/whatsapp-respostas`)

**Nó 2 — Set (Extrair dados)**
- Campos:
  - `telefone` = `={{ $json.entry[0].changes[0].value.messages[0].from }}`
  - `texto` = `={{ $json.entry[0].changes[0].value.messages[0].text.body }}`
  - `timestamp` = `={{ $json.entry[0].changes[0].value.messages[0].timestamp }}`
  - `texto_lower` = `={{ $json.texto.toLowerCase() }}`

**Nó 3 — Google Sheets (Lookup)**
- Operação: Read Rows
- Filtro: `telefone` = `={{ $json.telefone }}`

**Nó 4 — Switch (status_contato)**
- Campo: `status_contato` (do resultado da planilha)
- Caso 1: `aguardando_resposta_optin` → ramo opt-in
- Caso 2: `campanha_enviada` → ramo campanha
- Default: registrar resposta genérica

**Ramo Opt-in:**

**Nó 5a — IF (É opt-out?)**
- Condição: `texto_lower` contém `parar` OU `sair` OU `cancelar` OU `nao quero mais` OU `não quero mais`
- Se SIM → Nó 6a-out
- Se NÃO → Nó 5b

**Nó 5b — IF (É positivo?)**
- Condição: `texto_lower` contém `sim` OU `quero` OU `pode` OU `aceito` OU `ok` OU `claro`
- Se SIM → Nó 6a-sim
- Se NÃO → Nó 6a-nao

**Nó 6a-sim — Google Sheets (Update)**
- Coluna chave: `telefone`
- `opt_in` = `sim`
- `data_opt_in` = `={{ $now.toISO() }}`
- `status_contato` = `ativo`
- `data_ultima_resposta` = `={{ $now.toISO() }}`

Depois: enviar mensagem de confirmação de opt-in (texto livre)

**Nó 6a-nao — Google Sheets (Update)**
- Coluna chave: `telefone`
- `opt_in` = `nao`
- `opt_out` = `sim`
- `status_contato` = `opt_out`
- `data_ultima_resposta` = `={{ $now.toISO() }}`

Depois: enviar mensagem de confirmação de opt-out (texto livre)

**Nó 6a-out — Google Sheets (Update)**
- Mesmo que 6a-nao

**Ramo Campanha:**

**Nó 5c — IF (É opt-out?)**
- Mesma lógica do 5a
- Se SIM → atualizar para opt_out

**Nó 5d — IF (É interesse?)**
- Condição: `texto_lower` contém `quero` OU `interesse` OU `me chama` OU `sim` OU `quanto custa` OU `preço`
- Se SIM → Nó 6b-interesse
- Se NÃO → Nó 6b-sem

**Nó 6b-interesse — Google Sheets (Update)**
- `interessado` = `sim`
- `status_contato` = `interessada`
- `resposta_ultima_campanha` = `={{ $json.texto }}`
- `data_ultima_resposta` = `={{ $now.toISO() }}`

Depois: enviar mensagem de "vou te atender" + aviso para você

**Nó 6b-sem — Google Sheets (Update)**
- `interessado` = `nao`
- `status_contato` = `sem_interesse`
- `resposta_ultima_campanha` = `={{ $json.texto }}`
- `data_ultima_resposta` = `={{ $now.toISO() }}`

2. Conecte todos os nós
3. Salve e ative o workflow

### Passo 10: Configurar Webhook no Meta

1. No Meta for Developers > seu App > WhatsApp > Configuration
2. Em **Webhook**:
   - Callback URL: URL do Webhook do Fluxo C
   - Verify Token: defina um token (ex: `meu_token_secreto_123`)
3. No n8n, o Webhook precisa responder ao desafio de verificação da Meta
   - A Meta envia um GET com `hub.verify_token` e `hub.challenge`
   - Você precisa retornar o valor de `hub.challenge`
   - No n8n, crie um webhook GET separado que retorne `{{ $json.query['hub.challenge'] }}`
4. Inscreva-se no campo **messages**

### Passo 11: Criar Fluxo B — Mensagem pós-consentimento + PDF

1. Crie novo workflow: `Fluxo B - Pós-consentimento`

**Nó 1 — Execute Workflow Trigger**
- Esse fluxo será chamado pelo Fluxo C logo após a cliente responder `SIM`

**Nó 2 — HTTP Request (mensagem de texto)**
- Envie esta mensagem:
```text
Separei um catálogo com {{$json.segmento}} da Luz da Lua que estão em promoção e queria te mostrar.
Se gostar de algum modelo, me manda um print por aqui que eu te ajudo na escolha.
Se preferir não receber mais mensagens assim, é só me avisar.

Anni.
```

**Nó 3 — HTTP Request (envio do PDF)**
- Tipo: `document`
- Link: URL pública do seu catálogo

**Nó 4 — Google Sheets (Update)**
- `ultima_campanha` = `catalogo_pdf_inicial`
- `data_ultimo_envio` = `={{ $now.toISO() }}`
- `status_contato` = `campanha_enviada`
- `resposta_ultima_campanha` = vazio
- `interessado` = vazio

2. Salve e conecte esse fluxo ao Fluxo C após a resposta positiva do consentimento

---

## Fase 4 — Testar (Dia 5-6)

### Passo 12: Testar opt-in
1. Adicione SEU número na planilha como contato de teste
2. Preencha: nome, telefone e segmento
3. Deixe `status_contato` = `sem_consentimento`
4. Execute o Fluxo A manualmente
5. Verifique:
   - Recebeu a mensagem no WhatsApp?
   - Planilha atualizou para `aguardando_resposta_optin`?
6. Responda "SIM" no WhatsApp
7. Verifique:
   - Planilha atualizou `opt_in = sim`?
   - `status_contato` mudou para `ativo`?
   - `data_opt_in` foi preenchida?

### Passo 13: Testar campanha
1. Com seu contato de teste respondendo `SIM` ao consentimento
2. Verifique se o Fluxo B foi chamado automaticamente
3. Verifique:
   - Recebeu a mensagem de catálogo?
   - Recebeu o PDF?
   - Planilha atualizou para `campanha_enviada`?
4. Responda "quero saber mais"
5. Verifique:
   - `interessado = sim`?
   - `status_contato = interessada`?

### Passo 14: Testar opt-out
1. Responda "SAIR"
2. Verifique:
   - `opt_out = sim`?
   - `status_contato = opt_out`?
3. Execute o Fluxo B novamente
4. Verifique que seu contato NÃO recebeu a campanha

---

## Fase 5 — Operação Real (Dia 7+)

### Passo 15: Cadastre suas clientes
1. Na planilha, adicione as clientes que você quer abordar
2. Preencha: `nome`, `telefone`, `segmento`
3. Deixe todo o resto vazio
4. `status_contato` = `sem_consentimento`

### Passo 16: Ative o Fluxo A
1. Ative o workflow do Fluxo A
2. Ele vai rodar diariamente e enviar mensagens de consentimento
3. Limite: 30 por dia (ajuste conforme necessidade)

### Passo 17: Monitore as respostas
1. Acompanhe a planilha diariamente
2. Veja quais clientes responderam SIM
3. Veja se alguma pediu para sair

### Passo 18: Envie sua primeira campanha
1. Cadastre as clientes
2. Ative o Fluxo A
3. Aguarde as respostas de consentimento
4. Quando a cliente responder `SIM`, o catálogo em PDF será enviado automaticamente
5. Acompanhe as respostas na planilha

### Passo 19: Atenda as interessadas
1. Filtre a planilha por `status_contato = interessada`
2. Essas são as clientes que querem comprar
3. Abra o WhatsApp e continue o atendimento manualmente
4. Depois de atender, atualize `status_contato` para `atendida`

---

## Fase 6 — Manutenção Contínua

### Rotina diária
1. Verificar planilha
2. Atender clientes interessadas
3. Atualizar `status_contato` de `interessada` para `atendida` manualmente

### Rotina semanal
1. Cadastrar novos contatos
2. Revisar clientes que não responderam ao opt-in
3. Planejar próxima campanha

### Rotina mensal
1. Analisar resultados:
   - Quantas aceitaram o opt-in?
   - Quantas se interessaram nas campanhas?
   - Quantas pediram opt-out?
   - Quantas foram atendidas?
   - Quantas viraram venda?
2. Ajustar mensagens se necessário
3. Ajustar frequência e volume

---

## Checklist Final

- [ ] Conta Meta Business criada
- [ ] App criado no Meta for Developers
- [ ] WhatsApp Business Platform configurado
- [ ] Número dedicado verificado
- [ ] Access Token gerado
- [ ] Templates aprovados (consentimento + campanha)
- [ ] Template aprovado de consentimento
- [ ] n8n funcionando (Cloud ou self-hosted)
- [ ] Google Sheets conectado ao n8n
- [ ] PDF do catálogo disponível em URL pública
- [ ] Webhook configurado no Meta
- [ ] Fluxo A criado e testado
- [ ] Fluxo B criado e testado
- [ ] Fluxo C criado e testado
- [ ] Teste completo com seu próprio número
- [ ] Primeiros contatos cadastrados
- [ ] Fluxo A ativado
- [ ] Primeira campanha enviada

---

## Observações Importantes

1. **O Access Token temporário expira.** Para produção, gere um token permanente (System User Token) no Meta Business.
2. **Comece com volume baixo.** 30 opt-ins por dia + 50 campanhas por execução é seguro para início.
3. **Sempre inclua opção de saída** nas mensagens.
4. **Monitore a qualidade do número** no Meta Business > WhatsApp > Phone Numbers. Se a qualidade cair, reduza o volume.
5. **Não reutilize o número pessoal.** Use um número exclusivo para o projeto.
6. **Guarde o consentimento.** A `data_opt_in` e o texto da resposta são sua prova de autorização.
