# Engenharia de Dados — Guia Técnico Completo

> Conceitos, técnicas e boas práticas para engenharia de dados em ambiente corporativo Big Data.

---

## Índice

1. [Fundamentos de Engenharia de Dados](#1-fundamentos-de-engenharia-de-dados)
2. [Arquiteturas de Dados](#2-arquiteturas-de-dados)
3. [Modelagem de Dados](#3-modelagem-de-dados)
4. [ETL e ELT — Conceitos e Boas Práticas](#4-etl-e-elt--conceitos-e-boas-práticas)
5. [PySpark — Guia Completo](#5-pyspark--guia-completo)
6. [SQL Avançado para Engenharia de Dados](#6-sql-avançado-para-engenharia-de-dados)
7. [Apache Hive — Otimização e Boas Práticas](#7-apache-hive--otimização-e-boas-práticas)
8. [Oracle — Engenharia de Dados](#8-oracle--engenharia-de-dados)
9. [DB2 — Engenharia de Dados](#9-db2--engenharia-de-dados)
10. [Qualidade de Dados](#10-qualidade-de-dados)
11. [Governança de Dados](#11-governança-de-dados)
12. [Performance e Otimização](#12-performance-e-otimização)
13. [Orquestração de Pipelines](#13-orquestração-de-pipelines)
14. [Observabilidade e Monitoramento](#14-observabilidade-e-monitoramento)
15. [Segurança de Dados](#15-segurança-de-dados)
16. [Padrões de Projeto para Pipelines de Dados](#16-padrões-de-projeto-para-pipelines-de-dados)

---

## 1. Fundamentos de Engenharia de Dados

### 1.1 O que é Engenharia de Dados

Engenharia de dados é a disciplina responsável por **projetar, construir e manter** a infraestrutura e os pipelines que tornam os dados disponíveis, confiáveis e utilizáveis para análise, ciência de dados e inteligência artificial.

### 1.2 Responsabilidades do Engenheiro de Dados

| Responsabilidade | Descrição |
|---|---|
| **Ingestão** | Coletar dados de diversas fontes (APIs, bancos, arquivos, streaming) |
| **Transformação** | Limpar, enriquecer e padronizar dados |
| **Armazenamento** | Definir onde e como os dados serão persistidos |
| **Disponibilização** | Garantir que os dados estejam acessíveis para consumidores |
| **Monitoramento** | Acompanhar a saúde dos pipelines e qualidade dos dados |
| **Documentação** | Manter catálogo de dados e documentação técnica atualizados |

### 1.3 Ciclo de Vida dos Dados

```
Geração → Ingestão → Armazenamento → Transformação → Disponibilização → Consumo → Arquivamento/Descarte
```

### 1.4 Tipos de Processamento

| Tipo | Latência | Exemplo | Ferramenta |
|---|---|---|---|
| **Batch** | Horas/Minutos | ETL noturno de transações | PySpark, Hive |
| **Micro-batch** | Segundos/Minutos | Spark Structured Streaming | PySpark |
| **Streaming** | Milissegundos | Detecção de fraude em tempo real | Kafka + Spark Streaming |

---

## 2. Arquiteturas de Dados

### 2.1 Data Warehouse Tradicional

Banco de dados relacional otimizado para consultas analíticas (OLAP).

```
Fontes → ETL → Staging → Data Warehouse → Data Marts → BI/Relatórios
```

**Características:**
- Schema-on-write (esquema definido na carga)
- Dados estruturados
- Modelo dimensional (star/snowflake schema)
- Alta consistência e governança

### 2.2 Data Lake

Repositório centralizado que armazena dados brutos em qualquer formato.

```
Fontes → Ingestão → Raw Zone → Trusted Zone → Refined Zone → Consumo
```

**Camadas do Data Lake:**

| Camada | Sinônimo | Descrição | Formato |
|---|---|---|---|
| **Raw/Bronze** | Landing | Dados brutos, sem transformação | Parquet, JSON, CSV |
| **Trusted/Silver** | Curated | Dados limpos e padronizados | Parquet |
| **Refined/Gold** | Analytics | Dados agregados e prontos para consumo | Parquet, tabelas Hive |

**Boas Práticas:**
- Nunca alterar dados na camada Raw (imutabilidade)
- Particionar dados por data de ingestão
- Usar formatos colunares (Parquet, ORC)
- Manter metadados e catálogo atualizados
- Definir políticas de retenção por camada

### 2.3 Data Lakehouse

Combina a flexibilidade do Data Lake com as garantias ACID do Data Warehouse.

**Tecnologias:** Delta Lake, Apache Iceberg, Apache Hudi

**Benefícios:**
- Transações ACID sobre dados no lake
- Schema enforcement e schema evolution
- Time travel (versionamento de dados)
- Suporte a updates e deletes

### 2.4 Data Mesh

Arquitetura descentralizada onde cada domínio de negócio é dono dos seus dados.

**Princípios:**
1. **Propriedade por domínio** — cada equipe é dona dos seus dados
2. **Dados como produto** — tratar datasets como produtos com SLA
3. **Plataforma self-service** — infraestrutura de dados como serviço
4. **Governança federada** — políticas globais com autonomia local

### 2.5 Medallion Architecture (Detalhada)

```
┌─────────────────────────────────────────────────────────────┐
│                    MEDALLION ARCHITECTURE                     │
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │  BRONZE   │───▶│  SILVER   │───▶│   GOLD    │              │
│  │  (Raw)    │    │ (Curated) │    │(Business) │              │
│  └──────────┘    └──────────┘    └──────────┘               │
│                                                               │
│  - Dados brutos    - Limpeza       - Agregações              │
│  - Sem schema      - Dedup         - KPIs                    │
│  - Append-only     - Tipagem       - Métricas                │
│  - Auditoria       - Joins         - Modelos analíticos      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Modelagem de Dados

### 3.1 Modelagem Conceitual, Lógica e Física

| Nível | Foco | Ferramenta | Público |
|---|---|---|---|
| **Conceitual** | Entidades e relacionamentos de negócio | Diagrama ER | Negócio |
| **Lógico** | Atributos, tipos, chaves, normalização | Diagrama ER detalhado | Analistas |
| **Físico** | Tabelas, índices, partições, formatos | DDL | Engenheiros |

### 3.2 Normalização (OLTP)

| Forma Normal | Regra |
|---|---|
| **1FN** | Eliminar grupos repetitivos; cada célula contém um valor atômico |
| **2FN** | 1FN + todos os atributos não-chave dependem da chave primária inteira |
| **3FN** | 2FN + nenhum atributo não-chave depende de outro atributo não-chave |
| **BCNF** | 3FN + todo determinante é chave candidata |

### 3.3 Modelagem Dimensional (OLAP)

#### Star Schema

```
          ┌──────────────┐
          │  dim_cliente  │
          └──────┬───────┘
                 │
┌──────────┐    │    ┌──────────────┐
│dim_produto├────┼────┤  fato_venda   │
└──────────┘    │    └──────┬───────┘
                │           │
          ┌──────┴───────┐  │
          │  dim_tempo    │  │
          └──────────────┘  │
                            │
                   ┌────────┴──────┐
                   │  dim_loja     │
                   └───────────────┘
```

**Tabela Fato:**
- Contém métricas/medidas do negócio (valor_venda, quantidade)
- Chaves estrangeiras para dimensões
- Granularidade definida (cada linha = 1 transação)

**Tabela Dimensão:**
- Atributos descritivos (nome_cliente, categoria_produto)
- Surrogate key (chave artificial)
- Hierarquias (ano > trimestre > mês > dia)

#### Snowflake Schema

Star Schema com dimensões normalizadas. Reduz redundância mas aumenta joins.

#### Slowly Changing Dimensions (SCD)

| Tipo | Estratégia | Descrição |
|---|---|---|
| **SCD 0** | Retain original | Nunca atualiza |
| **SCD 1** | Overwrite | Sobrescreve o valor antigo |
| **SCD 2** | Add new row | Nova linha com validade (dt_inicio, dt_fim, fl_ativo) |
| **SCD 3** | Add new column | Coluna para valor atual e anterior |
| **SCD 4** | History table | Tabela separada para histórico |
| **SCD 6** | Hybrid (1+2+3) | Combina abordagens |

**Exemplo SCD Tipo 2 em PySpark:**

```python
from pyspark.sql import functions as F
from pyspark.sql.window import Window

# Identificar registros novos e alterados
df_changes = df_new.join(
    df_current.filter(F.col("fl_ativo") == 1),
    on="cd_cliente",
    how="left"
).filter(
    (F.col("current.nm_cliente") != F.col("new.nm_cliente")) |
    (F.col("current.cd_cliente").isNull())
)

# Fechar registros antigos
df_close = df_current.filter(F.col("fl_ativo") == 1).join(
    df_changes.select("cd_cliente"),
    on="cd_cliente",
    how="inner"
).withColumn("dt_fim", F.current_date()) \
 .withColumn("fl_ativo", F.lit(0))

# Abrir novos registros
df_open = df_changes.select(
    "cd_cliente", "nm_cliente", "ds_endereco"
).withColumn("dt_inicio", F.current_date()) \
 .withColumn("dt_fim", F.lit("9999-12-31").cast("date")) \
 .withColumn("fl_ativo", F.lit(1))
```

### 3.4 Data Vault

Modelagem orientada a auditoria e rastreabilidade.

| Componente | Descrição | Exemplo |
|---|---|---|
| **Hub** | Chave de negócio única | Hub_Cliente (cd_cpf) |
| **Link** | Relacionamento entre Hubs | Link_Cliente_Conta |
| **Satellite** | Atributos descritivos com historização | Sat_Cliente_Dados |

**Quando usar:**
- Ambientes com muitas fontes heterogêneas
- Necessidade forte de auditoria e rastreabilidade
- Requisitos regulatórios (BACEN, LGPD)

---

## 4. ETL e ELT — Conceitos e Boas Práticas

### 4.1 ETL vs. ELT

| Aspecto | ETL | ELT |
|---|---|---|
| **Ordem** | Extract → Transform → Load | Extract → Load → Transform |
| **Transformação** | Fora do destino (Spark, Python) | Dentro do destino (SQL, Spark) |
| **Quando usar** | Dados precisam ser limpos antes da carga | Data Lake com capacidade de processamento |
| **Performance** | Depende do engine de transformação | Aproveita poder do cluster |

### 4.2 Padrões de Ingestão

#### Full Load (Carga Completa)
```python
# Toda a tabela é lida e sobrescrita no destino
df = spark.read.format("jdbc") \
    .option("url", jdbc_url) \
    .option("dbtable", "schema.tabela_origem") \
    .load()

df.write.mode("overwrite") \
    .format("parquet") \
    .saveAsTable("db.tabela_destino")
```

#### Incremental Load (Carga Incremental)
```python
# Apenas registros novos ou alterados desde a última execução
dt_ultima_carga = spark.sql("""
    SELECT MAX(dt_atualizacao) as dt_ref 
    FROM db.controle_carga 
    WHERE nm_tabela = 'tabela_destino'
""").collect()[0]["dt_ref"]

df_incremental = spark.read.format("jdbc") \
    .option("url", jdbc_url) \
    .option("dbtable", f"""(
        SELECT * FROM schema.tabela_origem 
        WHERE dt_atualizacao > '{dt_ultima_carga}'
    ) t""") \
    .load()

# Merge (upsert)
df_incremental.createOrReplaceTempView("incremental")

spark.sql("""
    MERGE INTO db.tabela_destino AS target
    USING incremental AS source
    ON target.id = source.id
    WHEN MATCHED THEN UPDATE SET *
    WHEN NOT MATCHED THEN INSERT *
""")
```

#### CDC (Change Data Capture)
```
Fontes → Log de Mudanças → Ingestão → Processamento → Destino
         (INSERT/UPDATE/DELETE)
```

### 4.3 Boas Práticas de ETL

**Projeto:**
- Definir a granularidade do dado antes de iniciar
- Documentar o mapeamento fonte-destino (de-para)
- Definir SLA de execução e volumetria esperada
- Prever mecanismo de reprocessamento (idempotência)

**Implementação:**
- Tornar pipelines **idempotentes** (reexecutar não gera duplicatas)
- Implementar **checkpoints** para pipelines longos
- Usar **particionamento** para evitar full scans
- Separar lógica de negócio da lógica de infraestrutura
- Parametrizar datas e caminhos (nunca hardcode)

**Tratamento de Erros:**
- Implementar try/except com logging estruturado
- Criar tabela de **controle de execução** (log de cargas)
- Definir **dead letter queue** para registros com falha
- Alertas automáticos em caso de falha ou anomalia

**Exemplo — Controle de Execução:**

```python
from datetime import datetime
from pyspark.sql import Row

def registrar_execucao(spark, nm_pipeline, status, qt_registros, ds_erro=None):
    log = Row(
        nm_pipeline=nm_pipeline,
        dt_execucao=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ds_status=status,
        qt_registros=qt_registros,
        ds_erro=ds_erro
    )
    spark.createDataFrame([log]).write.mode("append") \
        .saveAsTable("db_controle.tb_log_execucao")
```

### 4.4 Padrões de Carga

| Padrão | Descrição | Uso |
|---|---|---|
| **Truncate & Load** | Limpa tabela e recarrega | Tabelas pequenas, dimensões |
| **Append** | Adiciona novos registros | Fatos, logs, eventos |
| **Upsert (Merge)** | Insere novos, atualiza existentes | Dimensões com SCD1 |
| **Partition Overwrite** | Sobrescreve partição específica | Fatos particionados por data |
| **Soft Delete** | Marca registro como inativo | Manter auditoria |

**Exemplo — Partition Overwrite:**

```python
df.write \
    .mode("overwrite") \
    .partitionBy("dt_referencia") \
    .format("parquet") \
    .option("partitionOverwriteMode", "dynamic") \
    .saveAsTable("db.fato_transacao")
```

---

## 5. PySpark — Guia Completo

### 5.1 Fundamentos

#### Arquitetura Spark

```
┌─────────────────────────────────────────────┐
│                DRIVER PROGRAM                │
│  ┌─────────────────────────────────────┐     │
│  │          SparkContext               │     │
│  │   (planeja, distribui, coordena)    │     │
│  └─────────────────────────────────────┘     │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Executor │ │Executor │ │Executor │
   │  ┌────┐ │ │  ┌────┐ │ │  ┌────┐ │
   │  │Task│ │ │  │Task│ │ │  │Task│ │
   │  └────┘ │ │  └────┘ │ │  └────┘ │
   │  ┌────┐ │ │  ┌────┐ │ │  ┌────┐ │
   │  │Task│ │ │  │Task│ │ │  │Task│ │
   │  └────┘ │ │  └────┘ │ │  └────┘ │
   └─────────┘ └─────────┘ └─────────┘
```

#### Conceitos Fundamentais

| Conceito | Descrição |
|---|---|
| **RDD** | Resilient Distributed Dataset — estrutura básica distribuída |
| **DataFrame** | RDD com schema (colunas tipadas) — API principal |
| **Dataset** | DataFrame com type-safety (Scala/Java) |
| **Transformation** | Operação lazy (não executa até uma action) |
| **Action** | Dispara a execução (collect, count, write, show) |
| **Partition** | Divisão física dos dados distribuídos entre executors |
| **Shuffle** | Redistribuição de dados entre partições (operação custosa) |
| **Catalyst** | Otimizador de queries do Spark SQL |
| **Tungsten** | Engine de execução otimizada para memória e CPU |

#### Lazy Evaluation

```python
# Transformações (lazy — não executam)
df_filtered = df.filter(F.col("valor") > 100)         # Transformation
df_grouped = df_filtered.groupBy("tipo").count()       # Transformation

# Ação (dispara toda a cadeia)
df_grouped.show()                                       # Action
```

### 5.2 Operações Essenciais

#### Leitura de Dados

```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *

spark = SparkSession.builder \
    .appName("ETL_Pipeline") \
    .enableHiveSupport() \
    .getOrCreate()

# Parquet
df = spark.read.parquet("/caminho/dados/")

# CSV
df = spark.read.option("header", True).option("sep", ";") \
    .option("encoding", "UTF-8").csv("/caminho/dados.csv")

# Tabela Hive
df = spark.table("database.tabela")

# JDBC (Oracle, DB2)
df = spark.read.format("jdbc") \
    .option("url", "jdbc:oracle:thin:@host:1521:SID") \
    .option("dbtable", "SCHEMA.TABELA") \
    .option("user", "usuario") \
    .option("password", "senha") \
    .option("fetchsize", "10000") \
    .option("numPartitions", "10") \
    .option("partitionColumn", "ID") \
    .option("lowerBound", "1") \
    .option("upperBound", "1000000") \
    .load()
```

#### Seleção e Filtros

```python
# Select
df.select("col1", "col2", F.col("col3").alias("nova_col"))

# Filter
df.filter(F.col("valor") > 100)
df.filter((F.col("tipo") == "A") & (F.col("status").isin(["ATIVO", "PENDENTE"])))
df.filter(F.col("nome").like("%BANCO%"))
df.filter(F.col("data").between("2025-01-01", "2025-12-31"))

# Where (sinônimo de filter)
df.where("valor > 100 AND tipo = 'A'")

# Distinct
df.select("tipo").distinct()

# Drop duplicates
df.dropDuplicates(["cd_cliente", "dt_referencia"])
```

#### Transformações de Colunas

```python
# Criar/modificar coluna
df.withColumn("valor_com_taxa", F.col("valor") * 1.05)
df.withColumn("nm_upper", F.upper(F.col("nome")))
df.withColumn("dt_processamento", F.current_timestamp())

# Cast
df.withColumn("valor", F.col("valor").cast("double"))
df.withColumn("data", F.to_date(F.col("data_str"), "dd/MM/yyyy"))

# Condicional
df.withColumn("faixa", 
    F.when(F.col("idade") < 18, "MENOR")
     .when(F.col("idade") < 60, "ADULTO")
     .otherwise("IDOSO")
)

# Regexp
df.withColumn("cpf_limpo", F.regexp_replace(F.col("cpf"), "[^0-9]", ""))
df.withColumn("dominio_email", F.regexp_extract(F.col("email"), r"@(.+)$", 1))

# Null handling
df.withColumn("valor", F.coalesce(F.col("valor"), F.lit(0)))
df.na.fill({"valor": 0, "nome": "DESCONHECIDO"})
df.na.drop(subset=["cd_cliente"])

# Renomear
df.withColumnRenamed("old_name", "new_name")

# Drop
df.drop("coluna_desnecessaria")
```

#### Joins

```python
# Inner join
df_result = df_fato.join(df_dim, on="cd_cliente", how="inner")

# Left join com condição complexa
df_result = df_a.join(
    df_b,
    on=(df_a["cd_chave"] == df_b["cd_chave"]) & 
       (df_a["dt_ref"] == df_b["dt_ref"]),
    how="left"
)

# Anti join (registros em A que NÃO estão em B)
df_novos = df_staging.join(df_destino, on="cd_chave", how="left_anti")

# Semi join (registros em A que ESTÃO em B, sem colunas de B)
df_existentes = df_staging.join(df_destino, on="cd_chave", how="left_semi")

# Cross join (produto cartesiano — CUIDADO com volume)
df_cross = df_a.crossJoin(df_b)

# Broadcast join (tabela pequena)
from pyspark.sql.functions import broadcast
df_result = df_grande.join(broadcast(df_pequena), on="cd_chave")
```

#### Agregações

```python
# GroupBy
df.groupBy("tipo", "status").agg(
    F.count("*").alias("qt_registros"),
    F.sum("valor").alias("vl_total"),
    F.avg("valor").alias("vl_medio"),
    F.min("valor").alias("vl_minimo"),
    F.max("valor").alias("vl_maximo"),
    F.countDistinct("cd_cliente").alias("qt_clientes"),
    F.stddev("valor").alias("vl_desvio_padrao"),
    F.percentile_approx("valor", 0.5).alias("vl_mediana")
)

# Pivot
df.groupBy("ano").pivot("mes", ["01","02","03"]).sum("valor")

# Rollup (subtotais hierárquicos)
df.rollup("regiao", "estado").sum("valor")

# Cube (todas as combinações)
df.cube("regiao", "estado").sum("valor")
```

#### Window Functions

```python
from pyspark.sql.window import Window

# Definir janela
window_cliente = Window.partitionBy("cd_cliente").orderBy(F.desc("dt_transacao"))

# Row number
df.withColumn("rn", F.row_number().over(window_cliente))

# Rank (empate = mesmo rank, pula posição)
df.withColumn("rank", F.rank().over(window_cliente))

# Dense rank (empate = mesmo rank, não pula)
df.withColumn("dense_rank", F.dense_rank().over(window_cliente))

# Lead / Lag
df.withColumn("prox_valor", F.lead("valor", 1).over(window_cliente))
df.withColumn("valor_anterior", F.lag("valor", 1).over(window_cliente))

# Running total
window_running = Window.partitionBy("cd_cliente") \
    .orderBy("dt_transacao") \
    .rowsBetween(Window.unboundedPreceding, Window.currentRow)

df.withColumn("saldo_acumulado", F.sum("valor").over(window_running))

# Moving average (últimos 3 registros)
window_ma = Window.partitionBy("cd_cliente") \
    .orderBy("dt_transacao") \
    .rowsBetween(-2, 0)

df.withColumn("media_movel_3", F.avg("valor").over(window_ma))

# Primeiro e último valor da janela
window_full = Window.partitionBy("cd_cliente") \
    .orderBy("dt_transacao") \
    .rowsBetween(Window.unboundedPreceding, Window.unboundedFollowing)

df.withColumn("primeiro_valor", F.first("valor").over(window_full))
df.withColumn("ultimo_valor", F.last("valor").over(window_full))
```

### 5.3 Boas Práticas PySpark

#### Performance

```python
# ✅ BOM: Filtrar cedo (pushdown predicate)
df = spark.table("db.tabela").filter(F.col("dt_ref") == "2025-01-01")

# ❌ RUIM: Carregar tudo e filtrar depois
df = spark.table("db.tabela")
df_filtered = df.filter(F.col("dt_ref") == "2025-01-01")  # tudo já em memória

# ✅ BOM: Selecionar apenas colunas necessárias
df.select("col1", "col2", "col3")

# ❌ RUIM: Usar select(*)
df.select("*")

# ✅ BOM: Usar broadcast para tabelas pequenas (< 10MB)
df_result = df_grande.join(broadcast(df_pequena), "chave")

# ✅ BOM: Repartition antes de operações pesadas
df.repartition(200, "cd_cliente")

# ✅ BOM: Coalesce para reduzir partições na escrita
df.coalesce(10).write.parquet("/caminho/saida")

# ✅ BOM: Cache apenas quando DataFrame é reutilizado
df_base = spark.table("db.tabela_grande").filter(...).cache()
df_agg1 = df_base.groupBy("tipo").count()
df_agg2 = df_base.groupBy("status").sum("valor")
df_base.unpersist()  # Liberar memória após uso

# ❌ RUIM: Cache de tudo indiscriminadamente
```

#### Evitar Operações Custosas

```python
# ❌ EVITAR: collect() em DataFrames grandes
todos_dados = df.collect()  # Traz tudo para o Driver — pode estourar memória

# ✅ ALTERNATIVA: Usar take(), head() ou limit()
amostra = df.take(100)
df.limit(100).show()

# ❌ EVITAR: UDFs quando há função nativa
@F.udf(StringType())
def upper_custom(s):
    return s.upper() if s else None  # UDF serializa e é lento

# ✅ USAR: Funções nativas (executam em Tungsten, otimizadas)
df.withColumn("nome_upper", F.upper(F.col("nome")))

# ❌ EVITAR: iteração linha a linha
for row in df.collect():
    process(row)

# ✅ USAR: Operações vetorizadas
df.withColumn("resultado", F.col("a") + F.col("b"))
```

#### Schemas Explícitos

```python
# ✅ BOM: Definir schema explicitamente (evita inferência)
schema = StructType([
    StructField("cd_cliente", StringType(), False),
    StructField("nm_cliente", StringType(), True),
    StructField("dt_nascimento", DateType(), True),
    StructField("vl_renda", DecimalType(15, 2), True),
    StructField("qt_dependentes", IntegerType(), True),
])

df = spark.read.schema(schema).parquet("/caminho/dados/")

# ❌ RUIM: Deixar Spark inferir (lê dados duas vezes)
df = spark.read.option("inferSchema", True).csv("/caminho/dados.csv")
```

#### Convenções de Nomenclatura

```
Tabelas:    db_dominio.tb_nome_tabela
Colunas:    cd_ (código), nm_ (nome), dt_ (data), vl_ (valor), 
            qt_ (quantidade), fl_ (flag), ds_ (descrição), sg_ (sigla)
Views:      db_dominio.vw_nome_view
Temporárias: tmp_nome_descritivo
```

### 5.4 Spark SQL

```python
# Registrar DataFrame como view temporária
df.createOrReplaceTempView("transacoes")

# Usar SQL
resultado = spark.sql("""
    SELECT 
        cd_cliente,
        SUM(vl_transacao) as vl_total,
        COUNT(*) as qt_transacoes,
        AVG(vl_transacao) as vl_medio
    FROM transacoes
    WHERE dt_transacao >= '2025-01-01'
    GROUP BY cd_cliente
    HAVING COUNT(*) >= 5
    ORDER BY vl_total DESC
""")

# CTAS (Create Table As Select)
spark.sql("""
    CREATE TABLE IF NOT EXISTS db.nova_tabela
    USING parquet
    PARTITIONED BY (dt_referencia)
    AS SELECT * FROM transacoes
""")
```

### 5.5 Spark Structured Streaming (Micro-batch)

```python
# Ler stream de arquivos
df_stream = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 100) \
    .parquet("/caminho/landing/")

# Transformações (mesma API do batch)
df_transformed = df_stream \
    .filter(F.col("status") == "ATIVO") \
    .withColumn("dt_processamento", F.current_timestamp())

# Escrever stream
query = df_transformed.writeStream \
    .format("parquet") \
    .option("path", "/caminho/destino/") \
    .option("checkpointLocation", "/caminho/checkpoint/") \
    .trigger(processingTime="5 minutes") \
    .start()
```

---

## 6. SQL Avançado para Engenharia de Dados

### 6.1 CTEs (Common Table Expressions)

```sql
WITH clientes_ativos AS (
    SELECT cd_cliente, nm_cliente, vl_renda
    FROM db.tb_cliente
    WHERE fl_ativo = 1
),
transacoes_mes AS (
    SELECT cd_cliente, SUM(vl_transacao) as vl_total
    FROM db.tb_transacao
    WHERE dt_transacao BETWEEN '2025-01-01' AND '2025-01-31'
    GROUP BY cd_cliente
)
SELECT 
    c.cd_cliente,
    c.nm_cliente,
    c.vl_renda,
    COALESCE(t.vl_total, 0) as vl_total_mes
FROM clientes_ativos c
LEFT JOIN transacoes_mes t ON c.cd_cliente = t.cd_cliente
```

### 6.2 Window Functions em SQL

```sql
SELECT 
    cd_cliente,
    dt_transacao,
    vl_transacao,
    ROW_NUMBER() OVER (PARTITION BY cd_cliente ORDER BY dt_transacao DESC) as rn,
    SUM(vl_transacao) OVER (
        PARTITION BY cd_cliente 
        ORDER BY dt_transacao 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as saldo_acumulado,
    LAG(vl_transacao, 1) OVER (PARTITION BY cd_cliente ORDER BY dt_transacao) as vl_anterior,
    AVG(vl_transacao) OVER (
        PARTITION BY cd_cliente 
        ORDER BY dt_transacao 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as media_movel_3
FROM db.tb_transacao
```

### 6.3 MERGE (Upsert)

```sql
-- Hive (Spark SQL) 
MERGE INTO db.tb_destino AS target
USING db.tb_staging AS source
ON target.cd_chave = source.cd_chave
WHEN MATCHED AND source.dt_atualizacao > target.dt_atualizacao THEN
    UPDATE SET 
        target.nm_campo = source.nm_campo,
        target.dt_atualizacao = source.dt_atualizacao
WHEN NOT MATCHED THEN
    INSERT (cd_chave, nm_campo, dt_atualizacao)
    VALUES (source.cd_chave, source.nm_campo, source.dt_atualizacao)
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
```

### 6.4 Lateral View / Explode (Hive/Spark SQL)

```sql
-- Explodir arrays
SELECT cd_cliente, produto
FROM db.tb_carrinho
LATERAL VIEW EXPLODE(ar_produtos) t AS produto

-- Explodir maps
SELECT cd_cliente, chave, valor
FROM db.tb_atributos
LATERAL VIEW EXPLODE(mp_atributos) t AS chave, valor
```

### 6.5 Recursive CTEs (Oracle/DB2)

```sql
-- Oracle: hierarquia organizacional
WITH org_hierarchy AS (
    SELECT cd_funcionario, nm_funcionario, cd_gestor, 1 as nivel
    FROM tb_funcionario
    WHERE cd_gestor IS NULL  -- raiz
    
    UNION ALL
    
    SELECT f.cd_funcionario, f.nm_funcionario, f.cd_gestor, h.nivel + 1
    FROM tb_funcionario f
    INNER JOIN org_hierarchy h ON f.cd_gestor = h.cd_funcionario
)
SELECT * FROM org_hierarchy ORDER BY nivel, cd_funcionario
```

---

## 7. Apache Hive — Otimização e Boas Práticas

### 7.1 Formatos de Arquivo

| Formato | Tipo | Compressão | Leitura | Escrita | Uso |
|---|---|---|---|---|---|
| **Parquet** | Colunar | Snappy, Gzip | Rápida | Média | Analítico (padrão recomendado) |
| **ORC** | Colunar | Zlib, Snappy | Rápida | Média | Hive nativo |
| **Avro** | Linha | Deflate, Snappy | Média | Rápida | Schema evolution |
| **CSV/Text** | Linha | Gzip | Lenta | Rápida | Interoperabilidade |
| **JSON** | Semi-estruturado | Gzip | Lenta | Rápida | APIs, logs |

**Recomendação:** Use **Parquet com compressão Snappy** como padrão.

### 7.2 Particionamento

```sql
-- Criar tabela particionada
CREATE TABLE db.tb_transacao (
    cd_cliente STRING,
    vl_transacao DECIMAL(15,2),
    ds_tipo STRING
)
PARTITIONED BY (dt_referencia STRING)
STORED AS PARQUET;

-- Inserir com partição dinâmica
SET hive.exec.dynamic.partition = true;
SET hive.exec.dynamic.partition.mode = nonstrict;

INSERT OVERWRITE TABLE db.tb_transacao PARTITION (dt_referencia)
SELECT cd_cliente, vl_transacao, ds_tipo, dt_referencia
FROM db.tb_staging;
```

**Boas Práticas de Particionamento:**
- Particionar por colunas frequentemente usadas em filtros (data é o mais comum)
- Evitar partições com poucos registros (< 128MB) — **small files problem**
- Evitar muitas partições (> 10.000) — overhead no metastore
- Partições ideais: 128MB a 1GB por partição
- Combinar partições: `dt_ano/dt_mes` em vez de `dt_dia` se volume diário for pequeno

### 7.3 Bucketing

```sql
-- Bucketing para otimizar joins entre tabelas grandes
CREATE TABLE db.tb_transacao_bucketed (
    cd_cliente STRING,
    vl_transacao DECIMAL(15,2),
    dt_transacao DATE
)
CLUSTERED BY (cd_cliente) SORTED BY (dt_transacao) INTO 256 BUCKETS
STORED AS PARQUET;
```

**Quando usar bucketing:**
- Joins frequentes entre duas tabelas na mesma coluna
- Ambas as tabelas devem ter o mesmo número de buckets
- Evita shuffle no join (sort-merge bucket join)

### 7.4 Configurações de Performance

```sql
-- Execução com Tez (mais rápido que MapReduce)
SET hive.execution.engine = tez;

-- Otimizações de Join
SET hive.auto.convert.join = true;                        -- Auto broadcast join
SET hive.mapjoin.smalltable.filesize = 25000000;         -- Threshold 25MB
SET hive.optimize.skewjoin = true;                        -- Tratar skew

-- Otimizações de Arquivo
SET hive.merge.mapfiles = true;                           -- Merge small files
SET hive.merge.mapredfiles = true;
SET hive.merge.smallfiles.avgsize = 134217728;           -- 128MB

-- Vetorização
SET hive.vectorized.execution.enabled = true;
SET hive.vectorized.execution.reduce.enabled = true;

-- Compressão
SET hive.exec.compress.output = true;
SET mapreduce.output.fileoutputformat.compress.codec = org.apache.hadoop.io.compress.SnappyCodec;

-- CBO (Cost Based Optimizer)
SET hive.cbo.enable = true;
SET hive.compute.query.using.stats = true;
SET hive.stats.fetch.column.stats = true;

-- Coletar estatísticas (essencial para CBO)
ANALYZE TABLE db.tb_transacao COMPUTE STATISTICS;
ANALYZE TABLE db.tb_transacao COMPUTE STATISTICS FOR COLUMNS;
```

### 7.5 Small Files Problem

Muitos arquivos pequenos degradam performance do HDFS e Hive.

**Causas:**
- Partições com poucos registros
- Muitas tarefas de escrita paralelas
- Append frequente sem compactação

**Soluções:**

```python
# PySpark: controlar número de arquivos na escrita
df.coalesce(1).write.mode("overwrite") \
    .partitionBy("dt_referencia") \
    .parquet("/caminho/destino/")

# Compactação de partição existente
df = spark.read.parquet("/caminho/destino/dt_referencia=2025-01-01")
df.coalesce(1).write.mode("overwrite") \
    .parquet("/caminho/destino/dt_referencia=2025-01-01")
```

```sql
-- Hive: concatenar arquivos pequenos
ALTER TABLE db.tb_transacao PARTITION (dt_referencia='2025-01-01') CONCATENATE;
```

---

## 8. Oracle — Engenharia de Dados

### 8.1 Conectividade PySpark ↔ Oracle

```python
# Leitura com particionamento paralelo
df_oracle = spark.read.format("jdbc") \
    .option("url", "jdbc:oracle:thin:@//host:1521/service") \
    .option("dbtable", "SCHEMA.TABELA") \
    .option("user", usuario) \
    .option("password", senha) \
    .option("driver", "oracle.jdbc.driver.OracleDriver") \
    .option("fetchsize", "50000") \
    .option("numPartitions", "20") \
    .option("partitionColumn", "ROWID_NUM") \
    .option("lowerBound", "1") \
    .option("upperBound", "10000000") \
    .load()

# Usar subquery para otimizar
df_oracle = spark.read.format("jdbc") \
    .option("url", jdbc_url) \
    .option("dbtable", """(
        SELECT /*+ PARALLEL(8) */ 
            cd_cliente, nm_cliente, vl_saldo, dt_atualizacao
        FROM SCHEMA.TB_CLIENTE
        WHERE dt_atualizacao >= TRUNC(SYSDATE) - 7
    ) subquery""") \
    .option("fetchsize", "50000") \
    .load()
```

### 8.2 Hints e Otimização Oracle

```sql
-- Parallel query
SELECT /*+ PARALLEL(t, 8) */ * FROM TB_TRANSACAO t;

-- Force index
SELECT /*+ INDEX(t IDX_TRANSACAO_DT) */ * FROM TB_TRANSACAO t WHERE dt_transacao > SYSDATE - 30;

-- Hash join (quando não há índice)
SELECT /*+ USE_HASH(a b) */ a.*, b.nm_produto
FROM TB_VENDA a, TB_PRODUTO b
WHERE a.cd_produto = b.cd_produto;

-- Materialized views para agregações frequentes
CREATE MATERIALIZED VIEW MV_VENDAS_MENSAL
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT cd_produto, TRUNC(dt_venda, 'MM') as dt_mes, SUM(vl_venda) as vl_total
FROM TB_VENDA
GROUP BY cd_produto, TRUNC(dt_venda, 'MM');
```

### 8.3 Particionamento Oracle

```sql
-- Range partition (por data)
CREATE TABLE TB_TRANSACAO (
    cd_transacao NUMBER,
    cd_cliente NUMBER,
    vl_transacao NUMBER(15,2),
    dt_transacao DATE
)
PARTITION BY RANGE (dt_transacao) (
    PARTITION p_2024 VALUES LESS THAN (DATE '2025-01-01'),
    PARTITION p_2025_q1 VALUES LESS THAN (DATE '2025-04-01'),
    PARTITION p_2025_q2 VALUES LESS THAN (DATE '2025-07-01'),
    PARTITION p_max VALUES LESS THAN (MAXVALUE)
);

-- Partition pruning automático
SELECT * FROM TB_TRANSACAO
WHERE dt_transacao BETWEEN DATE '2025-01-01' AND DATE '2025-03-31';
-- Acessa apenas a partição p_2025_q1
```

---

## 9. DB2 — Engenharia de Dados

### 9.1 Conectividade PySpark ↔ DB2

```python
df_db2 = spark.read.format("jdbc") \
    .option("url", "jdbc:db2://host:50000/database") \
    .option("dbtable", "SCHEMA.TABELA") \
    .option("user", usuario) \
    .option("password", senha) \
    .option("driver", "com.ibm.db2.jcc.DB2Driver") \
    .option("fetchsize", "50000") \
    .option("numPartitions", "10") \
    .option("partitionColumn", "ID") \
    .option("lowerBound", "1") \
    .option("upperBound", "5000000") \
    .load()
```

### 9.2 Otimizações DB2

```sql
-- Runstats (equivalente ao ANALYZE do Oracle/Hive)
RUNSTATS ON TABLE SCHEMA.TABELA WITH DISTRIBUTION AND DETAILED INDEXES ALL;

-- Reorg (reorganizar tabela)
REORG TABLE SCHEMA.TABELA;

-- MQT (Materialized Query Table — similar a Materialized View)
CREATE TABLE MQT_VENDAS_MENSAL AS (
    SELECT cd_produto, YEAR(dt_venda) as ano, MONTH(dt_venda) as mes, SUM(vl_venda) as vl_total
    FROM SCHEMA.TB_VENDA
    GROUP BY cd_produto, YEAR(dt_venda), MONTH(dt_venda)
) DATA INITIALLY DEFERRED REFRESH DEFERRED;

REFRESH TABLE MQT_VENDAS_MENSAL;

-- Range partition
CREATE TABLE SCHEMA.TB_TRANSACAO (
    cd_transacao BIGINT NOT NULL,
    cd_cliente BIGINT,
    vl_transacao DECIMAL(15,2),
    dt_transacao DATE
)
PARTITION BY RANGE (dt_transacao) (
    STARTING '2024-01-01' ENDING '2024-12-31',
    STARTING '2025-01-01' ENDING '2025-12-31'
);

-- Compression
ALTER TABLE SCHEMA.TB_TRANSACAO COMPRESS YES;
REORG TABLE SCHEMA.TB_TRANSACAO;
```

### 9.3 Diferenças SQL entre Hive, Oracle e DB2

| Operação | Hive/Spark SQL | Oracle | DB2 |
|---|---|---|---|
| Data atual | `current_date()` | `SYSDATE` / `CURRENT_DATE` | `CURRENT DATE` |
| Timestamp atual | `current_timestamp()` | `SYSTIMESTAMP` | `CURRENT TIMESTAMP` |
| Concatenar | `concat(a, b)` | `a \|\| b` | `a \|\| b` / `CONCAT(a,b)` |
| Substring | `substr(col, 1, 5)` | `SUBSTR(col, 1, 5)` | `SUBSTR(col, 1, 5)` |
| NVL | `coalesce(a, b)` | `NVL(a, b)` | `COALESCE(a, b)` |
| LIMIT | `LIMIT 100` | `FETCH FIRST 100 ROWS ONLY` / `ROWNUM` | `FETCH FIRST 100 ROWS ONLY` |
| MERGE | `MERGE INTO ... USING` | `MERGE INTO ... USING` | `MERGE INTO ... USING` |
| String → Date | `to_date(s, 'yyyy-MM-dd')` | `TO_DATE(s, 'YYYY-MM-DD')` | `DATE(s)` |
| IDENTITY | Não nativo | `GENERATED ALWAYS AS IDENTITY` | `GENERATED ALWAYS AS IDENTITY` |
| CTAS | `CREATE TABLE t AS SELECT` | `CREATE TABLE t AS SELECT` | `CREATE TABLE t AS (SELECT ...) WITH DATA` |

---

## 10. Qualidade de Dados

### 10.1 Dimensões da Qualidade

| Dimensão | Descrição | Exemplo de Validação |
|---|---|---|
| **Completude** | Dados não nulos onde esperado | `% de CPFs preenchidos` |
| **Unicidade** | Sem duplicatas em chaves | `COUNT(DISTINCT pk) == COUNT(*)` |
| **Validade** | Dados dentro do domínio esperado | `Idade entre 0 e 150` |
| **Consistência** | Coerência entre datasets | `Saldo = créditos - débitos` |
| **Acurácia** | Dados representam a realidade | Validação com fonte oficial |
| **Tempestividade** | Dados atualizados no prazo | `MAX(dt_atualização) >= D-1` |

### 10.2 Framework de Validação em PySpark

```python
class DataQualityChecker:
    """Framework simples de validação de qualidade de dados."""
    
    def __init__(self, df, nome_tabela):
        self.df = df
        self.nome = nome_tabela
        self.resultados = []
    
    def check_completude(self, colunas, threshold=0.95):
        """Verifica se colunas têm pelo menos threshold% de dados preenchidos."""
        total = self.df.count()
        for col in colunas:
            nulos = self.df.filter(F.col(col).isNull() | (F.trim(F.col(col)) == "")).count()
            taxa = 1 - (nulos / total) if total > 0 else 0
            status = "OK" if taxa >= threshold else "FALHA"
            self.resultados.append({
                "tabela": self.nome, "check": "completude",
                "coluna": col, "valor": round(taxa, 4), "status": status
            })
    
    def check_unicidade(self, colunas_pk):
        """Verifica unicidade da chave primária."""
        total = self.df.count()
        distintos = self.df.select(colunas_pk).distinct().count()
        status = "OK" if total == distintos else "FALHA"
        self.resultados.append({
            "tabela": self.nome, "check": "unicidade",
            "coluna": str(colunas_pk), "valor": f"{distintos}/{total}", "status": status
        })
    
    def check_intervalo(self, coluna, min_val, max_val):
        """Verifica se valores estão dentro do intervalo esperado."""
        fora = self.df.filter(
            (F.col(coluna) < min_val) | (F.col(coluna) > max_val)
        ).count()
        status = "OK" if fora == 0 else "FALHA"
        self.resultados.append({
            "tabela": self.nome, "check": "intervalo",
            "coluna": coluna, "valor": f"{fora} fora do range", "status": status
        })
    
    def check_referencial(self, coluna, df_referencia, coluna_ref):
        """Verifica integridade referencial."""
        orfaos = self.df.join(
            df_referencia.select(F.col(coluna_ref).alias(coluna)),
            on=coluna, how="left_anti"
        ).count()
        status = "OK" if orfaos == 0 else "FALHA"
        self.resultados.append({
            "tabela": self.nome, "check": "referencial",
            "coluna": coluna, "valor": f"{orfaos} órfãos", "status": status
        })
    
    def report(self):
        return spark.createDataFrame(self.resultados)

# Uso
dq = DataQualityChecker(df_clientes, "tb_cliente")
dq.check_completude(["cd_cpf", "nm_cliente", "dt_nascimento"])
dq.check_unicidade(["cd_cpf"])
dq.check_intervalo("vl_renda", 0, 10000000)
dq.check_referencial("cd_agencia", df_agencias, "cd_agencia")
df_report = dq.report()
df_report.show()
```

### 10.3 Testes de Dados

```python
# Assertions em pipeline ETL
def validar_carga(df, nome, min_registros=1000):
    """Validações mínimas pós-carga."""
    count = df.count()
    assert count >= min_registros, \
        f"[{nome}] Registros insuficientes: {count} < {min_registros}"
    
    assert df.select("cd_chave").distinct().count() == count, \
        f"[{nome}] Chave primária com duplicatas"
    
    nulls = df.filter(F.col("cd_chave").isNull()).count()
    assert nulls == 0, \
        f"[{nome}] Chave primária com nulos: {nulls}"
    
    print(f"[{nome}] Validação OK — {count} registros")
```

---

## 11. Governança de Dados

### 11.1 Pilares

| Pilar | Descrição |
|---|---|
| **Catálogo de Dados** | Inventário de todos os datasets com metadados |
| **Linhagem (Lineage)** | Rastreamento da origem e transformações dos dados |
| **Classificação** | Categorização por sensibilidade (público, interno, confidencial, secreto) |
| **Ownership** | Definição de responsáveis por cada dataset |
| **Políticas de Acesso** | Quem pode ler/escrever o quê |
| **Retenção** | Tempo de armazenamento e descarte |
| **LGPD/Compliance** | Conformidade com regulamentações |

### 11.2 LGPD — Aspectos Técnicos

```python
# Anonimização com hash
df.withColumn("cd_cpf_hash", F.sha2(F.col("cd_cpf"), 256))

# Pseudonimização (mapeamento reversível com chave)
df.withColumn("cd_cpf_pseudo", 
    F.sha2(F.concat(F.col("cd_cpf"), F.lit("CHAVE_SECRETA")), 256))

# Mascaramento
df.withColumn("cd_cpf_masked", 
    F.concat(F.lit("***.***."), F.substring("cd_cpf", 8, 3), F.lit("-**")))

# Generalização (reduzir granularidade)
df.withColumn("faixa_idade", 
    F.when(F.col("idade") < 30, "18-29")
     .when(F.col("idade") < 50, "30-49")
     .otherwise("50+"))
```

### 11.3 Documentação de Pipeline

```python
# Metadados do pipeline como constantes
PIPELINE_METADATA = {
    "nome": "ETL_TRANSACOES_DIARIAS",
    "descricao": "Ingestão diária de transações do sistema transacional para o Data Lake",
    "owner": "equipe-engenharia-dados",
    "fonte": "ORACLE.TRANSACIONAL.TB_TRANSACAO",
    "destino": "HIVE.DL_REFINED.TB_FATO_TRANSACAO",
    "frequencia": "Diária (D-1)",
    "sla": "06:00 AM",
    "dependencias": ["ETL_CLIENTES", "ETL_PRODUTOS"],
    "volumetria_media": "5M registros/dia",
    "contato": "nome@bb.com.br",
}
```

---

## 12. Performance e Otimização

### 12.1 Diagnóstico de Performance no Spark

```python
# Ver plano de execução
df.explain(True)  # mostra parsed, analyzed, optimized e physical plan

# Verificar partições
print(f"Partições: {df.rdd.getNumPartitions()}")

# Verificar skew (desbalanceamento)
df.groupBy(F.spark_partition_id().alias("partition_id")) \
    .count() \
    .orderBy(F.desc("count")) \
    .show()
```

### 12.2 Data Skew

Quando uma ou poucas partições têm muito mais dados que as outras.

```python
# Detectar skew
df.groupBy("cd_chave_join").count() \
    .orderBy(F.desc("count")) \
    .show(20)

# Solução 1: Salting
salt_range = 10
df_grande = df_grande.withColumn("salt", (F.rand() * salt_range).cast("int"))
df_grande = df_grande.withColumn(
    "cd_chave_salted", F.concat(F.col("cd_chave"), F.lit("_"), F.col("salt"))
)

df_pequena_exploded = df_pequena.crossJoin(
    spark.range(salt_range).withColumnRenamed("id", "salt")
).withColumn(
    "cd_chave_salted", F.concat(F.col("cd_chave"), F.lit("_"), F.col("salt"))
)

df_result = df_grande.join(df_pequena_exploded, "cd_chave_salted")

# Solução 2: Broadcast se uma tabela cabe em memória
df_result = df_grande.join(broadcast(df_pequena), "cd_chave")

# Solução 3: AQE (Adaptive Query Execution) — Spark 3.x
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

### 12.3 Tuning de Configurações Spark

```python
# Memória e paralelismo
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.sql.shuffle.partitions", "200")  # Ajustar ao volume

# AQE (Spark 3.x) — otimiza em runtime
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Broadcast threshold
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "50MB")

# Compressão
spark.conf.set("spark.sql.parquet.compression.codec", "snappy")

# Predicate pushdown
spark.conf.set("spark.sql.parquet.filterPushdown", "true")
spark.conf.set("spark.sql.hive.metastorePartitionPruning", "true")
```

### 12.4 Regras de Ouro de Performance

| Regra | Impacto |
|---|---|
| Filtrar cedo (predicate pushdown) | Alto |
| Selecionar apenas colunas necessárias | Alto |
| Usar formato colunar (Parquet) | Alto |
| Broadcast join para tabelas < 50MB | Alto |
| Particionar por coluna de filtro frequente | Alto |
| Evitar UDFs — usar funções nativas | Médio-Alto |
| Evitar collect() em datasets grandes | Alto |
| Cachear DataFrames reutilizados | Médio |
| Reparticionar antes de joins pesados | Médio |
| AQE habilitado (Spark 3.x) | Médio |
| Coalesce antes de escrita | Médio |
| ANALYZE TABLE para estatísticas CBO | Médio |

---

## 13. Orquestração de Pipelines

### 13.1 Conceitos

| Conceito | Descrição |
|---|---|
| **DAG** | Directed Acyclic Graph — grafo de dependências do pipeline |
| **Task** | Unidade de trabalho (ex: uma etapa do ETL) |
| **Dependência** | Task B depende de Task A |
| **Schedule** | Cronograma de execução (cron) |
| **Retry** | Reexecução automática em caso de falha |
| **Idempotência** | Reexecutar não gera efeitos colaterais |
| **Backfill** | Reprocessar períodos passados |
| **SLA** | Prazo máximo de conclusão |

### 13.2 Boas Práticas

- Cada task deve ser **atômica** e **idempotente**
- Tasks devem ter **timeout** definido
- Separar **ingestão**, **transformação** e **validação** em tasks distintas
- Parametrizar datas (nunca calcular "ontem" dentro do código)
- Implementar **alertas** para falha e SLA miss
- Manter **logs** detalhados de cada task
- Testar pipelines com dados de amostra antes de produção

### 13.3 Padrão de Pipeline em PySpark

```python
from datetime import datetime
import sys

def main(dt_referencia: str):
    """Pipeline ETL principal."""
    
    spark = SparkSession.builder \
        .appName(f"ETL_TRANSACOES_{dt_referencia}") \
        .enableHiveSupport() \
        .getOrCreate()
    
    try:
        # 1. Ingestão
        df_raw = extrair_dados(spark, dt_referencia)
        
        # 2. Validação de entrada
        validar_entrada(df_raw, dt_referencia)
        
        # 3. Transformação
        df_transformed = transformar(df_raw)
        
        # 4. Validação de saída
        validar_saida(df_transformed, dt_referencia)
        
        # 5. Carga
        carregar(df_transformed, dt_referencia)
        
        # 6. Log de sucesso
        registrar_execucao(spark, "ETL_TRANSACOES", "SUCESSO", 
                          df_transformed.count())
                          
    except Exception as e:
        registrar_execucao(spark, "ETL_TRANSACOES", "FALHA", 0, str(e))
        raise
    
    finally:
        spark.stop()


if __name__ == "__main__":
    dt_ref = sys.argv[1]  # Recebe data como parâmetro
    main(dt_ref)
```

---

## 14. Observabilidade e Monitoramento

### 14.1 O que Monitorar

| Camada | Métricas |
|---|---|
| **Pipeline** | Tempo de execução, status, registros processados |
| **Dados** | Volume, schema changes, nulos, duplicatas |
| **Infraestrutura** | CPU, memória, disco, HDFS, YARN |
| **SLA** | Atraso na entrega dos dados |

### 14.2 Tabela de Controle de Execução

```sql
CREATE TABLE db_controle.tb_log_execucao (
    cd_execucao         BIGINT,
    nm_pipeline         STRING,
    dt_inicio           TIMESTAMP,
    dt_fim              TIMESTAMP,
    ds_status           STRING,     -- SUCESSO, FALHA, EXECUTANDO
    qt_registros_lidos  BIGINT,
    qt_registros_escritos BIGINT,
    ds_erro             STRING,
    dt_referencia       STRING,
    nm_responsavel      STRING
)
STORED AS PARQUET;
```

### 14.3 Data Freshness

```sql
-- Verificar atualidade dos dados
SELECT 
    nm_tabela,
    MAX(dt_atualizacao) as dt_mais_recente,
    DATEDIFF(CURRENT_DATE(), MAX(dt_atualizacao)) as dias_atraso,
    CASE 
        WHEN DATEDIFF(CURRENT_DATE(), MAX(dt_atualizacao)) > 2 THEN 'ALERTA'
        WHEN DATEDIFF(CURRENT_DATE(), MAX(dt_atualizacao)) > 1 THEN 'ATENCAO'
        ELSE 'OK'
    END as status_freshness
FROM db_controle.tb_catalog_tabelas
GROUP BY nm_tabela
ORDER BY dias_atraso DESC;
```

---

## 15. Segurança de Dados

### 15.1 Princípios

| Princípio | Descrição |
|---|---|
| **Least Privilege** | Conceder apenas as permissões mínimas necessárias |
| **Defense in Depth** | Múltiplas camadas de segurança |
| **Encryption at Rest** | Dados criptografados no armazenamento |
| **Encryption in Transit** | Dados criptografados na transmissão (TLS/SSL) |
| **Audit Trail** | Log de todos os acessos a dados sensíveis |
| **Data Masking** | Mascarar dados sensíveis em ambientes não-produtivos |

### 15.2 Controle de Acesso no Hive

```sql
-- Grant
GRANT SELECT ON TABLE db.tb_publica TO ROLE role_analista;
GRANT ALL ON TABLE db.tb_pipeline TO ROLE role_engenheiro;

-- Column-level security (Ranger)
-- Mascarar CPF para role_analista, visível para role_engenheiro

-- Row-level security
-- Analista da regional SP vê apenas dados de SP
```

### 15.3 Credenciais

```python
# ❌ NUNCA: hardcode de credenciais
password = "MinhaSenh@123"

# ✅ USAR: variáveis de ambiente
import os
password = os.environ.get("DB_PASSWORD")

# ✅ USAR: vault/secret manager
# Integração com HashiCorp Vault, AWS Secrets Manager, etc.

# ✅ USAR: keytab para Kerberos em ambiente Hadoop
# kinit -kt /caminho/keytab usuario@REALM
```

---

## 16. Padrões de Projeto para Pipelines de Dados

### 16.1 Factory Pattern para Conectores

```python
class DataSourceFactory:
    """Factory para criar conectores de diferentes fontes."""
    
    @staticmethod
    def create_reader(spark, source_type: str, config: dict):
        if source_type == "hive":
            return spark.table(config["table"])
        
        elif source_type == "oracle":
            return spark.read.format("jdbc") \
                .option("url", config["url"]) \
                .option("dbtable", config["table"]) \
                .option("driver", "oracle.jdbc.driver.OracleDriver") \
                .option("fetchsize", config.get("fetchsize", "10000")) \
                .load()
        
        elif source_type == "db2":
            return spark.read.format("jdbc") \
                .option("url", config["url"]) \
                .option("dbtable", config["table"]) \
                .option("driver", "com.ibm.db2.jcc.DB2Driver") \
                .option("fetchsize", config.get("fetchsize", "10000")) \
                .load()
        
        elif source_type == "parquet":
            return spark.read.parquet(config["path"])
        
        else:
            raise ValueError(f"Fonte não suportada: {source_type}")
```

### 16.2 Pipeline como Cadeia de Transformações

```python
from functools import reduce

def pipeline(*transforms):
    """Compõe múltiplas transformações em um pipeline."""
    def execute(df):
        return reduce(lambda d, t: t(d), transforms, df)
    return execute

# Definir transformações
def limpar_nulos(df):
    return df.na.drop(subset=["cd_chave"])

def padronizar_strings(df):
    return df.withColumn("nm_cliente", F.upper(F.trim(F.col("nm_cliente"))))

def adicionar_metadados(df):
    return df.withColumn("dt_processamento", F.current_timestamp()) \
             .withColumn("nm_pipeline", F.lit("ETL_CLIENTES"))

def filtrar_ativos(df):
    return df.filter(F.col("fl_ativo") == 1)

# Compor e executar
etl_clientes = pipeline(
    limpar_nulos,
    padronizar_strings,
    filtrar_ativos,
    adicionar_metadados
)

df_resultado = etl_clientes(df_raw)
```

### 16.3 Template Method para ETLs Padronizados

```python
from abc import ABC, abstractmethod

class ETLBase(ABC):
    """Template base para pipelines ETL."""
    
    def __init__(self, spark, dt_referencia):
        self.spark = spark
        self.dt_referencia = dt_referencia
    
    def executar(self):
        """Orquestra o pipeline."""
        df = self.extrair()
        self.validar_entrada(df)
        df = self.transformar(df)
        self.validar_saida(df)
        self.carregar(df)
        self.pos_carga()
    
    @abstractmethod
    def extrair(self):
        pass
    
    @abstractmethod
    def transformar(self, df):
        pass
    
    @abstractmethod
    def carregar(self, df):
        pass
    
    def validar_entrada(self, df):
        assert df.count() > 0, "DataFrame de entrada vazio"
    
    def validar_saida(self, df):
        assert df.count() > 0, "DataFrame de saída vazio"
    
    def pos_carga(self):
        pass  # Override opcional


class ETLTransacoes(ETLBase):
    
    def extrair(self):
        return self.spark.read.format("jdbc") \
            .option("url", ORACLE_URL) \
            .option("dbtable", f"""(
                SELECT * FROM SCHEMA.TB_TRANSACAO
                WHERE TRUNC(DT_TRANSACAO) = TO_DATE('{self.dt_referencia}','YYYY-MM-DD')
            ) t""") \
            .load()
    
    def transformar(self, df):
        return df \
            .withColumn("vl_transacao", F.col("vl_transacao").cast("decimal(15,2)")) \
            .withColumn("dt_processamento", F.current_timestamp()) \
            .dropDuplicates(["cd_transacao"])
    
    def carregar(self, df):
        df.write.mode("overwrite") \
            .partitionBy("dt_referencia") \
            .format("parquet") \
            .saveAsTable("db.tb_fato_transacao")
    
    def pos_carga(self):
        self.spark.sql("ANALYZE TABLE db.tb_fato_transacao COMPUTE STATISTICS")
```

---

## Checklist do Engenheiro de Dados

### Antes de Desenvolver
- [ ] Entender o requisito de negócio e a pergunta que os dados responderão
- [ ] Mapear fontes de dados (sistemas, tabelas, APIs)
- [ ] Definir granularidade, volumetria e frequência
- [ ] Definir SLA de disponibilidade
- [ ] Verificar classificação de dados (LGPD, sigilo bancário)

### Durante o Desenvolvimento
- [ ] Schema explícito (não inferir)
- [ ] Filtrar cedo, selecionar apenas colunas necessárias
- [ ] Pipeline idempotente
- [ ] Tratamento de erros com logging
- [ ] Controle de execução (log de cargas)
- [ ] Testes de qualidade de dados
- [ ] Código parametrizado (datas, caminhos)

### Antes de Publicar
- [ ] Code review por par
- [ ] Teste com amostra em ambiente de desenvolvimento
- [ ] Validar performance (Spark UI, explain plan)
- [ ] Documentar de-para (mapeamento fonte-destino)
- [ ] Documentar dependências e ordem de execução
- [ ] Verificar permissões de acesso
- [ ] Plano de rollback definido

### Pós-Deploy
- [ ] Monitorar primeira execução em produção
- [ ] Validar volumetria e freshness
- [ ] Configurar alertas automáticos
- [ ] Atualizar catálogo de dados

---

*[Voltar ao Índice](README.md)*
