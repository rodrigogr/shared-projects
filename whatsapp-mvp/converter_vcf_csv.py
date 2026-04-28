"""
Converte arquivo VCF do iCloud para CSV no formato da planilha Luz da Lua.
Colunas: nome, telefone, segmento, opt_in, data_opt_in, ultima_campanha,
         data_ultimo_envio, status_contato, resposta_ultima_campanha,
         data_ultima_resposta, interessado, opt_out, observacoes
"""

import re
import csv
import os

VCF_FILE = "vCards iCloud.vcf"
CSV_FILE = "contatos_importados.csv"

EMOJI_PATTERN = re.compile(
    "[\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002600-\U000027BF"
    "\U0001F900-\U0001F9FF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "]+",
    flags=re.UNICODE,
)


def tem_emoji(texto: str) -> bool:
    return bool(EMOJI_PATTERN.search(texto))


def limpar_telefone(tel: str) -> str:
    """Remove formatação e normaliza para 55XXXXXXXXXXX (formato WhatsApp Cloud API, sem '+')."""
    # Remove tudo que não é dígito
    tel = re.sub(r"\D", "", tel)

    # Lixo (números muito longos)
    if len(tel) > 15:
        return ""

    # Remove zero à esquerda eventual
    tel = tel.lstrip("0")

    # Já com código do país 55 + DDD + número (12 ou 13 dígitos)
    if tel.startswith("55") and len(tel) in (12, 13):
        return tel

    # Sem código do país (10 ou 11 dígitos): adiciona 55
    if len(tel) in (10, 11):
        return "55" + tel

    # Número inválido/incompleto
    return ""


def extrair_nome(fn: str) -> str:
    """Mantém o nome como está no contato."""
    return fn.strip()


def parsear_vcf(caminho: str):
    contatos = []
    nome = ""
    telefone = ""
    tel_atual = ""

    with open(caminho, encoding="utf-8") as f:
        for linha in f:
            linha = linha.rstrip("\n\r")

            if linha.startswith("FN:"):
                nome = linha[3:].strip()

            elif "TEL" in linha and ":" in linha:
                # Pega o valor após o último ":"
                valor = linha.split(":")[-1].strip()
                # Prioridade: tipo CELL ou pref — pega o primeiro encontrado
                if not tel_atual:
                    tel_atual = valor
                elif "type=CELL" in linha or "type=pref" in linha:
                    tel_atual = valor

            elif linha.startswith("END:VCARD"):
                telefone = limpar_telefone(tel_atual)
                if nome and telefone and tem_emoji(nome):
                    contatos.append({
                        "nome": extrair_nome(nome),
                        "telefone": telefone,
                        "segmento": "",
                        "opt_in": "",
                        "data_opt_in": "",
                        "ultima_campanha": "",
                        "data_ultimo_envio": "",
                        "status_contato": "sem_consentimento",
                        "resposta_ultima_campanha": "",
                        "data_ultima_resposta": "",
                        "interessado": "",
                        "opt_out": "",
                        "observacoes": "",
                        "texto_opt_in": "",
                        "versao_template_optin": "",
                        "tentativas_envio": 0,
                        "ultimo_erro": "",
                    })
                # Reset
                nome = ""
                tel_atual = ""

    return contatos


def salvar_csv(contatos, caminho: str):
    colunas = [
        "nome", "telefone", "segmento", "opt_in", "data_opt_in",
        "ultima_campanha", "data_ultimo_envio", "status_contato",
        "resposta_ultima_campanha", "data_ultima_resposta",
        "interessado", "opt_out", "observacoes",
        "texto_opt_in", "versao_template_optin",
        "tentativas_envio", "ultimo_erro",
    ]
    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=colunas)
        writer.writeheader()
        writer.writerows(contatos)


if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))
    vcf_path = os.path.join(base, VCF_FILE)
    csv_path = os.path.join(base, CSV_FILE)

    print(f"Lendo: {vcf_path}")
    contatos = parsear_vcf(vcf_path)

    # Remover duplicatas por telefone (mantém primeiro)
    vistos = set()
    unicos = []
    for c in contatos:
        if c["telefone"] not in vistos:
            vistos.add(c["telefone"])
            unicos.append(c)

    salvar_csv(unicos, csv_path)
    print(f"Contatos importados : {len(contatos)}")
    print(f"Após remover duplic.: {len(unicos)}")
    print(f"CSV salvo em: {csv_path}")
