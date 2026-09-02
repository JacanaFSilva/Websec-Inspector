# WebSec Inspector — Arquitetura

## 1. Visão Geral

Arquitetura assíncrona orientada a filas, separando a API (síncrona) da
execução dos scans (potencialmente longa), com workers isolados para conter
o "blast radius" das ferramentas de varredura.

```
┌─────────────┐      HTTPS       ┌──────────────────┐
│   Frontend   │ ───────────────▶│   Backend API     │
│ React + TW   │◀─────────────── │  Spring Boot/JWT  │
└─────────────┘      JSON        └─────────┬─────────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         ▼                  ▼                  ▼
                  ┌─────────────┐   ┌───────────────┐   ┌─────────────┐
                  │ PostgreSQL  │   │  Redis (fila)  │   │  SMTP (mail) │
                  │  (dados)    │   │  scan-queue    │   │  relatórios  │
                  └─────────────┘   └───────┬────────┘   └─────────────┘
                                             ▼
                                   ┌────────────────────┐
                                   │  Worker(s) isolados │
                                   │  Python/Node.js     │
                                   │  + OWASP ZAP        │
                                   └──────────┬──────────┘
                                              ▼
                                   ┌────────────────────┐
                                   │  Geração de PDF     │
                                   │  + CVSS scoring     │
                                   └────────────────────┘

  Observabilidade: Prometheus (métricas) + Grafana (dashboards) + logs centralizados
```

## 2. Fluxo principal (submissão de scan)

1. Usuário autentica (JWT) e submete uma URL.
2. Backend valida formato da URL e cria registro `Scan` com status `PENDING_VERIFICATION`.
3. Backend gera um token de verificação de propriedade (ex: registro DNS TXT
   ou meta tag na página) e retorna instruções ao usuário.
4. Usuário confirma; backend valida a propriedade e muda o status para `QUEUED`.
5. Backend publica uma mensagem na fila Redis (`scan-queue`).
6. Um worker consome a mensagem, executa o OWASP ZAP (baseline + testes
   customizados do OWASP Top 10) contra a URL, em container isolado.
7. Worker calcula CVSS por achado, grava resultados no PostgreSQL, muda
   status para `COMPLETED` (ou `FAILED`).
8. Worker/serviço de relatório gera PDF e dispara e-mail via SMTP.
9. Frontend consulta o status (polling ou notificação) e exibe o relatório.

## 3. Modelo de dados (visão macro)

- **User** (id, nome, email, senha_hash, role)
- **Domain** (id, user_id, hostname, verification_token, verified_at)
- **Scan** (id, domain_id, status, started_at, finished_at, tipo)
- **Finding** (id, scan_id, categoria_owasp, descricao, cvss_score, severidade, recomendacao)
- **Report** (id, scan_id, pdf_url, enviado_em)

## 4. Componentes e responsabilidades

| Componente | Responsabilidade | Tecnologia |
|---|---|---|
| Frontend | UI, autenticação, submissão/visualização | React, TypeScript, TailwindCSS |
| Backend API | Regras de negócio, auth, orquestração da fila | Spring Boot, JWT, Swagger |
| Worker | Execução do scan (OWASP ZAP), cálculo CVSS | Python/Node.js, Docker |
| Banco de dados | Persistência relacional | PostgreSQL |
| Fila | Desacoplar API e worker | Redis |
| Observabilidade | Métricas, dashboards, logs | Prometheus, Grafana |
| CI/CD | Build, testes, deploy por ambiente | GitHub Actions, Docker |

## 5. Decisões de arquitetura (ADR resumido)

- **ADR-01**: Processamento assíncrono via fila (Redis) em vez de chamada
  síncrona ao ZAP — scans podem levar minutos; API não pode bloquear.
- **ADR-02**: Workers isolados em containers próprios — isola execução de
  ferramentas de scanning do restante do sistema (segurança/estabilidade).
- **ADR-03**: Verificação de propriedade de domínio é obrigatória e ocorre
  antes de qualquer scan — requisito ético/legal do projeto.
- **ADR-04**: CVSS como padrão de classificação de severidade — métrica
  reconhecida pela indústria, facilita comparação entre execuções.
