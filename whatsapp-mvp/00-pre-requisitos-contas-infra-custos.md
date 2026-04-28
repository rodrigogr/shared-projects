# 0. Pré-requisitos — Contas, Infra e Custos

Este arquivo reúne os pré-requisitos de conta/infra e a estimativa de custos para o MVP.

## Número do WhatsApp — regras inegociáveis

1. **Use um chip / eSIM dedicado e novo.** Não reutilize o número pessoal da Anni nem qualquer número que já esteja em WhatsApp comum ou WhatsApp Business app.
2. Ao registrar o número na Cloud API, ele **deixa de funcionar nos apps comuns** (é migração exclusiva para a API). Confirme com a Anni antes de registrar.
3. **Perfil Business 100% completo** no Meta Business Suite (foto, descrição, site, horário, e-mail, endereço, categoria "Compras e Varejo"). Perfil incompleto = quality rating baixo desde o início.
4. **Conta Meta Business verificada** (Business Verification) destrava limites maiores.
5. **Display Name aprovado** é obrigatório para envio.
6. **Warm-up obrigatório** durante as primeiras 4 semanas. Veja [07-warmup-e-qualidade.md](07-warmup-e-qualidade.md).

## Conformidade LGPD

Para operação de telemarketing no Brasil, você precisa **comprovar o consentimento** de cada cliente. A planilha já prevê os campos `texto_opt_in` e `versao_template_optin` exatamente para isso. Em caso de denuncia/processo, esses dois campos + `data_opt_in` + `telefone` (com `wa_id` da Meta) constituem prova de consentimento.

Regras práticas:
- Não compre listas de contatos
- Só importe contatos com relação pré-existente (clientes, indicações)
- Honre opt-out **imediatamente e para sempre**
- Mantenha backup periódico da planilha (prova histórica)

## Origem dos contatos (iCloud)

- Os contatos de origem estão no iCloud (app Contatos), conforme o processo usado no projeto.
- O arquivo bruto de exportação está em `vCards iCloud.vcf`.
- A conversão para planilha CSV está em `converter_vcf_csv.py`, gerando `contatos_importados.csv`.
- O formato final esperado para a automação é a planilha com `status_contato = sem_consentimento` para novos contatos.

## Passo 1: Criar conta no Meta Business Suite
1. Acesse https://business.facebook.com
2. Login com sua conta Facebook pessoal
3. Se ainda não tem business: **Create Account** → preencha:
   - Business name: `Luz da Lua`
   - Seu nome
   - E-mail comercial
4. Você cai no painel do Meta Business Suite

> **Mudança importante (2026):** A Meta unificou tudo em **Meta Business Suite**. Você **não precisa mais** criar app manualmente em `developers.facebook.com` — o app é criado automaticamente quando você cria a WhatsApp Business Account (WABA) no passo seguinte.

## Passo 2: Criar a WhatsApp Business Account (WABA)

Esta é a porta de entrada para a Cloud API. **Não depende de ter o número ainda** — o número é vinculado depois.

1. No Business Suite, abra **Settings** (engrenagem) ou acesse direto:
   `https://business.facebook.com/settings/whatsapp-business-accounts`
2. Clique em **Add** → **Create a WhatsApp Account**
3. Preencha:
   - **Business display name:** `Luz da Lua` (este será o nome que aparece para a cliente — escolha bem)
   - **Time zone:** `(GMT-03:00) São Paulo`
   - **Currency:** `BRL`
4. Confirme. A WABA é criada e a Meta gera automaticamente:
   - **WABA ID** (anote — visível na URL: `/whatsapp-business-accounts/123456789/`)
   - Um **app interno** vinculado à WABA (você não precisa configurar nada nele)

## Passo 3: Acessar o WhatsApp Manager

Tudo o que você precisa para o MVP fica aqui — **sem nunca abrir developers.facebook.com**.

1. Acesse `https://business.facebook.com/wa/manage/`
2. Selecione sua WABA `Luz da Lua`
3. As abas do menu lateral cobrem todo o MVP:
   - **Overview** — qualidade do número, métricas
   - **Phone numbers** — adicionar/registrar o eSIM (quando chegar)
   - **Message templates** — criar e aprovar `solicitar_consentimento`
   - **API Setup** — Access Token, Phone Number ID, WABA ID
   - **Webhooks** — Callback URL + Verify Token

### Anote agora (já está disponível):
- `WABA_ID` — visível em **Overview** ou na URL
- **Access Token temporário** — em **API Setup → Temporary access token** (válido 24h, renova com 1 clique). Já serve para criar templates via API.

### Anote depois (quando o eSIM chegar):
- `PHONE_NUMBER_ID` — gerado em **Phone numbers → Add phone number** após verificar o eSIM via SMS/ligação

## Passo 3A: Token permanente de System User (antes do go-live)

O token temporário expira em 24h. Para produção, você precisa de um **System User Token**:

1. Acesse `https://business.facebook.com/settings/system-users`
2. **Add** → **System User**
   - Name: `n8n-luz-da-lua`
   - Role: **Admin**
3. Após criar, clique no system user → **Add Assets** → selecione sua **WABA** com permissão **Full control**
4. Clique em **Generate New Token**:
   - App: selecione o app vinculado à sua WABA (auto-criado, geralmente nomeado como sua WABA)
   - **Permissions / Permissões:** marque
     - `whatsapp_business_management`
     - `whatsapp_business_messaging`
     - `business_management`
   - **Token Expiration:** `Never`
5. Copie o token (começa com `EAAG...`) — **só aparece uma vez**, guarde em local seguro
6. Esse é o token que vai na credencial Header Auth do n8n: `Bearer EAAG...`

## Passo 4: Business Verification (em paralelo, opcional para MVP)

A verificação destrava limites maiores (acima de 1.000 conv/24h) e é necessária para Display Name "verificado". Para o MVP da semana 1-4, **não é obrigatória** — você roda no tier inicial de 250 conv/24h.

1. Business Suite → **Settings → Security Center**
   `https://business.facebook.com/settings/security`
2. **Start Verification**
3. Documentos aceitos no Brasil:
   - **CNPJ ativo na Receita Federal** (preferido — vale também para MEI)
   - Comprovante de endereço da empresa (≤ 90 dias)
4. Tempo de aprovação: 1-5 dias úteis
5. **Pode rodar em paralelo** com o desenvolvimento — não bloqueia nada do MVP

> **Anni é PF / sem CNPJ?** Pode operar como Business sem verification, limitada a 250 conversas/24h. Para subir, abra MEI (R$ 0 e sai em 10 minutos em https://www.gov.br/empresas-e-negocios/) e use o CNPJ.

## Troubleshooting comum

| Sintoma | Solução |
|---------|--------|
| Não vejo "WhatsApp Accounts" no menu | Use a URL direta: `https://business.facebook.com/settings/whatsapp-business-accounts` |
| Botão "Create a WhatsApp Account" cinza | Você precisa ser **Admin** do Business. Verifique em **Settings → People** |
| "Add phone number" pede confirmar país | Selecione **Brasil** e digite o número do eSIM com DDD (sem +55, o painel já adiciona) |
| Token temporário expira no meio do desenvolvimento | É normal. Volte em **API Setup** e clique em **Generate token** novamente. Para automação estável, vá direto para o Passo 3A |
| Aparece "App não encontrado" ao gerar System User Token | A WABA precisa estar associada a um app. Vá em **Business Settings → Accounts → Apps** e veja o app auto-criado com o nome da sua WABA |

## Passo 3: Definir onde rodar o n8n

**Opção A — n8n Cloud (mais fácil)**
1. Acesse https://n8n.io
2. Crie conta no plano Starter ou Trial
3. Seu n8n já fica online com URL pública para webhooks

**Opção B — Railway (self-hosted simplificado)**
1. Acesse https://railway.com e crie sua conta
2. Crie um novo projeto e faça deploy da imagem `n8nio/n8n`
3. Configure as variáveis de ambiente no serviço (mínimo):
   - `N8N_HOST` (domínio público do Railway)
   - `N8N_PROTOCOL=https`
   - `N8N_PORT=5678`
   - `WEBHOOK_URL` (URL pública completa do n8n)
   - `N8N_BASIC_AUTH_ACTIVE=true`
   - `N8N_BASIC_AUTH_USER` e `N8N_BASIC_AUTH_PASSWORD`
4. Adicione um volume persistente montado em `/home/node/.n8n`
5. Valide se o n8n está acessível em HTTPS e se os webhooks respondem

**Opção C — VPS (self-hosted mais barato)**
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

## Passo 4: Configurar Google Cloud para Google Sheets (OAuth2)

> Este passo é obrigatório para n8n self-hosted (Railway/VPS).
> Se estiver no n8n Cloud com OAuth gerenciado, este passo pode ser reduzido.

### Parte A — No n8n (copiar URL de redirecionamento)
1. Crie um workflow com **Trigger manually**.
2. Adicione um nó **Google Sheets**.
3. No painel de ações, escolha uma ação (exemplo: **Get row(s) in sheet**).
4. Na configuração do nó, no campo de credencial, clique em **Create new credential**.
5. Escolha **Custom OAuth2** e copie a **OAuth Redirect URL**.

### Parte B — No Google Cloud (gerar Client ID e Client Secret)
1. Acesse https://console.cloud.google.com e selecione seu projeto.
2. Vá em **APIs e serviços** > **Biblioteca** e habilite:
   - **Google Sheets API**
   - **Google Drive API**
3. Vá em **APIs e serviços** > **Tela de consentimento OAuth**.
4. Configure o app com:
   - Público: **Externo** (para conta Google comum)
   - Domínio autorizado: domínio do seu n8n no Railway/VPS
   - Usuários de teste: adicione o e-mail que fará login (se o app estiver em teste)
5. Vá em **APIs e serviços** > **Credenciais**.
6. Clique em **+ Criar credenciais** > **ID do cliente OAuth**.
7. Tipo de aplicativo: **Aplicativo da Web**.
8. Em **URIs de redirecionamento autorizados**, cole a **OAuth Redirect URL** do n8n.
9. Clique em **Criar** e copie:
   - **Client ID**
   - **Client Secret**

### Parte C — Voltar ao n8n e autorizar
1. Cole **Client ID** e **Client Secret** na credencial do Google Sheets no n8n.
2. Clique em **Sign in with Google** e conclua a autorização.
3. Salve a credencial.

### Solução rápida de erro comum (403 access_denied)
Se aparecer "Acesso bloqueado" ou **Erro 403: access_denied**:
1. Verifique se o e-mail usado no login está em **Usuários de teste**.
2. Confirme se a URI no Google é idêntica à **OAuth Redirect URL** do n8n.
3. Confirme se **Google Sheets API** e **Google Drive API** estão habilitadas.

## Estimativa de custos — 3 cenários

Premissas:
- Sem custo de API do WhatsApp
- Sem custo de domínio premium
- Serviço rodando 24/7
- Dólar de referência aproximado: R$ 5,20

| Cenário | Volume estimado | Opção A: n8n Cloud | Opção B: Railway | Opção C: VPS |
|---|---|---:|---:|---:|
| 1. Piloto | até 2.5k execuções/mês | R$125 | US$5-8 (R$26-42) | US$4-6 (R$21-31) |
| 2. Operação inicial | ~8k execuções/mês | R$313+ | US$10-15 (R$52-78) | US$8-12 (R$42-62) |
| 3. Crescimento | ~20k execuções/mês | R$313-700 | US$18-30 (R$94-156) | US$12-24 (R$62-125) |

## Referência rápida para decisão
1. Menor esforço operacional: **Opção A (n8n Cloud)**
2. Melhor equilíbrio simplicidade x custo: **Opção B (Railway)**
3. Menor custo potencial: **Opção C (VPS)**
