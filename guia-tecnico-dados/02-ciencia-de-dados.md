# Ciência de Dados — Guia Técnico Completo

> Conceitos, técnicas e boas práticas de ciência de dados para ambiente corporativo Big Data.

---

## Índice

1. [Fundamentos Estatísticos](#1-fundamentos-estatísticos)
2. [Análise Exploratória de Dados (EDA)](#2-análise-exploratória-de-dados-eda)
3. [Pré-processamento e Feature Engineering](#3-pré-processamento-e-feature-engineering)
4. [Machine Learning — Fundamentos](#4-machine-learning--fundamentos)
5. [Aprendizado Supervisionado — Regressão](#5-aprendizado-supervisionado--regressão)
6. [Aprendizado Supervisionado — Classificação](#6-aprendizado-supervisionado--classificação)
7. [Aprendizado Não Supervisionado](#7-aprendizado-não-supervisionado)
8. [Avaliação e Validação de Modelos](#8-avaliação-e-validação-de-modelos)
9. [Spark MLlib — ML Distribuído](#9-spark-mllib--ml-distribuído)
10. [Séries Temporais](#10-séries-temporais)
11. [Seleção e Importância de Features](#11-seleção-e-importância-de-features)
12. [MLOps — Ciclo de Vida de Modelos](#12-mlops--ciclo-de-vida-de-modelos)
13. [Boas Práticas para Projetos de Data Science](#13-boas-práticas-para-projetos-de-data-science)

---

## 1. Fundamentos Estatísticos

### 1.1 Estatística Descritiva

| Medida | Descrição | PySpark |
|---|---|---|
| **Média** | Valor médio | `F.avg("col")` |
| **Mediana** | Valor central | `F.percentile_approx("col", 0.5)` |
| **Moda** | Valor mais frequente | GroupBy + Count + OrderBy |
| **Variância** | Dispersão em torno da média | `F.variance("col")` |
| **Desvio Padrão** | Raiz da variância | `F.stddev("col")` |
| **Assimetria (Skewness)** | Inclinação da distribuição | `F.skewness("col")` |
| **Curtose (Kurtosis)** | Achatamento da distribuição | `F.kurtosis("col")` |
| **Percentis** | Divisão em partes iguais | `F.percentile_approx("col", [0.25, 0.5, 0.75])` |
| **IQR** | Intervalo interquartil (Q3-Q1) | Calculado manualmente |

```python
# Estatísticas descritivas completas em PySpark
df.describe().show()

# Estatísticas detalhadas
df.select(
    F.count("valor").alias("count"),
    F.avg("valor").alias("mean"),
    F.stddev("valor").alias("std"),
    F.min("valor").alias("min"),
    F.percentile_approx("valor", 0.25).alias("Q1"),
    F.percentile_approx("valor", 0.5).alias("median"),
    F.percentile_approx("valor", 0.75).alias("Q3"),
    F.max("valor").alias("max"),
    F.skewness("valor").alias("skewness"),
    F.kurtosis("valor").alias("kurtosis")
).show()
```

### 1.2 Distribuições de Probabilidade

| Distribuição | Tipo | Uso Comum |
|---|---|---|
| **Normal (Gaussiana)** | Contínua | Valores naturais (altura, renda), testes estatísticos |
| **Binomial** | Discreta | Sucesso/fracasso em n tentativas |
| **Poisson** | Discreta | Contagem de eventos raros (fraudes, sinistros) |
| **Exponencial** | Contínua | Tempo entre eventos |
| **Uniforme** | Contínua/Discreta | Eventos igualmente prováveis |
| **Log-Normal** | Contínua | Valores positivos com cauda longa (preços, salários) |
| **Beta** | Contínua | Probabilidades, taxas |

### 1.3 Testes de Hipótese

| Teste | Quando Usar | H0 (hipótese nula) |
|---|---|---|
| **t-test** | Comparar médias de 2 grupos | Médias são iguais |
| **ANOVA** | Comparar médias de 3+ grupos | Todas as médias são iguais |
| **Chi-quadrado (χ²)** | Associação entre variáveis categóricas | Variáveis são independentes |
| **Kolmogorov-Smirnov** | Testar se distribuição é normal | Dados seguem distribuição normal |
| **Mann-Whitney U** | Comparar 2 grupos (não-paramétrico) | Distribuições são iguais |
| **Shapiro-Wilk** | Testar normalidade | Dados seguem distribuição normal |

**p-valor:**
- p < 0.05 → Rejeita H0 (resultado estatisticamente significativo)
- p ≥ 0.05 → Não rejeita H0 (sem evidência suficiente)

### 1.4 Correlação

| Tipo | Uso | Intervalo |
|---|---|---|
| **Pearson** | Relação linear entre contínuas | [-1, 1] |
| **Spearman** | Relação monotônica (ordinal/não-linear) | [-1, 1] |
| **Cramér's V** | Associação entre categóricas | [0, 1] |
| **Point-Biserial** | Contínua vs. binária | [-1, 1] |

```python
# Matriz de correlação em PySpark
from pyspark.ml.stat import Correlation
from pyspark.ml.feature import VectorAssembler

cols_num = ["col1", "col2", "col3", "col4"]
assembler = VectorAssembler(inputCols=cols_num, outputCol="features")
df_vec = assembler.transform(df).select("features")

# Pearson
matrix = Correlation.corr(df_vec, "features", "pearson").head()[0]
print(matrix.toArray())

# Spearman
matrix = Correlation.corr(df_vec, "features", "spearman").head()[0]
```

### 1.5 Teorema de Bayes

$$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

Fundamental para classificadores Naive Bayes, redes bayesianas e atualização de crenças.

**Exemplo bancário:**
- $P(\text{fraude})$ = probabilidade a priori de fraude
- $P(\text{transação\_alta} | \text{fraude})$ = probabilidade de transação alta dado que é fraude
- $P(\text{fraude} | \text{transação\_alta})$ = probabilidade de fraude dado transação alta

---

## 2. Análise Exploratória de Dados (EDA)

### 2.1 Roteiro de EDA

1. **Entender o problema de negócio**
2. **Explorar estrutura dos dados** (shape, tipos, schema)
3. **Analisar distribuições** (histogramas, boxplots)
4. **Verificar valores ausentes** (padrões de nulidade)
5. **Identificar outliers** (IQR, z-score)
6. **Analisar correlações** (numérico vs. numérico)
7. **Analisar relações categorias vs. target** (crosstab, chi²)
8. **Documentar insights e decisões**

### 2.2 EDA em PySpark

```python
# 1. Estrutura
print(f"Registros: {df.count()}")
print(f"Colunas: {len(df.columns)}")
df.printSchema()

# 2. Amostra
df.show(20, truncate=False)

# 3. Estatísticas básicas
df.describe().show()

# 4. Valores nulos
df.select([
    F.count(F.when(F.col(c).isNull(), c)).alias(c) 
    for c in df.columns
]).show()

# Percentual de nulos
total = df.count()
df.select([
    F.round(
        F.count(F.when(F.col(c).isNull(), c)) / F.lit(total) * 100, 2
    ).alias(c) 
    for c in df.columns
]).show()

# 5. Distribuição de categóricas
for col_name in cols_categoricas:
    df.groupBy(col_name).count() \
        .withColumn("pct", F.round(F.col("count") / F.lit(total) * 100, 2)) \
        .orderBy(F.desc("count")) \
        .show(20)

# 6. Outliers com IQR
def detectar_outliers_iqr(df, coluna):
    quantiles = df.approxQuantile(coluna, [0.25, 0.75], 0.01)
    Q1, Q3 = quantiles[0], quantiles[1]
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    
    outliers = df.filter(
        (F.col(coluna) < lower) | (F.col(coluna) > upper)
    ).count()
    
    print(f"{coluna}: Q1={Q1:.2f}, Q3={Q3:.2f}, IQR={IQR:.2f}, "
          f"Limites=[{lower:.2f}, {upper:.2f}], Outliers={outliers}")
    
    return lower, upper

# 7. Correlação com target
for col_name in cols_numericas:
    corr = df.stat.corr(col_name, "target")
    print(f"Correlação {col_name} x target: {corr:.4f}")
```

### 2.3 EDA com Pandas (amostras pequenas)

```python
# Converter amostra PySpark para Pandas
df_pd = df.limit(100000).toPandas()

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Describe completo
df_pd.describe(include='all')

# Heatmap de correlação
plt.figure(figsize=(12, 8))
sns.heatmap(df_pd[cols_numericas].corr(), annot=True, cmap='RdBu_r', center=0)
plt.title("Matriz de Correlação")
plt.tight_layout()
plt.savefig("correlacao.png")

# Distribuições
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
for i, col in enumerate(cols_numericas[:6]):
    ax = axes[i // 3, i % 3]
    df_pd[col].hist(bins=50, ax=ax)
    ax.set_title(col)
plt.tight_layout()
plt.savefig("distribuicoes.png")

# Boxplot por categoria
plt.figure(figsize=(10, 6))
sns.boxplot(data=df_pd, x="categoria", y="valor")
plt.title("Valor por Categoria")
plt.savefig("boxplot.png")
```

---

## 3. Pré-processamento e Feature Engineering

### 3.1 Tratamento de Missing Values

| Estratégia | Quando Usar | PySpark |
|---|---|---|
| **Remover linhas** | Poucos nulos (< 5%), aleatórios | `df.na.drop()` |
| **Remover coluna** | > 70% nulos | `df.drop("coluna")` |
| **Média/Mediana** | Numérica, distribuição simétrica/assimétrica | `Imputer` |
| **Moda** | Categórica | GroupBy + max count |
| **Forward/Backward fill** | Séries temporais | Window + lag/lead |
| **KNN Imputer** | Relações entre features | Scikit-learn |
| **Indicador de nulo** | Nulidade é informativa | `F.when(F.col(c).isNull(), 1).otherwise(0)` |

```python
from pyspark.ml.feature import Imputer

# Imputação por mediana
imputer = Imputer(
    inputCols=["vl_renda", "vl_patrimonio"],
    outputCols=["vl_renda", "vl_patrimonio"],
    strategy="median"
)
df = imputer.fit(df).transform(df)

# Indicador de nulidade (feature binária)
df = df.withColumn("fl_renda_nula", 
    F.when(F.col("vl_renda_original").isNull(), 1).otherwise(0))
```

### 3.2 Tratamento de Outliers

```python
# Clipping (Winsorization)
def clip_outliers(df, coluna, lower_pct=0.01, upper_pct=0.99):
    bounds = df.approxQuantile(coluna, [lower_pct, upper_pct], 0.001)
    return df.withColumn(coluna, 
        F.when(F.col(coluna) < bounds[0], bounds[0])
         .when(F.col(coluna) > bounds[1], bounds[1])
         .otherwise(F.col(coluna)))

# Log transform (para distribuições com cauda longa)
df = df.withColumn("vl_renda_log", F.log1p(F.col("vl_renda")))

# Z-score filter
stats = df.select(F.avg("valor").alias("mean"), F.stddev("valor").alias("std")).first()
df_clean = df.filter(
    F.abs((F.col("valor") - stats["mean"]) / stats["std"]) <= 3
)
```

### 3.3 Encoding de Variáveis Categóricas

| Técnica | Quando Usar | Limitação |
|---|---|---|
| **Label Encoding** | Ordinal (baixo/médio/alto) | Implica ordem |
| **One-Hot Encoding** | Nominal, poucas categorias | Explosão dimensional |
| **Target Encoding** | Alta cardinalidade | Risco de data leakage |
| **Frequency Encoding** | Alta cardinalidade | Perde relação com target |
| **Binary Encoding** | Muitas categorias | Complexidade |

```python
from pyspark.ml.feature import StringIndexer, OneHotEncoder

# Label Encoding (StringIndexer)
indexer = StringIndexer(inputCol="ds_tipo", outputCol="ds_tipo_idx")
df = indexer.fit(df).transform(df)

# One-Hot Encoding
encoder = OneHotEncoder(inputCol="ds_tipo_idx", outputCol="ds_tipo_ohe")
df = encoder.fit(df).transform(df)

# Target Encoding manual
target_means = df.groupBy("ds_cidade").agg(
    F.avg("target").alias("ds_cidade_target_enc")
)
df = df.join(target_means, on="ds_cidade", how="left")

# Frequency Encoding manual
freq = df.groupBy("ds_cidade").agg(
    (F.count("*") / F.lit(df.count())).alias("ds_cidade_freq_enc")
)
df = df.join(freq, on="ds_cidade", how="left")
```

### 3.4 Scaling e Normalização

| Técnica | Fórmula | Quando Usar |
|---|---|---|
| **StandardScaler** | $(x - \mu) / \sigma$ | Distribuição normal, SVM, Regressão Logística |
| **MinMaxScaler** | $(x - min) / (max - min)$ | Redes neurais, KNN |
| **RobustScaler** | $(x - Q2) / (Q3 - Q1)$ | Dados com outliers |
| **MaxAbsScaler** | $x / \|max\|$ | Dados esparsos |
| **Log Transform** | $\log(x + 1)$ | Distribuição com cauda longa |

```python
from pyspark.ml.feature import StandardScaler, MinMaxScaler, VectorAssembler

# Criar vetor de features
assembler = VectorAssembler(inputCols=cols_numericas, outputCol="features_raw")
df = assembler.transform(df)

# Standard Scaler
scaler = StandardScaler(inputCol="features_raw", outputCol="features_scaled",
                        withMean=True, withStd=True)
df = scaler.fit(df).transform(df)

# MinMax Scaler
scaler = MinMaxScaler(inputCol="features_raw", outputCol="features_minmax")
df = scaler.fit(df).transform(df)
```

### 3.5 Feature Engineering — Técnicas

#### Features Temporais
```python
df = df.withColumn("dia_semana", F.dayofweek("dt_transacao")) \
       .withColumn("mes", F.month("dt_transacao")) \
       .withColumn("hora", F.hour("dt_transacao")) \
       .withColumn("fl_fim_semana", 
           F.when(F.dayofweek("dt_transacao").isin([1, 7]), 1).otherwise(0)) \
       .withColumn("fl_horario_comercial",
           F.when(F.hour("dt_transacao").between(8, 18), 1).otherwise(0)) \
       .withColumn("dias_desde_cadastro",
           F.datediff(F.current_date(), F.col("dt_cadastro")))
```

#### Features de Agregação (RFM e similares)
```python
# Recency, Frequency, Monetary
window_cliente = Window.partitionBy("cd_cliente")

df_rfm = df.groupBy("cd_cliente").agg(
    F.datediff(F.current_date(), F.max("dt_transacao")).alias("recency"),
    F.count("cd_transacao").alias("frequency"),
    F.sum("vl_transacao").alias("monetary"),
    F.avg("vl_transacao").alias("avg_ticket"),
    F.stddev("vl_transacao").alias("std_ticket"),
    F.min("vl_transacao").alias("min_ticket"),
    F.max("vl_transacao").alias("max_ticket"),
    F.countDistinct("cd_produto").alias("distinct_products"),
)
```

#### Features de Razão e Interação
```python
df = df.withColumn("ratio_renda_divida", F.col("vl_renda") / (F.col("vl_divida") + 1)) \
       .withColumn("ratio_saldo_renda", F.col("vl_saldo") / (F.col("vl_renda") + 1)) \
       .withColumn("renda_x_tempo", F.col("vl_renda") * F.col("qt_meses_cliente"))
```

#### Features de Lag/Rolling (Séries Temporais)
```python
window_time = Window.partitionBy("cd_cliente").orderBy("dt_referencia")

# Lag features
for i in [1, 3, 6, 12]:
    df = df.withColumn(f"vl_transacao_lag_{i}", F.lag("vl_transacao", i).over(window_time))

# Rolling features
window_rolling = Window.partitionBy("cd_cliente") \
    .orderBy("dt_referencia") \
    .rowsBetween(-2, 0)  # últimos 3 períodos

df = df.withColumn("vl_media_movel_3", F.avg("vl_transacao").over(window_rolling)) \
       .withColumn("vl_max_movel_3", F.max("vl_transacao").over(window_rolling))
```

### 3.6 Tratamento de Desbalanceamento

| Técnica | Tipo | Descrição |
|---|---|---|
| **Oversampling** | Amostragem | Duplica exemplos da classe minoritária |
| **SMOTE** | Amostragem | Gera exemplos sintéticos |
| **Undersampling** | Amostragem | Reduz exemplos da classe majoritária |
| **Class Weight** | Algoritmo | Penaliza mais erros na classe minoritária |
| **Threshold Tuning** | Pós-modelo | Ajusta limiar de decisão |

```python
# Undersampling em PySpark
df_positivo = df.filter(F.col("target") == 1)
df_negativo = df.filter(F.col("target") == 0)

ratio = df_positivo.count() / df_negativo.count()
df_neg_sampled = df_negativo.sample(fraction=ratio, seed=42)
df_balanced = df_positivo.union(df_neg_sampled)

# Oversampling simples
n_repeat = int(df_negativo.count() / df_positivo.count())
df_pos_over = df_positivo
for _ in range(n_repeat - 1):
    df_pos_over = df_pos_over.union(df_positivo)
df_balanced = df_pos_over.union(df_negativo)

# Class weight via weightCol
from pyspark.ml.classification import LogisticRegression

total = df.count()
n_pos = df.filter(F.col("target") == 1).count()
n_neg = total - n_pos

df = df.withColumn("weight",
    F.when(F.col("target") == 1, total / (2 * n_pos))
     .otherwise(total / (2 * n_neg)))

lr = LogisticRegression(featuresCol="features", labelCol="target", weightCol="weight")
```

---

## 4. Machine Learning — Fundamentos

### 4.1 Tipos de Aprendizado

| Tipo | Descrição | Exemplos de Algoritmos | Uso |
|---|---|---|---|
| **Supervisionado** | Dados rotulados (X → y) | Regressão Linear, Random Forest, XGBoost | Prever valor, classificar |
| **Não Supervisionado** | Sem rótulos | K-Means, DBSCAN, PCA | Segmentar, reduzir dimensão |
| **Semi-Supervisionado** | Poucos rótulos + muitos sem | Label Propagation | Dados caros de rotular |
| **Por Reforço** | Agente + ambiente + recompensa | Q-Learning, PPO | Jogos, robótica, trading |

### 4.2 Bias-Variance Tradeoff

```
Erro Total = Bias² + Variância + Erro Irredutível

Alto Bias (Underfitting)          Equilíbrio Ideal         Alta Variância (Overfitting)
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  Modelo simples  │          │ Modelo adequado  │          │ Modelo complexo  │
│  demais para os  │          │  captura padrão  │          │  decora os dados │
│  dados           │          │  sem decorar     │          │  de treino       │
│                  │          │                  │          │                  │
│ Train err: alto  │          │ Train err: baixo │          │ Train err: ~0    │
│ Test err: alto   │          │ Test err: baixo  │          │ Test err: alto   │
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

### 4.3 Pipeline de Machine Learning

```
Dados → EDA → Pré-processamento → Feature Engineering → Split (train/val/test)
                                                              │
        ┌─────────────────────────────────────────────────────┘
        ▼
   Treinamento → Validação → Ajuste de Hiperparâmetros → Avaliação Final
                                                              │
        ┌─────────────────────────────────────────────────────┘
        ▼
   Deploy → Monitoramento → Retreino
```

### 4.4 Divisão de Dados

```python
# Split simples
train, test = df.randomSplit([0.8, 0.2], seed=42)
train, val = train.randomSplit([0.8, 0.2], seed=42)

# Split temporal (CORRETO para séries temporais)
dt_corte_train = "2024-06-30"
dt_corte_val = "2024-09-30"

train = df.filter(F.col("dt_referencia") <= dt_corte_train)
val = df.filter(
    (F.col("dt_referencia") > dt_corte_train) & 
    (F.col("dt_referencia") <= dt_corte_val)
)
test = df.filter(F.col("dt_referencia") > dt_corte_val)

# Stratified split (manter proporção do target)
fractions = df.select("target").distinct().rdd \
    .flatMap(lambda x: x).collect()
fractions = {t: 0.8 for t in fractions}
train = df.sampleBy("target", fractions, seed=42)
test = df.subtract(train)
```

---

## 5. Aprendizado Supervisionado — Regressão

### 5.1 Regressão Linear

$$\hat{y} = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + ... + \beta_n x_n$$

**Premissas:**
- Relação linear entre X e y
- Resíduos normais com média zero
- Homocedasticidade (variância constante dos resíduos)
- Independência dos resíduos
- Sem multicolinearidade entre features

```python
from pyspark.ml.regression import LinearRegression

lr = LinearRegression(
    featuresCol="features",
    labelCol="target",
    maxIter=100,
    regParam=0.01,      # Regularização L2 (Ridge)
    elasticNetParam=0.0  # 0=Ridge, 1=Lasso, entre=ElasticNet
)

model = lr.fit(train)

# Coeficientes
print(f"Intercept: {model.intercept}")
for i, col in enumerate(feature_cols):
    print(f"  {col}: {model.coefficients[i]:.4f}")

# Métricas de treino
summary = model.summary
print(f"R²: {summary.r2:.4f}")
print(f"RMSE: {summary.rootMeanSquaredError:.4f}")
print(f"MAE: {summary.meanAbsoluteError:.4f}")
```

### 5.2 Regularização

| Tipo | Penalização | Efeito | Quando Usar |
|---|---|---|---|
| **Ridge (L2)** | $\lambda \sum \beta_i^2$ | Reduz coeficientes | Multicolinearidade |
| **Lasso (L1)** | $\lambda \sum \|\beta_i\|$ | Zera coeficientes (seleção) | Muitas features, seleção |
| **ElasticNet** | $\alpha L1 + (1-\alpha) L2$ | Combina ambos | Melhor dos dois mundos |

### 5.3 Regressão Polinomial

```python
from pyspark.ml.feature import PolynomialExpansion

# Criar features polinomiais (grau 2)
poly = PolynomialExpansion(degree=2, inputCol="features", outputCol="poly_features")
df_poly = poly.transform(df)

lr = LinearRegression(featuresCol="poly_features", labelCol="target")
model = lr.fit(train_poly)
```

### 5.4 Árvore de Decisão para Regressão

```python
from pyspark.ml.regression import DecisionTreeRegressor

dt = DecisionTreeRegressor(
    featuresCol="features",
    labelCol="target",
    maxDepth=10,
    minInstancesPerNode=20
)
model = dt.fit(train)
```

### 5.5 Random Forest para Regressão

```python
from pyspark.ml.regression import RandomForestRegressor

rf = RandomForestRegressor(
    featuresCol="features",
    labelCol="target",
    numTrees=100,
    maxDepth=10,
    featureSubsetStrategy="sqrt",
    seed=42
)
model = rf.fit(train)

# Feature importance
importances = model.featureImportances
for i, col in enumerate(feature_cols):
    print(f"  {col}: {importances[i]:.4f}")
```

### 5.6 Gradient Boosted Trees para Regressão

```python
from pyspark.ml.regression import GBTRegressor

gbt = GBTRegressor(
    featuresCol="features",
    labelCol="target",
    maxIter=100,
    maxDepth=5,
    stepSize=0.1,  # learning rate
    seed=42
)
model = gbt.fit(train)
```

### 5.7 Métricas de Regressão

| Métrica | Fórmula Simplificada | Interpretação |
|---|---|---|
| **MAE** | $\frac{1}{n}\sum\|y_i - \hat{y}_i\|$ | Erro médio absoluto |
| **MSE** | $\frac{1}{n}\sum(y_i - \hat{y}_i)^2$ | Erro quadrático médio |
| **RMSE** | $\sqrt{MSE}$ | Na mesma unidade de y |
| **R²** | $1 - \frac{SS_{res}}{SS_{tot}}$ | % da variância explicada (0 a 1) |
| **MAPE** | $\frac{1}{n}\sum\frac{\|y_i - \hat{y}_i\|}{y_i} \times 100$ | Erro percentual médio |

```python
from pyspark.ml.evaluation import RegressionEvaluator

predictions = model.transform(test)

for metric in ["rmse", "mse", "mae", "r2"]:
    evaluator = RegressionEvaluator(
        labelCol="target", predictionCol="prediction", metricName=metric
    )
    value = evaluator.evaluate(predictions)
    print(f"{metric.upper()}: {value:.4f}")
```

---

## 6. Aprendizado Supervisionado — Classificação

### 6.1 Regressão Logística

$$P(y=1|X) = \frac{1}{1 + e^{-(\beta_0 + \beta_1 x_1 + ... + \beta_n x_n)}}$$

```python
from pyspark.ml.classification import LogisticRegression

lr = LogisticRegression(
    featuresCol="features",
    labelCol="target",
    maxIter=100,
    regParam=0.01,
    elasticNetParam=0.0,
    threshold=0.5  # Limiar de classificação
)
model = lr.fit(train)

# Coeficientes (odds ratio)
import numpy as np
for i, col in enumerate(feature_cols):
    coef = model.coefficients[i]
    odds_ratio = np.exp(coef)
    print(f"  {col}: coef={coef:.4f}, OR={odds_ratio:.4f}")
```

### 6.2 Árvore de Decisão

```python
from pyspark.ml.classification import DecisionTreeClassifier

dt = DecisionTreeClassifier(
    featuresCol="features",
    labelCol="target",
    maxDepth=10,
    minInstancesPerNode=20,
    impurity="gini"  # ou "entropy"
)
model = dt.fit(train)
```

**Critérios de split:**
- **Gini**: $1 - \sum p_i^2$ (impureza)
- **Entropy**: $-\sum p_i \log_2(p_i)$ (informação)

### 6.3 Random Forest

```python
from pyspark.ml.classification import RandomForestClassifier

rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="target",
    numTrees=200,
    maxDepth=10,
    featureSubsetStrategy="sqrt",
    subsamplingRate=0.8,
    seed=42
)
model = rf.fit(train)
```

**Vantagens:**
- Reduz overfitting (ensemble de árvores)
- Robusto a outliers
- Feature importance nativa
- Paralelelizável

### 6.4 Gradient Boosted Trees (GBT)

```python
from pyspark.ml.classification import GBTClassifier

gbt = GBTClassifier(
    featuresCol="features",
    labelCol="target",
    maxIter=100,
    maxDepth=5,
    stepSize=0.1,
    subsamplingRate=0.8,
    seed=42
)
model = gbt.fit(train)
```

### 6.5 Naive Bayes

```python
from pyspark.ml.classification import NaiveBayes

nb = NaiveBayes(
    featuresCol="features",
    labelCol="target",
    modelType="multinomial"  # ou "gaussian", "bernoulli"
)
model = nb.fit(train)
```

**Quando usar:** Classificação de texto, muitas features categóricas, dataset grande.

### 6.6 Support Vector Machine (SVM)

```python
from pyspark.ml.classification import LinearSVC

svm = LinearSVC(
    featuresCol="features",
    labelCol="target",
    maxIter=100,
    regParam=0.01
)
model = svm.fit(train)
```

### 6.7 Resumo de Algoritmos de Classificação

| Algoritmo | Prós | Contras | Melhor Para |
|---|---|---|---|
| **Logistic Regression** | Interpretável, rápido, probabilístico | Relação linear | Baseline, crédito |
| **Decision Tree** | Interpretável, features mistas | Overfitting | Regras de negócio |
| **Random Forest** | Robusto, preciso | Menos interpretável | Uso geral |
| **GBT/XGBoost** | Melhor accuracy geral | Lento, hiperparâmetros | Competições, produção |
| **Naive Bayes** | Rápido, escalável | Premissa de independência | Texto, alta dimensão |
| **SVM** | Bom em alta dimensão | Lento, não-probabilístico | Texto, imagens |

### 6.8 Métricas de Classificação

#### Matriz de Confusão

```
                    Predito
                 Pos     Neg
Real   Pos    [ TP  |  FN  ]   ← Recall = TP/(TP+FN)
       Neg    [ FP  |  TN  ]
                 ↑
            Precision = TP/(TP+FP)
```

| Métrica | Fórmula | Quando Priorizar |
|---|---|---|
| **Accuracy** | $(TP+TN)/Total$ | Classes balanceadas |
| **Precision** | $TP/(TP+FP)$ | Custo alto de FP (spam, recommend) |
| **Recall (Sensibilidade)** | $TP/(TP+FN)$ | Custo alto de FN (fraude, doença) |
| **F1-Score** | $2 \cdot \frac{Precision \cdot Recall}{Precision + Recall}$ | Equilíbrio entre P e R |
| **AUC-ROC** | Área sob curva ROC | Comparação geral de modelos |
| **AUC-PR** | Área sob curva Precision-Recall | Classes muito desbalanceadas |
| **KS (Kolmogorov-Smirnov)** | Max distância entre CDFs | Crédito, risco |
| **Gini** | $2 \times AUC - 1$ | Crédito, risco |
| **Log Loss** | $-\frac{1}{n}\sum[y\log(\hat{p}) + (1-y)\log(1-\hat{p})]$ | Calibração de probabilidades |

```python
from pyspark.ml.evaluation import BinaryClassificationEvaluator, MulticlassClassificationEvaluator

predictions = model.transform(test)

# AUC-ROC
auc_eval = BinaryClassificationEvaluator(
    labelCol="target", rawPredictionCol="rawPrediction", metricName="areaUnderROC"
)
print(f"AUC-ROC: {auc_eval.evaluate(predictions):.4f}")

# AUC-PR
pr_eval = BinaryClassificationEvaluator(
    labelCol="target", rawPredictionCol="rawPrediction", metricName="areaUnderPR"
)
print(f"AUC-PR: {pr_eval.evaluate(predictions):.4f}")

# Accuracy, F1, Precision, Recall
for metric in ["accuracy", "f1", "weightedPrecision", "weightedRecall"]:
    mc_eval = MulticlassClassificationEvaluator(
        labelCol="target", predictionCol="prediction", metricName=metric
    )
    print(f"{metric}: {mc_eval.evaluate(predictions):.4f}")

# KS Statistic manual
from pyspark.sql.window import Window

df_ks = predictions.select(
    "target",
    F.element_at(F.col("probability"), 2).alias("prob_1")
)

# Ordenar por probabilidade e calcular CDFs
window_ks = Window.orderBy("prob_1")
total_pos = df_ks.filter(F.col("target") == 1).count()
total_neg = df_ks.filter(F.col("target") == 0).count()

df_ks = df_ks.withColumn(
    "cum_pos", F.sum(F.when(F.col("target") == 1, 1).otherwise(0)).over(window_ks) / total_pos
).withColumn(
    "cum_neg", F.sum(F.when(F.col("target") == 0, 1).otherwise(0)).over(window_ks) / total_neg
).withColumn("ks", F.abs(F.col("cum_pos") - F.col("cum_neg")))

ks_stat = df_ks.agg(F.max("ks")).first()[0]
print(f"KS: {ks_stat:.4f}")
```

---

## 7. Aprendizado Não Supervisionado

### 7.1 Clustering — K-Means

```python
from pyspark.ml.clustering import KMeans
from pyspark.ml.evaluation import ClusteringEvaluator

# Treinar K-Means
kmeans = KMeans(
    featuresCol="features_scaled",
    k=5,
    seed=42,
    maxIter=100,
    initMode="k-means||"  # inicialização paralela
)
model = kmeans.fit(df)

# Predições
df_clusters = model.transform(df)

# Avaliação — Silhouette Score
evaluator = ClusteringEvaluator(
    featuresCol="features_scaled", metricName="silhouette"
)
silhouette = evaluator.evaluate(df_clusters)
print(f"Silhouette Score: {silhouette:.4f}")  # -1 a 1, quanto maior melhor

# Elbow Method — testar vários k
costs = []
for k in range(2, 11):
    km = KMeans(featuresCol="features_scaled", k=k, seed=42)
    model = km.fit(df)
    costs.append((k, model.summary.trainingCost))

# Perfil dos clusters
df_clusters.groupBy("prediction").agg(
    F.count("*").alias("qtd"),
    F.avg("vl_renda").alias("media_renda"),
    F.avg("vl_gasto").alias("media_gasto"),
    F.avg("qt_transacoes").alias("media_transacoes")
).orderBy("prediction").show()

# Centróides
for i, center in enumerate(model.clusterCenters()):
    print(f"Cluster {i}: {center}")
```

### 7.2 Clustering — Bisecting K-Means

```python
from pyspark.ml.clustering import BisectingKMeans

bkm = BisectingKMeans(
    featuresCol="features_scaled",
    k=5,
    seed=42
)
model = bkm.fit(df)
```

Abordagem top-down: divide recursivamente o cluster com maior variância.

### 7.3 Clustering — Gaussian Mixture Model (GMM)

```python
from pyspark.ml.clustering import GaussianMixture

gmm = GaussianMixture(
    featuresCol="features_scaled",
    k=5,
    seed=42,
    maxIter=100
)
model = gmm.fit(df)

# Probabilidades de pertencimento (soft clustering)
df_gmm = model.transform(df)
df_gmm.select("prediction", "probability").show(truncate=False)
```

### 7.4 Redução de Dimensionalidade — PCA

```python
from pyspark.ml.feature import PCA

pca = PCA(k=3, inputCol="features_scaled", outputCol="pca_features")
model = pca.fit(df)
df_pca = model.transform(df)

# Variância explicada
print(f"Variância explicada: {model.explainedVariance}")
print(f"Variância acumulada: {sum(model.explainedVariance):.4f}")
```

**Quando usar PCA:**
- Muitas features correlacionadas
- Visualização (k=2 ou k=3)
- Reduzir dimensionalidade antes de clustering
- Combater curse of dimensionality

### 7.5 Regras de Associação

```python
from pyspark.ml.fpm import FPGrowth

# Dados: cada linha = lista de itens comprados juntos
fp = FPGrowth(
    itemsCol="items",
    minSupport=0.01,
    minConfidence=0.5
)
model = fp.fit(df)

# Itens frequentes
model.freqItemsets.show()

# Regras de associação
model.associationRules.show()
# antecedent → consequent (confidence, lift, support)
```

---

## 8. Avaliação e Validação de Modelos

### 8.1 Cross-Validation

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import BinaryClassificationEvaluator

rf = RandomForestClassifier(featuresCol="features", labelCol="target")

# Grid de hiperparâmetros
paramGrid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [50, 100, 200]) \
    .addGrid(rf.maxDepth, [5, 10, 15]) \
    .addGrid(rf.featureSubsetStrategy, ["sqrt", "log2"]) \
    .build()

# Cross-validator
cv = CrossValidator(
    estimator=rf,
    estimatorParamMaps=paramGrid,
    evaluator=BinaryClassificationEvaluator(labelCol="target"),
    numFolds=5,
    parallelism=4,
    seed=42
)

cvModel = cv.fit(train)

# Melhor modelo
best_model = cvModel.bestModel
print(f"Best numTrees: {best_model.getNumTrees}")
print(f"Best maxDepth: {best_model.getOrDefault('maxDepth')}")

# Métricas por fold
print(f"Avg AUC: {sum(cvModel.avgMetrics) / len(cvModel.avgMetrics):.4f}")
```

### 8.2 Train-Validation Split

```python
from pyspark.ml.tuning import TrainValidationSplit

tvs = TrainValidationSplit(
    estimator=rf,
    estimatorParamMaps=paramGrid,
    evaluator=BinaryClassificationEvaluator(labelCol="target"),
    trainRatio=0.8,
    seed=42
)
tvsModel = tvs.fit(train)
```

Mais rápido que CrossValidator, menos robusto.

### 8.3 Validação Temporal (Time Series Split)

```python
# Para séries temporais, NUNCA usar split aleatório
# Usar expanding window ou sliding window

meses_treino = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"]
meses_teste = ["2024-07"]  # Sempre futuro em relação ao treino

results = []
for i in range(3, len(meses_treino)):
    train_months = meses_treino[:i+1]
    test_month = meses_treino[i+1] if i+1 < len(meses_treino) else meses_teste[0]
    
    train_fold = df.filter(F.col("mes_ref").isin(train_months))
    test_fold = df.filter(F.col("mes_ref") == test_month)
    
    model = rf.fit(train_fold)
    preds = model.transform(test_fold)
    
    auc = evaluator.evaluate(preds)
    results.append({"train_end": train_months[-1], "test": test_month, "auc": auc})
```

### 8.4 Overfitting — Diagnóstico e Soluções

| Sinal | Solução |
|---|---|
| Train AUC >> Test AUC | Reduzir complexidade (maxDepth, numTrees) |
| Melhora com mais dados | Coletar mais dados |
| Poucas features dominam | Feature selection, regularização |
| Modelo instável entre folds | Mais dados, menos features |

---

## 9. Spark MLlib — ML Distribuído

### 9.1 Pipeline MLlib

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    StringIndexer, OneHotEncoder, VectorAssembler, 
    StandardScaler, Imputer
)
from pyspark.ml.classification import RandomForestClassifier

# Definir estágios
# 1. Imputar nulos
imputer = Imputer(
    inputCols=["vl_renda", "vl_patrimonio"],
    outputCols=["vl_renda", "vl_patrimonio"],
    strategy="median"
)

# 2. Indexar categóricas
indexers = [
    StringIndexer(inputCol=c, outputCol=f"{c}_idx", handleInvalid="keep")
    for c in cols_categoricas
]

# 3. One-hot encode
encoders = [
    OneHotEncoder(inputCol=f"{c}_idx", outputCol=f"{c}_ohe")
    for c in cols_categoricas
]

# 4. Montar vetor de features
feature_cols = cols_numericas + [f"{c}_ohe" for c in cols_categoricas]
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features_raw")

# 5. Escalar
scaler = StandardScaler(inputCol="features_raw", outputCol="features")

# 6. Modelo
rf = RandomForestClassifier(
    featuresCol="features", labelCol="target", numTrees=100
)

# Pipeline completo
pipeline = Pipeline(stages=[imputer] + indexers + encoders + [assembler, scaler, rf])

# Treino
model = pipeline.fit(train)

# Predição
predictions = model.transform(test)

# Salvar/Carregar pipeline
model.write().overwrite().save("/caminho/modelo/rf_pipeline")
loaded_model = PipelineModel.load("/caminho/modelo/rf_pipeline")
```

### 9.2 XGBoost no Spark (via xgboost4j-spark)

```python
from xgboost.spark import SparkXGBClassifier

xgb = SparkXGBClassifier(
    features_col="features",
    label_col="target",
    num_workers=10,
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.01,    # L1
    reg_lambda=1.0,    # L2
    scale_pos_weight=5, # Para desbalanceamento
    eval_metric="auc",
    early_stopping_rounds=10,
    missing=0.0
)

model = xgb.fit(train)
predictions = model.transform(test)
```

---

## 10. Séries Temporais

### 10.1 Conceitos

| Componente | Descrição |
|---|---|
| **Tendência** | Direção geral de longo prazo |
| **Sazonalidade** | Padrões repetitivos em intervalos fixos |
| **Ciclo** | Flutuações de longo prazo sem período fixo |
| **Resíduo** | Variação aleatória após remover tendência e sazonalidade |

### 10.2 Estacionariedade

Uma série é estacionária quando suas propriedades estatísticas (média, variância) não mudam ao longo do tempo.

**Teste ADF (Augmented Dickey-Fuller):**
- H0: Série NÃO é estacionária
- p < 0.05: Rejeita H0 → série é estacionária

**Tornar estacionária:**
- Diferenciação: $y'_t = y_t - y_{t-1}$
- Log + Diferenciação
- Diferenciação sazonal: $y'_t = y_t - y_{t-s}$

### 10.3 Modelos Clássicos

| Modelo | Descrição | Uso |
|---|---|---|
| **ARIMA(p,d,q)** | AutoRegressive Integrated Moving Average | Univariada, não sazonal |
| **SARIMA** | ARIMA + sazonalidade | Univariada, sazonal |
| **Prophet** | Facebook — decomposição aditiva | Múltiplas sazonalidades, feriados |
| **Exponential Smoothing** | Média ponderada exponencial | Previsão simples |
| **VAR** | Vector Autoregression | Multivariada |

### 10.4 Features para Séries Temporais em PySpark

```python
# Componentes temporais
df = df.withColumn("ano", F.year("dt_ref")) \
       .withColumn("mes", F.month("dt_ref")) \
       .withColumn("dia_mes", F.dayofmonth("dt_ref")) \
       .withColumn("dia_semana", F.dayofweek("dt_ref")) \
       .withColumn("semana_ano", F.weekofyear("dt_ref")) \
       .withColumn("trimestre", F.quarter("dt_ref"))

# Encoding cíclico (seno/cosseno) para capturar circularidade
import math
df = df.withColumn("mes_sin", F.sin(2 * math.pi * F.col("mes") / 12)) \
       .withColumn("mes_cos", F.cos(2 * math.pi * F.col("mes") / 12)) \
       .withColumn("dia_semana_sin", F.sin(2 * math.pi * F.col("dia_semana") / 7)) \
       .withColumn("dia_semana_cos", F.cos(2 * math.pi * F.col("dia_semana") / 7))
```

---

## 11. Seleção e Importância de Features

### 11.1 Métodos

| Categoria | Método | Descrição |
|---|---|---|
| **Filter** | Correlação | Remove features com baixa correlação com target |
| **Filter** | Variância | Remove features com variância próxima de zero |
| **Filter** | Chi² | Teste de independência para categóricas |
| **Wrapper** | Forward/Backward Selection | Adiciona/remove features iterativamente |
| **Embedded** | Lasso (L1) | Zera coeficientes menos importantes |
| **Embedded** | Feature Importance (RF/GBT) | Importância calculada pelo modelo |
| **Embedded** | SHAP | Explicação baseada em teoria dos jogos |

### 11.2 Feature Importance em PySpark

```python
# Random Forest / GBT
model = rf.fit(train)
importances = model.featureImportances

# Mapear para nomes
feature_importance = [(feature_cols[i], float(importances[i])) 
                      for i in range(len(feature_cols))]
feature_importance.sort(key=lambda x: x[1], reverse=True)

for name, imp in feature_importance[:20]:
    print(f"  {name}: {imp:.4f}")

# ChiSqSelector
from pyspark.ml.feature import ChiSqSelector

selector = ChiSqSelector(
    numTopFeatures=20,
    featuresCol="features",
    outputCol="selected_features",
    labelCol="target"
)
model_selector = selector.fit(df)
df_selected = model_selector.transform(df)
```

### 11.3 Multicolinearidade — VIF

```python
# Variance Inflation Factor (VIF)
# VIF > 5 indica multicolinearidade preocupante
# VIF > 10 indica multicolinearidade severa

import pandas as pd
import numpy as np
from statsmodels.stats.outliers_influence import variance_inflation_factor

# Converter amostra para Pandas
df_pd = df.select(cols_numericas).limit(50000).toPandas()

vif_data = pd.DataFrame()
vif_data["feature"] = cols_numericas
vif_data["VIF"] = [
    variance_inflation_factor(df_pd.values, i) 
    for i in range(len(cols_numericas))
]
print(vif_data.sort_values("VIF", ascending=False))
```

---

## 12. MLOps — Ciclo de Vida de Modelos

### 12.1 Ciclo de Vida

```
Experimentação → Treinamento → Validação → Registro → Deploy → Monitoramento → Retreino
     ↑                                                                              │
     └──────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Versionamento de Modelos

```python
# Salvar modelo com metadados
import json
from datetime import datetime

metadata = {
    "model_name": "rf_classificacao_credito",
    "version": "1.2.0",
    "algorithm": "RandomForestClassifier",
    "features": feature_cols,
    "metrics": {
        "auc_roc": 0.85,
        "ks": 0.52,
        "gini": 0.70
    },
    "train_date": datetime.now().strftime("%Y-%m-%d"),
    "train_period": "2024-01 a 2024-06",
    "test_period": "2024-07",
    "data_rows": train.count(),
    "hyperparameters": {
        "numTrees": 200,
        "maxDepth": 10,
        "featureSubsetStrategy": "sqrt"
    }
}

# Salvar
model.write().overwrite().save(f"/models/{metadata['model_name']}/{metadata['version']}")

spark.createDataFrame([metadata]).write.mode("append") \
    .saveAsTable("db_mlops.tb_model_registry")
```

### 12.3 Monitoramento de Modelo (Model Drift)

```python
# Data Drift — PSI (Population Stability Index)
def calcular_psi(df_ref, df_atual, coluna, bins=10):
    """Calcula PSI para detectar mudança na distribuição de uma feature."""
    quantiles = [i/bins for i in range(bins + 1)]
    breakpoints = df_ref.approxQuantile(coluna, quantiles, 0.01)
    
    def get_distribution(df, breakpoints, coluna):
        buckets = []
        for i in range(len(breakpoints) - 1):
            low, high = breakpoints[i], breakpoints[i+1]
            count = df.filter(
                (F.col(coluna) >= low) & (F.col(coluna) < high)
            ).count()
            buckets.append(max(count, 1))  # avoid zero
        total = sum(buckets)
        return [b/total for b in buckets]
    
    dist_ref = get_distribution(df_ref, breakpoints, coluna)
    dist_atual = get_distribution(df_atual, breakpoints, coluna)
    
    psi = sum(
        (a - r) * np.log(a / r) 
        for a, r in zip(dist_atual, dist_ref)
    )
    return psi

# PSI < 0.1: sem mudança significativa
# PSI 0.1-0.25: mudança moderada (investigar)
# PSI > 0.25: mudança significativa (retreinar)

# Concept Drift — monitorar métricas ao longo do tempo
def monitorar_performance(spark, modelo, df_novo, dt_referencia):
    preds = modelo.transform(df_novo)
    
    auc = BinaryClassificationEvaluator(
        labelCol="target", metricName="areaUnderROC"
    ).evaluate(preds)
    
    log = Row(
        nm_modelo="rf_credito",
        dt_referencia=dt_referencia,
        vl_auc=auc,
        dt_avaliacao=datetime.now().strftime("%Y-%m-%d")
    )
    
    spark.createDataFrame([log]).write.mode("append") \
        .saveAsTable("db_mlops.tb_model_monitoring")
    
    if auc < 0.75:
        print(f"ALERTA: AUC caiu para {auc:.4f} — considerar retreino")
```

### 12.4 Batch Scoring (Inferência em Produção)

```python
def batch_scoring(spark, dt_referencia):
    """Executa scoring em batch para todos os clientes."""
    
    # Carregar modelo
    model = PipelineModel.load("/models/rf_credito/latest")
    
    # Preparar features
    df_features = preparar_features(spark, dt_referencia)
    
    # Score
    df_scored = model.transform(df_features)
    
    # Extrair probabilidade da classe positiva
    df_resultado = df_scored.select(
        "cd_cliente",
        F.lit(dt_referencia).alias("dt_referencia"),
        F.element_at(F.col("probability"), 2).alias("score"),
        F.col("prediction").alias("classe_predita"),
        F.current_timestamp().alias("dt_scoring")
    )
    
    # Persistir scores
    df_resultado.write.mode("overwrite") \
        .partitionBy("dt_referencia") \
        .saveAsTable("db_scores.tb_score_credito")
    
    return df_resultado
```

---

## 13. Boas Práticas para Projetos de Data Science

### 13.1 CRISP-DM (Metodologia)

```
1. Entendimento do Negócio
   └─▶ 2. Entendimento dos Dados
        └─▶ 3. Preparação dos Dados
             └─▶ 4. Modelagem
                  └─▶ 5. Avaliação
                       └─▶ 6. Deploy
                            └─▶ (volta ao 1. para iterar)
```

### 13.2 Checklist do Cientista de Dados

**Antes de Modelar:**
- [ ] Problema de negócio claramente definido
- [ ] Métrica de sucesso acordada com stakeholders
- [ ] Baseline definido (modelo simples ou regra de negócio)
- [ ] EDA completa com insights documentados
- [ ] Tratamento de missing, outliers, e encoding definido
- [ ] Features selecionadas com justificativa

**Durante a Modelagem:**
- [ ] Split temporal correto (treino no passado, teste no futuro)
- [ ] Cross-validation adequada
- [ ] Múltiplos algoritmos testados
- [ ] Hiperparâmetros otimizados
- [ ] Feature importance analisada
- [ ] Sem data leakage

**Antes de Deploy:**
- [ ] Métricas atendem requisito de negócio
- [ ] Modelo estável entre folds
- [ ] Pipeline de scoring automatizado
- [ ] Monitoramento de drift configurado
- [ ] Documentação técnica completa
- [ ] Plano de retreino definido

### 13.3 Data Leakage — Como Evitar

| Tipo | Descrição | Prevenção |
|---|---|---|
| **Target Leakage** | Feature contém informação do target | Análise causal das features |
| **Train-Test Contamination** | Info do teste vaza no treino | Split ANTES de pré-processamento |
| **Temporal Leakage** | Usar dados futuros para prever passado | Split temporal rigoroso |
| **Feature Leakage** | Feature disponível apenas após o evento | Verificar disponibilidade temporal |

```python
# ❌ ERRADO: fit scaler em todo o dataset
scaler = StandardScaler(inputCol="features_raw", outputCol="features")
scaler_model = scaler.fit(df_completo)  # LEAKAGE!
train_scaled = scaler_model.transform(train)
test_scaled = scaler_model.transform(test)

# ✅ CORRETO: fit scaler apenas no treino
scaler_model = scaler.fit(train)  # Apenas treino
train_scaled = scaler_model.transform(train)
test_scaled = scaler_model.transform(test)  # Transform com parâmetros do treino
```

---

*[Voltar ao Índice](README.md)*
