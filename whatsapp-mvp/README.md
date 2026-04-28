# WhatsApp MVP — Telemarketing com Catálogo (Luz da Lua)

Solução de telemarketing que envia o catálogo da coleção via WhatsApp Business **sem risco de bloqueio**, usando a Cloud API oficial da Meta + n8n + Google Sheets.

## Princípios que evitam o bloqueio

1. **API oficial** Meta Cloud (não automação não-oficial tipo whatsapp-web.js / Baileys)
2. **Opt-in obrigatório** com template aprovado pela Meta
3. **Catálogo (PDF) só após o SIM**, dentro da janela de 24h
4. **Opt-out absoluto** e permanente
5. **Warm-up gradual** do número nas primeiras 4 semanas
6. **Espaçamento humanizado** entre envios (20-60s aleatórios)
7. **Tratamento de erros** com estados `numero_invalido` e `falha_envio`
8. **Auditoria LGPD** com `texto_opt_in` e `versao_template_optin`

## Ordem de leitura

| # | Arquivo | Tempo |
|---|---------|-------|
| 0 | [00-pre-requisitos-contas-infra-custos.md](00-pre-requisitos-contas-infra-custos.md) | 10 min |
| 1 | [01-estrutura-planilha.md](01-estrutura-planilha.md) | 5 min |
| 2 | [02-fluxo-n8n.md](02-fluxo-n8n.md) | 15 min |
| 3 | [03-regras-preenchimento-automatico.md](03-regras-preenchimento-automatico.md) | 5 min |
| 4 | [04-mensagens.md](04-mensagens.md) | 5 min |
| 5 | [05-logica-atualizacao-status.md](05-logica-atualizacao-status.md) | 5 min |
| 6 | [06-passo-a-passo-implementacao.md](06-passo-a-passo-implementacao.md) | 30 min |
| 7 | [07-warmup-e-qualidade.md](07-warmup-e-qualidade.md) | 10 min — **leitura obrigatória antes do go-live** |

## Arquivos auxiliares

- `vCards iCloud.vcf` — exportação bruta dos contatos da Anni
- `converter_vcf_csv.py` — converte VCF → CSV no formato da planilha (filtra contatos com emoji)
- `contatos_importados.csv` — saída do conversor
- `planilha_contatos_template_v2.csv` — template atualizado com colunas de auditoria LGPD e tratamento de erro
- `documentacao-usuaria.html` — versão visual para a usuária final

## Fluxos no n8n

| Fluxo | Trigger | O que faz |
|-------|---------|-----------|
| A — Opt-in | Schedule diário 10h BRT | Envia template de consentimento (com warm-up gradual) |
| B — Pós-consentimento | Chamado pelo Fluxo C | Envia mensagem + PDF dentro da janela 24h |
| C — Respostas | Webhook | Classifica respostas (botão > regex palavra-inteira) e atualiza planilha |
| D — Campanhas recorrentes | Schedule semanal | Dispara novas campanhas respeitando intervalo de 7 dias |
| Webhook Verify GET | Webhook GET | Valida o `hub.challenge` da Meta |
