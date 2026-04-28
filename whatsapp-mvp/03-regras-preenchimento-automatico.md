# 3. Regras de Preenchimento Automático dos Campos

## Princípio

Você só preenche 3 campos: `nome`, `telefone`, `segmento`.
Todos os outros são atualizados exclusivamente pelo sistema, com base em eventos reais.

---

## Tabela de Regras

### opt_in

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | vazio |
| Cliente responde SIM ao consentimento | vazio | `sim` |
| Cliente responde NÃO ao consentimento | vazio | `nao` |
| Cliente pede para sair (a qualquer momento) | `sim` | `nao` |

---

### data_opt_in

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | vazio |
| Cliente responde SIM ao consentimento | vazio | data/hora da resposta |
| Cliente responde NÃO | — | permanece vazio |

---

### ultima_campanha

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | vazio |
| Campanha enviada | qualquer | nome da campanha (ex: `promo_abril_01`) |

---

### data_ultimo_envio

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | vazio |
| Mensagem de opt-in enviada | vazio | data/hora do envio |
| Campanha enviada | qualquer | data/hora do envio |

---

### status_contato

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | `sem_consentimento` |
| Mensagem de opt-in enviada | `sem_consentimento` | `aguardando_resposta_optin` |
| Cliente responde SIM ao opt-in | `aguardando_resposta_optin` | `ativo` |
| Cliente responde NÃO ao opt-in | `aguardando_resposta_optin` | `opt_out` |
| Campanha enviada | `ativo` | `campanha_enviada` |
| Cliente responde com interesse | `campanha_enviada` | `interessada` |
| Cliente responde sem interesse | `campanha_enviada` | `sem_interesse` |
| Cliente pede para parar | qualquer | `opt_out` |
| Você atende a cliente | `interessada` | `aguardando_atendimento` |
| Atendimento concluído | `aguardando_atendimento` | `atendida` |
| Nova campanha para cliente já atendida | `atendida` | `campanha_enviada` |

---

### resposta_ultima_campanha

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | vazio |
| Campanha enviada | qualquer | vazio (limpa para nova campanha) |
| Cliente responde | vazio | texto da resposta |

---

### data_ultima_resposta

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | vazio |
| Cliente responde qualquer mensagem | qualquer | data/hora da resposta |

---

### interessado

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | vazio |
| Campanha enviada | qualquer | vazio (limpa para nova campanha) |
| Cliente responde com interesse | vazio | `sim` |
| Cliente responde sem interesse | vazio | `nao` |

---

### opt_out

| Evento | Valor anterior | Novo valor |
|--------|---------------|------------|
| Contato cadastrado | — | vazio |
| Cliente pede para parar (a qualquer momento) | vazio | `sim` |

**Regra crítica:** quando `opt_out = sim`, o sistema NUNCA mais envia mensagem para essa cliente.

---

## Palavras-chave para Classificação

> **Regra crítica:** a comparação é por **palavra inteira** (regex `\bpalavra\b`), nunca por `contains` simples.
> Motivo: `contains` para `"sim"` daria match em `"assim não"`, e `contains` para `"parar"` daria match em `"vou comparar"`. Isso causaria opt-out indevido e perda de cliente.

### Prioridade absoluta — botões do template
Quando a resposta vem de um botão do template (campos `button.payload` ou `interactive.button_reply.id`), use **exclusivamente** o payload do botão. É determinístico e não precisa de classificação por texto.

- payload `SIM` ou `OPTIN_SIM` → opt-in confirmado
- payload `NÃO` ou `OPTIN_NAO` → opt-out

### Resposta positiva (opt-in ou interesse)
Match por palavra inteira em `texto_lower.trim()`:
```
sim, s, quero, aceito, ok, claro, confirmo, pode mandar,
tenho interesse, me chama, quanto custa, preço, quero saber
```

### Resposta negativa (sem interesse, mas NÃO opt-out)
```
não, nao, n, agora não, agora nao, depois, sem interesse,
não preciso, nao preciso
```

### Resposta de opt-out (parar de receber definitivamente)
```
parar, sair, cancelar, pare, remove, remover, tirar,
não quero mais, nao quero mais, não manda mais, nao manda mais,
descadastrar, descadastra, stop, sair da lista
```

### Regra de prioridade (avaliar nesta ordem)
1. **Botão do template** → resolve direto, sem checar texto
2. **Opt-out** → se houver qualquer palavra de opt-out, é opt-out
3. **Negativo** → marca `sem_interesse` (mantém opt-in)
4. **Positivo** → marca `interessada` ou `ativo`
5. **Não classificável** → fallback: salvar resposta crua, manter status, marcar para revisão manual

---

## Campos que NUNCA são alterados pelo sistema

1. `nome` — só você muda
2. `telefone` — só você muda
3. `segmento` — só você muda
4. `observacoes` — só você muda
