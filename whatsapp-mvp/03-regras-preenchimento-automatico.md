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

### Resposta positiva (opt-in ou interesse)
```
sim, quero, pode, aceito, manda, ok, claro, tenho interesse,
me chama, quanto custa, preço, quero saber, confirmo
```

### Resposta negativa (sem interesse)
```
não, nao, agora não, agora nao, depois, sem interesse,
não preciso, nao preciso, tô bem, to bem
```

### Resposta de opt-out (parar de receber)
```
parar, sair, cancelar, não quero mais, nao quero mais,
pare, remove, remover, tirar, não manda mais, nao manda mais
```

### Regra de prioridade
Se a resposta contém palavra de opt-out, o opt-out tem prioridade sobre qualquer outra classificação.

---

## Campos que NUNCA são alterados pelo sistema

1. `nome` — só você muda
2. `telefone` — só você muda
3. `segmento` — só você muda
4. `observacoes` — só você muda
