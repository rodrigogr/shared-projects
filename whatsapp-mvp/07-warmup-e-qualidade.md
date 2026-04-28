# 7. Warm-up do número e Monitoramento de Qualidade

> Este é o documento mais importante para **não tomar bloqueio**.
> O motivo nº 1 de banimento de número novo na WhatsApp Cloud API é volume alto + qualidade baixa nos primeiros 14 dias.

---

## Conceitos básicos da Meta

A Meta classifica todo número novo em **Tiers de mensagens iniciadas**:

| Tier | Conversas iniciadas / 24h |
|------|---------------------------|
| Tier 0 (não verificado) | 250 |
| Tier 1 | 1.000 |
| Tier 2 | 10.000 |
| Tier 3 | 100.000 |

A subida de tier depende de:
1. **Quality rating verde** (Green) por pelo menos 7 dias consecutivos
2. Volume real próximo ao limite atual sem quedas de qualidade
3. Conta verificada no Meta Business

E o quality rating **cai** quando você recebe:
- Bloqueios (clientes apertam "Bloquear este contato")
- Reportes como spam
- Baixa taxa de resposta positiva
- Muitos opt-outs em sequência

Quando o rating cai para **Yellow** → aviso. Para **Red** → o número entra em **flagged status** e pode ser **suspenso**.

---

## Pré-requisitos do número

Antes de começar qualquer disparo:

1. **Número dedicado e novo** — nunca usado em WhatsApp pessoal nem WhatsApp Business app
2. O número, ao ser registrado na Cloud API, **deixa de funcionar nos apps comuns**. Confirme que isso está OK
3. **Perfil Business 100% completo** no Meta Business Suite:
   - Foto de perfil profissional (logo da Luz da Lua)
   - Nome de exibição claro
   - Categoria correta (Compras e Varejo)
   - Descrição da empresa
   - Site, e-mail, endereço, horário de atendimento
4. **Conta Meta Business verificada** (Business Verification) — destrava limites maiores
5. **Display Name aprovado** pela Meta

> Perfil incompleto = quality rating já começa baixo.

---

## Cronograma de Warm-up (4 semanas)

A planilha tem **2.611 contatos**. Não dispare todos de uma vez. Use este ramp-up:

| Semana | Dia útil | Envios/dia | Acumulado | Quem priorizar |
|--------|----------|-----------:|----------:|----------------|
| 1 | 1-5 | 20 | 100 | Clientes que compraram nos últimos 90 dias |
| 2 | 6-10 | 40 | 300 | Clientes dos últimos 6 meses |
| 3 | 11-15 | 80 | 700 | Clientes do último ano |
| 4 | 16-20 | 150 | 1.450 | Demais contatos quentes |
| 5+ | 21+ | 250 | — | Restante, respeitando o tier |

**Regra de ouro:** só sobe para a próxima faixa se o **quality rating estiver Green** ao final da semana anterior.

> Se cair para **Yellow**: pause 48h, reduza volume pela metade na semana seguinte.
> Se cair para **Red**: pause **toda** a operação imediatamente, investigue causas, ajuste mensagens e só retome após o rating voltar para Green (pode levar 7-14 dias).

---

## Como priorizar contatos quentes

Para o warm-up funcionar, comece pelos contatos com **maior chance de responder SIM** ao opt-in. Sugestões:

1. Filtre clientes que **compraram nos últimos 90 dias** → quase certo de aceitar
2. Depois clientes que **chamaram você no WhatsApp** nos últimos 6 meses (já te conhecem)
3. Por último, contatos antigos da agenda

Atualize a coluna `observacoes` na planilha com tags como:
- `cliente_recente`
- `cliente_6m`
- `cliente_antigo`
- `nunca_comprou`

E no Fluxo A, adicione um **Sort** ou **Filter** que priorize essas tags na ordem certa.

---

## Checklist diário (5 min)

Faça essas 5 verificações **todo dia útil** durante as primeiras 4 semanas:

1. **Quality rating** no Meta Business Manager → WhatsApp → Phone numbers
   - Status: deve estar `Green`
   - Se mudou para `Yellow` ou `Red`, **pare os disparos** e leia a aba "Insights"
2. **Tier atual** — confirmar que não regrediu
3. **Taxa de resposta SIM** na planilha — meta: >40% nas primeiras semanas
4. **Taxa de opt-out explícito** — meta: <5%
5. **Erros do n8n** no Fluxo A (execuções com falha)

Se algum indicador estiver fora da meta, **reduza o ritmo** antes que a Meta reduza por você.

---

## Boas práticas de mensagens (impacto direto na qualidade)

1. **Personalize com `{{nome}}`** — mensagens genéricas sobem reportes de spam
2. **Apresente quem está falando** — "Aqui é a Anni da Luz da Lua" ✓
3. **Ofereça opção clara de saída** em toda primeira mensagem
4. **Não use:** caps lock excessivo, urgência forçada ("ÚLTIMAS HORAS!!!"), promessas exageradas
5. **Não inclua link** no template de opt-in (Meta penaliza)
6. **Use botões SIM/NÃO** em vez de texto livre quando possível — taxa de resposta sobe e classificação fica perfeita
7. **Horário humano**: 10h-18h em dias úteis. Nada antes de 9h, nada depois de 20h, evite domingos e feriados

---

## Espaçamento entre envios

Disparar 30 mensagens em 5 segundos é padrão claramente automatizado.

No Fluxo A, configure:
- **SplitInBatches** com `Batch Size = 1`
- **Wait** após o envio com tempo aleatório entre **20 e 60 segundos**

Resultado prático: 30 envios levam de 10 a 30 minutos, distribuídos de forma natural.

> Detalhamento técnico do nó Wait está em [06-passo-a-passo-implementacao.md](06-passo-a-passo-implementacao.md).

---

## O que fazer se o número for bloqueado

1. **Não tente recuperar disparando mais** — só piora
2. Acesse Meta Business → WhatsApp → Phone numbers e leia o motivo
3. Se for **Restrictions** temporário (24-72h), apenas aguarde
4. Se for **Flagged** ou **Banned**, abra appeal pelo Meta Business Help Center
5. Se o appeal for negado, o número está perdido. Recomeçar com novo número exige novo warm-up
6. Por isso: **nunca** use o número pessoal da Anni para essa operação

---

## Indicadores para subir o ritmo

Você pode aumentar o volume diário acima do cronograma quando:

- Quality rating **Green** por 7 dias consecutivos
- Taxa de SIM > 50%
- Zero reportes de spam na semana
- Tier atual permite o novo volume

Aumentos seguros: **+50% por semana**, nunca dobrar de uma vez.

---

## Resumo — regras inegociáveis

| # | Regra |
|---|-------|
| 1 | Número dedicado, novo, perfil Business completo |
| 2 | Começar com 20/dia na semana 1 |
| 3 | Só subir volume com quality rating Green |
| 4 | Pausar imediatamente se rating cair para Yellow ou Red |
| 5 | Espaçar envios (SplitInBatches + Wait aleatório) |
| 6 | Priorizar contatos quentes nos primeiros disparos |
| 7 | Horário comercial em dias úteis |
| 8 | Respeitar opt-out de forma absoluta |
| 9 | Checklist diário nos primeiros 30 dias |
| 10 | Nunca disparar do número pessoal |
