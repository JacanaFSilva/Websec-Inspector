# WebSec Inspector

Fábrica de Software 2026.2 — UTFPR (Prof. Bruno Honorato) — Grupo 3
Plataforma que recebe URLs autorizadas e executa verificações de segurança
não destrutivas (baseadas no OWASP Top 10), gerando relatório técnico com
achados classificados por CVSS.

## Estrutura do repositório

```
websec-inspector/
├── docs/                 # requisitos, arquitetura, backlog inicial
├── backend/              # API — Spring Boot + JWT + Swagger
├── frontend/             # UI — React + TypeScript + TailwindCSS
├── worker/               # Worker Python — OWASP ZAP + geração de PDF/e-mail
├── infra/                # config de observabilidade (Prometheus)
├── .github/workflows/    # pipeline CI/CD
└── docker-compose.yml    # orquestra tudo localmente
```

## Como rodar localmente

Pré-requisitos: Docker e Docker Compose.

```bash
docker compose up --build
```

Serviços expostos:
- Frontend: http://localhost:5173
- Backend (API): http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html
- MailHog (inbox de e-mails de teste): http://localhost:8025
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090

## Fluxo funcional (v1)

1. Usuário se cadastra/loga (JWT).
2. Submete uma URL → sistema extrai o domínio e pede verificação de propriedade.
3. Após confirmação, o scan é enfileirado (Redis) e processado por um worker isolado.
4. Worker executa OWASP ZAP, classifica achados com CVSS, salva no PostgreSQL.
5. Worker gera relatório PDF e envia por e-mail; frontend exibe o relatório.

## Documentação

- [`docs/requisitos.md`](docs/requisitos.md) — requisitos funcionais e não funcionais.
- [`docs/arquitetura.md`](docs/arquitetura.md) — arquitetura, fluxo e ADRs.
- [`docs/backlog.md`](docs/backlog.md) — épicos, histórias de usuário e sprints sugeridos.

## Estado deste scaffold

Este repositório é o **ponto de partida** do projeto (setup de infra, modelo
de dados, autenticação, fluxo de submissão/verificação, esqueleto do worker
com integração ao OWASP ZAP, geração de PDF e pipeline de CI/CD). Pontos que
o time deve evoluir por sprint:

- [ ] Ajustar schema real do banco (migrations, ex. Flyway/Liquibase).
- [ ] Implementar verificação de propriedade de domínio de fato (DNS TXT/meta tag) no backend.
- [ ] Painel administrativo com indicadores (US11).
- [ ] Comparação entre execuções de scan (US10).
- [ ] Métricas customizadas expostas via Actuator + Prometheus (US12).
- [ ] Testes automatizados (unitários e de integração) por frente.
- [ ] Secrets reais de produção (JWT, SMTP, banco) fora do repositório.

## Papéis do time

Ver `docs/backlog.md` para a organização por frente (dev, sec, QA, infra).
