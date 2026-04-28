# 5. Lógica de Atualização de Status

## Diagrama de Estados

```
                    ┌──────────────────┐
                    │ sem_consentimento │  ← Estado inicial
                    └────────┬─────────┘
                             │
                   Sistema envia opt-in
                             │
               ┌─────────────▼──────────────┐
               │ aguardando_resposta_optin   │
               └─────────────┬──────────────┘
                             │
                    Cliente responde
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         Responde SIM   Sem resposta   Responde NÃO
              │          (fica no       │
              │          mesmo estado)  │
              ▼                         ▼
        ┌──────────┐            ┌──────────┐
        │  ativo   │            │ opt_out  │  ← FIM
        └────┬─────┘            └──────────┘
             │
    Sistema envia campanha
             │
    ┌────────▼─────────┐
    │ campanha_enviada  │
    └────────┬─────────┘
             │
       Cliente responde
             │
    ┌────────┼────────────────┐
    │        │                │
 Interesse  Sem interesse   Opt-out
    │        │                │
    ▼        ▼                ▼
┌───────────┐ ┌──────────────┐ ┌──────────┐
│interessada│ │sem_interesse │ │ opt_out  │ ← FIM
└─────┬─────┘ └──────┬───────┘ └──────────┘
      │               │
      │          Volta para
      │          `ativo` na
      │          próxima campanha
      │
      ▼
┌─────────────────────┐
│aguardando_atendimento│  ← Você precisa atender
└──────────┬──────────┘
           │
     Você atende
           │
           ▼
     ┌──────────┐
     │ atendida │  → Volta para `ativo` na próxima campanha
     └──────────┘
```

---

## Transições Detalhadas

### 1. sem_consentimento → aguardando_resposta_optin
- **Gatilho:** Fluxo A envia mensagem de consentimento
- **Campos atualizados:**
  - `status_contato` = `aguardando_resposta_optin`
  - `data_ultimo_envio` = agora

### 2. aguardando_resposta_optin → ativo
- **Gatilho:** Cliente responde positivamente (botão SIM, ou texto: SIM, quero, aceito...)
- **Campos atualizados:**
  - `opt_in` = `sim`
  - `data_opt_in` = data/hora da resposta
  - `status_contato` = `ativo`
  - `data_ultima_resposta` = data/hora da resposta
  - `texto_opt_in` = texto cru da resposta (auditoria LGPD)
  - `versao_template_optin` = nome+versão do template (ex.: `solicitar_consentimento_v1`)

### 3. aguardando_resposta_optin → opt_out
- **Gatilho:** Cliente responde negativamente (NÃO, não quero...)
- **Campos atualizados:**
  - `opt_in` = `nao`
  - `opt_out` = `sim`
  - `status_contato` = `opt_out`
  - `data_ultima_resposta` = data/hora da resposta

### 4. ativo → campanha_enviada
- **Gatilho:** Fluxo B envia campanha
- **Campos atualizados:**
  - `ultima_campanha` = nome da campanha
  - `data_ultimo_envio` = agora
  - `status_contato` = `campanha_enviada`
  - `resposta_ultima_campanha` = vazio
  - `interessado` = vazio

### 5. campanha_enviada → interessada
- **Gatilho:** Cliente responde com interesse
- **Campos atualizados:**
  - `interessado` = `sim`
  - `status_contato` = `interessada`
  - `resposta_ultima_campanha` = texto da resposta
  - `data_ultima_resposta` = data/hora da resposta

### 6. campanha_enviada → sem_interesse
- **Gatilho:** Cliente responde sem interesse
- **Campos atualizados:**
  - `interessado` = `nao`
  - `status_contato` = `sem_interesse`
  - `resposta_ultima_campanha` = texto da resposta
  - `data_ultima_resposta` = data/hora da resposta

### 7. qualquer → opt_out
- **Gatilho:** Cliente pede para parar (a qualquer momento)
- **Campos atualizados:**
  - `opt_out` = `sim`
  - `opt_in` = `nao`
  - `status_contato` = `opt_out`
  - `resposta_ultima_campanha` = texto da resposta
  - `data_ultima_resposta` = data/hora da resposta

### 8. interessada → aguardando_atendimento
- **Gatilho:** Sistema identifica interesse e avisa você
- **Campos atualizados:**
  - `status_contato` = `aguardando_atendimento`
- **Ação:** Você recebe notificação para continuar manualmente

### 9. aguardando_atendimento → atendida
- **Gatilho:** Você atende a cliente (atualização manual ou via n8n)
- **Campos atualizados:**
  - `status_contato` = `atendida`

### 10. atendida → campanha_enviada (ciclo)
- **Gatilho:** Nova campanha enviada
- **Mesma lógica da transição 4**

### 11. sem_interesse → campanha_enviada (ciclo)
- **Gatilho:** Nova campanha enviada (respeitando intervalo mínimo)
- **Mesma lógica da transição 4**

---

## Regras de Proteção

1. **NUNCA enviar para `opt_out`** — esse é o estado final permanente
2. **NUNCA enviar para `sem_consentimento`** — precisa passar pelo opt-in primeiro
3. **NUNCA enviar campanha para `aguardando_resposta_optin`** — ainda não autorizou
4. **Respeitar intervalo mínimo de 7 dias** entre campanhas (filtro: `data_ultimo_envio < hoje - 7 dias`)
5. **Opt-out tem prioridade** sobre qualquer outro status
6. **Se a resposta for ambígua**, marcar `revisao_manual`, registrar resposta e não alterar opt-in/opt-out
7. **Número inválido (erro Meta 131026)**: marcar `numero_invalido` e nunca mais tentar
8. **Falha técnica**: incrementar `tentativas_envio`. Após 3 falhas consecutivas, mover para `falha_envio`
9. **Botão do template tem prioridade** sobre classificação por texto
10. **Janela de 24h**: mensagens livres (texto/PDF) só podem ser enviadas se a cliente respondeu nas últimas 24h. Fora disso, exige template aprovado.

---

## Status que podem receber campanha

| Status | Pode receber campanha? |
|--------|----------------------|
| `sem_consentimento` | NÃO |
| `aguardando_resposta_optin` | NÃO |
| `ativo` | SIM |
| `campanha_enviada` | NÃO (já recebeu) |
| `interessada` | NÃO (atender primeiro) |
| `sem_interesse` | SIM (respeitando intervalo de 7 dias) |
| `aguardando_atendimento` | NÃO |
| `atendida` | SIM |
| `opt_out` | NUNCA |
| `numero_invalido` | NUNCA |
| `falha_envio` | NÃO (revisar manualmente antes) |
| `revisao_manual` | NÃO (revisar antes) |
