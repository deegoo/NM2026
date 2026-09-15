# NM2026
New Monitor
<img width="425" height="231" alt="image" src="/newmonitor/static/img/dash.png" />

# NM2026 — New Monitor

## Sistema de Gestão de Ocorrências, Automação Operacional e Estruturação de Dados

O **NM2026** é uma aplicação web desenvolvida para substituir o antigo **New Monitor**, sistema utilizado no registro e acompanhamento de ocorrências de rede.

O projeto nasceu de um problema operacional real: a necessidade de registrar uma mesma falha diversas vezes para atender à granularidade exigida pelos processos de operação e geração de relatórios.

A proposta do NM2026 foi **separar a necessidade de registro operacional da necessidade de granularidade analítica**, permitindo que uma ocorrência seja registrada de forma centralizada, enquanto suas diferentes relações com cidades, serviços e demais informações operacionais permanecem estruturadas no banco de dados.

---

## 🎯 O problema

No modelo anterior, uma única falha que afetasse diversas localidades e serviços precisava ser desmembrada em vários tickets.

Por exemplo:

```text
1 falha
↓
30 cidades afetadas
↓
4 serviços afetados
↓
aproximadamente 130 registros/tickets
```

Esse modelo atendia à necessidade dos relatórios, mas criava uma sobrecarga significativa para o profissional responsável pela operação.

O operador precisava gastar uma parcela considerável do tempo **registrando a ocorrência**, quando esse tempo poderia ser utilizado em atividades de maior valor operacional, como:

* análise da falha;
* identificação de causa;
* acionamento de equipes;
* acompanhamento da recuperação;
* correlação de eventos;
* definição de ações de mitigação;
* acompanhamento da normalização dos serviços.

### O problema central

A granularidade necessária para os relatórios estava sendo transferida para a etapa de registro manual da ocorrência.

O NM2026 foi concebido para resolver exatamente essa situação.

---

# 💡 A solução

O NM2026 introduz uma abordagem baseada na separação entre:

**Ocorrência operacional**

e

**Entradas relacionadas à ocorrência.**

Em vez de exigir que o operador crie diversos tickets independentes, o sistema permite centralizar a ocorrência e armazenar suas relações no banco de dados.

Exemplo conceitual:

### Modelo anterior

```text
Falha
├── Cidade 01 / Serviço A → Ticket
├── Cidade 01 / Serviço B → Ticket
├── Cidade 01 / Serviço C → Ticket
├── Cidade 01 / Serviço D → Ticket
├── Cidade 02 / Serviço A → Ticket
├── Cidade 02 / Serviço B → Ticket
├── ...
└── Cidade 30 / Serviço D → Ticket

≈ 130 tickets
```

### Modelo NM2026

```text
                    ┌───────────────────┐
                    │      FALHA        │
                    │    1 ocorrência   │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      TICKET       │
                    │  registro central │
                    └─────────┬─────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │     BANCO DE DADOS     │
                 │                        │
                 │ Cidade 01 / Serviço A  │
                 │ Cidade 01 / Serviço B  │
                 │ Cidade 01 / Serviço C  │
                 │ Cidade 01 / Serviço D  │
                 │ ...                    │
                 │ Cidade 30 / Serviço D  │
                 └────────────────────────┘
```

O resultado é uma redução da quantidade de registros que o operador precisa realizar manualmente **sem eliminar a granularidade necessária para o tratamento e análise dos dados**.

---

# 📈 Impacto operacional

A principal proposta do NM2026 não é simplesmente "criar menos tickets".

O objetivo é **reduzir o trabalho administrativo associado ao registro das ocorrências e liberar capacidade operacional para atividades de maior valor**.

Com menos tempo dedicado ao preenchimento repetitivo, o profissional pode concentrar mais esforço em:

* análise de incidentes;
* investigação de causas;
* acionamento de equipes;
* acompanhamento de SLA;
* mitigação do impacto na rede;
* priorização de ocorrências;
* acompanhamento da normalização;
* identificação de recorrências e padrões.

Em termos de processo:

```text
ANTES

Registro manual
      ↓
Grande quantidade de tickets
      ↓
Tempo operacional consumido
      ↓
Menos tempo para análise
```

```text
NM2026

Registro centralizado
      ↓
Relacionamentos estruturados no banco
      ↓
Menos esforço administrativo
      ↓
Mais tempo para análise e atuação operacional
```

---

# 🏗️ Arquitetura e tecnologias

O projeto foi desenvolvido utilizando tecnologias Python e uma arquitetura web baseada em Flask.

### Principais tecnologias

* **Python**
* **Flask**
* **SQLAlchemy**
* **SQLite**
* **HTML**
* **CSS**
* **JavaScript**
* **Jinja2**
* **Flask-WTF**
* **Flask-Login**
* **Flask-Bcrypt**

A aplicação possui separação entre diferentes responsabilidades, incluindo rotas, modelos, formulários, banco de dados, templates e rotinas auxiliares.

A estrutura do projeto também contém scripts destinados à conversão, atualização e migração de estruturas e dados.

---

# 🗄️ Banco de dados

Uma das premissas do projeto é que o banco de dados não deve servir apenas como local de armazenamento dos tickets.

A estrutura deve permitir que os registros operacionais possam posteriormente ser utilizados para:

* análise de ocorrências;
* construção de indicadores;
* identificação de recorrências;
* análise regional;
* análise por serviço;
* acompanhamento de disponibilidade;
* avaliação de desempenho operacional;
* geração de informações gerenciais.

A utilização de uma estrutura relacional permite manter diferentes níveis de granularidade sem obrigar o usuário operacional a reproduzir manualmente essa granularidade durante o registro da ocorrência.

---

# 📊 Dados e Analytics

O NM2026 foi concebido também considerando a utilização futura dos dados operacionais para análises.

A estrutura permite trabalhar com diferentes dimensões de uma ocorrência, como:

```text
Ocorrência
│
├── Tempo
├── Localidade
├── Serviço
├── Categoria
├── Status
├── Impacto
└── Informações operacionais
```

Essa organização cria uma base para análises operacionais e gerenciais, possibilitando investigar questões como:

### Operação

* Quais regiões concentram mais ocorrências?
* Quais serviços apresentam maior quantidade de falhas?
* Quais tipos de ocorrência são mais recorrentes?
* Existem padrões temporais?
* Quais ocorrências possuem maior impacto?

### Qualidade

* Quais serviços apresentam maior indisponibilidade?
* Onde estão os principais ofensores?
* Quais problemas apresentam maior recorrência?
* Quais regiões necessitam de ações de melhoria?

### Gestão

* Como está evoluindo o volume de ocorrências?
* Quais indicadores apresentam tendência de deterioração?
* Onde concentrar recursos?
* Quais problemas devem ser priorizados?

### Financeiro

A estrutura dos dados também pode servir como fonte para análises que relacionem ocorrências, impacto operacional e indicadores financeiros, desde que os respectivos dados financeiros estejam disponíveis e relacionados à base.

---

# 📊 Dashboards e indicadores

O projeto também contempla a utilização dos dados estruturados para visualização e acompanhamento de informações operacionais.

A evolução natural da solução é transformar os registros de ocorrências em indicadores capazes de fornecer uma visão:

**Operacional → Tática → Gerencial**

Exemplo:

```text
DADOS OPERACIONAIS
        ↓
TRATAMENTO E ORGANIZAÇÃO
        ↓
INDICADORES
        ↓
DASHBOARDS
        ↓
INSIGHTS
        ↓
DECISÃO
        ↓
AÇÃO DE MELHORIA
```

Essa abordagem permite que o mesmo dado utilizado para registrar uma ocorrência possa posteriormente contribuir para análises de qualidade, disponibilidade, desempenho e gestão.

---

# 🔄 Antes x Depois

| Aspecto                       | Modelo anterior               | NM2026                                  |
| ----------------------------- | ----------------------------- | --------------------------------------- |
| Registro de uma ocorrência    | Múltiplos tickets             | Registro centralizado                   |
| Granularidade                 | Distribuída em vários tickets | Estruturada no banco                    |
| Trabalho manual               | Elevado                       | Reduzido                                |
| Tempo para registro           | Maior                         | Menor                                   |
| Tempo disponível para análise | Menor                         | Maior                                   |
| Dados para relatórios         | Mantidos                      | Mantidos por meio da estrutura de dados |
| Potencial analítico           | Fragmentado                   | Estruturado                             |
| Foco do operador              | Registro + operação           | Maior foco na operação                  |

---

# 🧠 Principal aprendizado do projeto

O principal conceito aplicado no desenvolvimento do NM2026 foi:

> **Não é necessário fazer o usuário executar manualmente todas as etapas necessárias para produzir a informação final.**

Uma aplicação bem estruturada pode capturar uma informação de forma simples e, a partir dela, organizar automaticamente os dados necessários para diferentes processos posteriores.

Essa mudança transforma o sistema de um simples **registrador de ocorrências** em uma ferramenta de **gestão operacional orientada a dados**.

---

# 🛠️ Estrutura do projeto

A aplicação possui, entre outros componentes:

```text
NM2026/
│
├── data/
├── instance/
├── newmonitor/
│   ├── data/
│   ├── static/
│   ├── templates/
│   ├── atualizar_estrutura_regionais.py
│   ├── base_to_db.py
│   ├── converter_base.py
│   ├── converter_csv.py
│   ├── converter_fechamento.py
│   ├── database.py
│   ├── forms.py
│   ├── migrar_estrutura.py
│   ├── migrar_regras_fechamento.py
│   ├── models.py
│   ├── routes.py
│   └── ticket_generator.py
│
├── main.py
├── requirements.txt
└── README.md
```

A existência de módulos específicos para banco de dados, modelos, rotas, geração de tickets, conversão e migração demonstra que o projeto foi desenvolvido considerando não apenas a interface da aplicação, mas também o ciclo de vida e a organização dos dados.

---

# 🚀 Possíveis evoluções

Entre as possibilidades de evolução do projeto estão:

* ampliação dos dashboards;
* indicadores de disponibilidade e qualidade;
* análise de recorrência;
* análise de SLA e MTTR;
* identificação automática de principais ofensores;
* análises temporais;
* integração com outras fontes de dados;
* APIs para integração com sistemas corporativos;
* automação de relatórios;
* camada analítica utilizando Python/Pandas;
* utilização de ferramentas de BI;
* modelos preditivos para identificação de tendências;
* melhoria da governança e qualidade dos dados.

---

# 🎓 Objetivo do projeto

O NM2026 representa a aplicação prática de conhecimentos de:

**Desenvolvimento de Software + Automação + Banco de Dados + Operações de Telecomunicações + Análise de Dados.**

Mais do que desenvolver uma nova aplicação, o projeto busca demonstrar como uma necessidade operacional pode ser transformada em uma solução tecnológica capaz de:

1. reduzir tarefas repetitivas;
2. melhorar a experiência do usuário operacional;
3. estruturar melhor os dados;
4. preservar a granularidade necessária para análise;
5. aumentar a capacidade de geração de indicadores;
6. apoiar decisões operacionais e gerenciais.

---

# 👨‍💻 Contexto profissional

O projeto foi desenvolvido a partir de uma necessidade observada em um ambiente real de operações de telecomunicações.

Essa experiência permitiu aplicar conhecimentos de operação de redes, gestão de incidentes, análise de processos e indicadores na construção de uma solução utilizando desenvolvimento de software, banco de dados e automação.

O projeto representa, portanto, uma aplicação prática da transição entre:

**Operações Críticas → Tecnologia → Dados → Automação → Analytics**

---

# 📌 Status

**Em desenvolvimento contínuo.**

A aplicação e sua estrutura de dados continuam sendo aprimoradas conforme novas necessidades operacionais e analíticas são identificadas.

---

## 🔗 Repositório

**GitHub:**
https://github.com/deegoo/NM2026

---

## 🧰 Tecnologias

`Python` `Flask` `SQLite` `SQLAlchemy` `HTML` `CSS` `JavaScript` `Jinja2` `Banco de Dados` `Automação` `Gestão de Incidentes` `Analytics` `Telecom`
