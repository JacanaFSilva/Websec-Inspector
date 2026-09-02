# WebSec Inspector — Equipe

**Atualizado em:** 02/09/2026

A equipe é organizada por responsabilidades, mantendo possibilidade de colaboração entre frentes conforme a necessidade do backlog.

| Integrante | Papel principal | Responsabilidades |
|---|---|---|
| Jaçanã | PM/PO + arquitetura/dados | produto, backlog, requisitos, arquitetura, modelagem e integração das frentes |
| Jonathan Silva | Tech Lead | decisões técnicas, integração entre componentes e orientação de desenvolvimento |
| Hellen | QA | estratégia de testes, qualidade, validação e automação |
| Juan | UX/UI | experiência do usuário, fluxos e interface |
| Murilo | Dados/IA + produto | dados, apoio à definição de produto e classificação |
| Jonathan Luiz | Dados/IA | dados, inteligência e apoio às análises |
| Vitor | Front-end | implementação e integração da interface web |
| Gustavo | Back-end | API, regras de negócio e persistência |
| Romildo | Front-end + apoio QA | frontend, integração e apoio às atividades de qualidade |

---

## 1. Organização por frentes

### Produto / PM / PO

Responsável por:

- visão do produto;
- priorização;
- backlog;
- critérios de aceitação;
- acompanhamento do ciclo;
- alinhamento entre requisitos e implementação.

### Arquitetura / Tech Lead

Responsável por:

- decisões arquiteturais;
- padrões técnicos;
- integração backend/worker/frontend;
- revisão de decisões com impacto sistêmico.

### Back-end

Responsável por:

- API REST;
- autenticação;
- regras de negócio;
- persistência;
- fila;
- segurança de acesso aos recursos.

### Front-end

Responsável por:

- telas;
- fluxos de autenticação;
- submissão;
- verificação;
- resultados;
- histórico e experiência de uso.

### Segurança / Dados / IA

Responsável por:

- definição dos checks;
- interpretação dos achados;
- classificação;
- OWASP;
- CVSS;
- qualidade das evidências.

### QA

Responsável por:

- critérios de qualidade;
- testes;
- regressão;
- validação dos critérios de aceitação;
- evidências de funcionamento.

### Infra / DevOps

Responsável por:

- Docker;
- Redis;
- banco;
- worker;
- ZAP;
- observabilidade;
- CI/CD.

---

## 2. Regra de responsabilidade

A existência de um papel na tabela não significa que todas as atividades daquela frente sejam executadas exclusivamente pela pessoa indicada.

A distribuição de cada tarefa deve ser registrada no Jira, considerando:

- responsável;
- colaborador(es);
- prioridade;
- sprint/ciclo;
- critérios de aceitação.

---

## 3. Regra de documentação

Cada frente deve atualizar a documentação quando uma alteração modificar:

- comportamento do sistema;
- arquitetura;
- requisito;
- estado de uma história;
- modelo de dados;
- integração externa;
- procedimento de execução.

A documentação não deve declarar como concluído aquilo que existe apenas como planejamento ou scaffold.
