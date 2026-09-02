# WebSec Inspector

**Fábrica de Software 2026.2 — UTFPR — Grupo 3**

Plataforma web para avaliação de segurança de aplicações acessíveis por HTTP/HTTPS. O sistema exige uma comprovação de controle sobre o domínio antes de colocar uma varredura na fila de execução e utiliza processamento assíncrono para executar análises com OWASP ZAP em um worker isolado.

> **Estado da documentação:** atualizado em **02/09/2026**, com base no código presente neste repositório. Funcionalidades ainda não implementadas são tratadas como backlog e não como capacidades disponíveis.

---

## 1. Estado atual

O repositório já possui um fluxo vertical funcional composto por:

- cadastro de usuário;
- autenticação com JWT;
- submissão de URL;
- normalização e validação básica do hostname;
- criação/reutilização de domínio por usuário;
- verificação de propriedade por DNS TXT ou meta tag HTML;
- fila Redis;
- worker Python isolado;
- integração com OWASP ZAP;
- persistência dos achados no PostgreSQL;
- geração de relatório PDF;
- envio de relatório por e-mail em ambiente de desenvolvimento via MailHog;
- frontend React/TypeScript para autenticação, submissão e acompanhamento do fluxo.

Há funcionalidades **parciais ou ainda pendentes**, especialmente histórico apresentado no frontend, comparação de execuções, classificação CVSS real, checks customizados, painel administrativo, observabilidade efetiva e CI/CD.

### Legenda

| Status | Significado |
|---|---|
| ✅ Implementado | Existe implementação funcional no código atual. |
| 🟡 Parcial | Existe parte do fluxo, mas ainda falta completar integração, regra ou interface. |
| 🚧 Em desenvolvimento | Faz parte do próximo ciclo técnico/produto. |
| ⬜ Backlog | Ainda não implementado. |

---

## 2. Arquitetura atual

```text
                         ┌──────────────────────┐
                         │      Frontend        │
                         │ React + TypeScript   │
                         │      + Tailwind      │
                         └──────────┬───────────┘
                                    │ HTTP/JSON
                                    ▼
                         ┌──────────────────────┐
                         │     Backend API      │
                         │ Spring Boot + JWT    │
                         └───────┬────────┬─────┘
                                 │        │
                    ┌────────────┘        └────────────┐
                    ▼                                  ▼
             ┌─────────────┐                    ┌─────────────┐
             │ PostgreSQL  │                    │    Redis    │
             │ persistência│                    │ scan-queue  │
             └─────────────┘                    └──────┬──────┘
                                                       │
                                                       ▼
                                             ┌──────────────────┐
                                             │ Python Worker    │
                                             │ + OWASP ZAP API  │
                                             └────────┬─────────┘
                                                      │
                                                      ▼
                                             ┌──────────────────┐
                                             │ PDF + e-mail     │
                                             │ MailHog em Dev   │
                                             └──────────────────┘

              Infraestrutura auxiliar:
              Prometheus + Grafana (containers preparados)
```

O fluxo de análise é assíncrono para evitar que a API permaneça bloqueada durante uma operação potencialmente longa.

---

## 3. Fluxo funcional implementado

1. O usuário cria uma conta ou realiza login.
2. O backend emite um JWT.
3. O usuário envia uma URL.
4. O backend normaliza a URL e extrai o hostname.
5. O sistema cria ou reutiliza um `Domain` associado ao usuário.
6. É criado um `Scan` com status `PENDING_VERIFICATION`.
7. O usuário recebe um token de verificação.
8. O backend tenta comprovar o controle do domínio por:
   - registro DNS TXT; ou
   - meta tag `websec-verification` na página inicial.
9. Após a verificação, o scan passa para `QUEUED`.
10. O ID do scan é publicado na lista Redis `scan-queue`.
11. O worker consome o ID e muda o scan para `RUNNING`.
12. O worker executa spider e active scan através da API do OWASP ZAP.
13. Os alertas retornados são normalizados e persistidos como `Finding`.
14. O scan passa para `COMPLETED`; em caso de exceção, passa para `FAILED`.
15. O worker gera um PDF.
16. O relatório pode ser enviado por SMTP; no ambiente Docker atual, o destino é o MailHog.

---

## 4. O que o sistema NÃO faz atualmente

Para evitar divergência entre documentação e implementação, os itens abaixo **não devem ser apresentados como funcionalidades concluídas**:

- implementação completa dos dez grupos do OWASP Top 10 como conjunto de checks próprios;
- checks customizados independentes do ZAP;
- cálculo real de CVSS;
- armazenamento dos resultados brutos do ZAP para auditoria;
- comparação entre duas execuções;
- painel administrativo;
- métricas customizadas da API/worker;
- dashboards Grafana versionados;
- pipeline CI/CD funcional;
- migrations com Flyway/Liquibase;
- persistência completa da entidade `Report` pelo worker;
- histórico apresentado integralmente na interface.

O ZAP atualmente fornece um nível de risco textual (`High`, `Medium`, `Low`, `Informational`) que é convertido no worker para valores numéricos aproximados. **Esses valores não devem ser chamados de CVSS até que o cálculo e a versão do padrão sejam efetivamente implementados.**

---

## 5. Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React, TypeScript, Vite, TailwindCSS |
| Backend | Java 17, Spring Boot 3.3.2 |
| Segurança | Spring Security + JWT |
| Persistência | PostgreSQL + Spring Data JPA |
| Fila | Redis |
| Scanner | OWASP ZAP |
| Worker | Python |
| Relatório | ReportLab |
| E-mail de desenvolvimento | MailHog / SMTP |
| API | REST + OpenAPI/Swagger |
| Containers | Docker / Docker Compose |
| Observabilidade preparada | Prometheus + Grafana |

---

## 6. Estrutura do repositório

```text
websec-inspector/
├── backend/              # API Spring Boot
├── frontend/             # Aplicação React
├── worker/               # Worker Python + ZAP + relatórios
├── infra/                # Configurações de infraestrutura
├── docs/                 # Documentação do projeto
├── docker-compose.yml    # Ambiente local
└── README.md
```

---

## 7. Como executar

### Pré-requisitos

- Docker Desktop;
- Docker Compose.

### Subir o ambiente

```bash
docker compose up --build
```

### Serviços locais

| Serviço | Endereço |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| MailHog | http://localhost:8025 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |
| OWASP ZAP | http://localhost:8090 |

> Prometheus e Grafana estão presentes no `docker-compose.yml`, mas a integração de métricas da aplicação ainda precisa ser concluída.

---

## 8. Segurança e autorização do alvo

A propriedade do domínio é uma condição obrigatória do fluxo. O objetivo é impedir que a plataforma seja utilizada para executar scans contra terceiros sem autorização.

Os métodos atualmente implementados são:

### DNS TXT

O usuário publica o token fornecido pelo sistema como registro TXT do hostname.

### Meta tag

O usuário adiciona:

```html
<meta name="websec-verification" content="TOKEN" />
```

na página inicial.

O backend consulta o domínio e somente enfileira o scan quando encontra o token.

> A validação de propriedade é uma barreira de autorização do alvo; ela não substitui a necessidade de implementar autorização por recurso para garantir que um usuário autenticado só acesse seus próprios scans e domínios.

---

## 9. Próximo ciclo

Prioridade recomendada:

1. completar isolamento de dados por usuário;
2. preservar o alvo/URL original do scan;
3. corrigir o modelo de classificação de risco;
4. implementar CVSS de forma tecnicamente correta;
5. mapear os achados para OWASP de forma consistente;
6. persistir o relatório associado ao scan;
7. completar a visualização do resultado e histórico;
8. adicionar testes automatizados;
9. implementar observabilidade real;
10. somente depois avançar para comparação, administração e CI/CD completo.

---

## 10. Documentação

- [`docs/requisitos.md`](docs/requisitos.md) — requisitos e estado de implementação.
- [`docs/arquitetura.md`](docs/arquitetura.md) — arquitetura efetivamente existente e decisões técnicas.
- [`docs/backlog.md`](docs/backlog.md) — backlog priorizado do produto e próximo ciclo.
- [`docs/equipe.md`](docs/equipe.md) — papéis e responsabilidades da equipe.

---

## 11. Princípio de atualização da documentação

A documentação deve acompanhar o estado real do código.

Uma funcionalidade somente deve ser marcada como **implementada** quando houver implementação verificável no repositório e integração suficiente para demonstrá-la. Planejamento, intenção arquitetural e código de infraestrutura preparado não devem ser descritos como funcionalidade concluída.
