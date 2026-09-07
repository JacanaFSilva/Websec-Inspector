# WebSec Inspector — Arquitetura

**Atualizado em:** 09/09/2026

Este documento descreve a arquitetura **existente no código atual**. Funcionalidades previstas, mas ainda não implementadas, são indicadas explicitamente.

---

## 1. Visão arquitetural

O sistema utiliza uma arquitetura distribuída em containers, com separação entre:

- interface web;
- API de negócio;
- persistência;
- fila de processamento;
- worker de segurança;
- ferramenta de scanning;
- geração/envio de relatórios.

A principal decisão arquitetural é retirar a execução do scanner do ciclo síncrono da API.

```text
┌─────────────────────┐
│      Frontend       │
│ React + TypeScript  │
│      Tailwind       │
└──────────┬──────────┘
           │ HTTP/JSON
           ▼
┌─────────────────────┐
│     Backend API     │
│ Spring Boot + JWT   │
└──────┬────────┬─────┘
       │        │
       │        └─────────────────┐
       ▼                          ▼
┌──────────────┐            ┌──────────────┐
│ PostgreSQL   │            │    Redis     │
│              │            │ scan-queue   │
└──────────────┘            └──────┬───────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Python Worker     │
                          │                  │
                          │ OWASP ZAP API     │
                          │ PDF / SMTP        │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ ZAP               │
                          │ container         │
                          └──────────────────┘
```

---

## 2. Containers atuais

O `docker-compose.yml` define:

| Container | Função |
|---|---|
| `frontend` | aplicação web |
| `backend` | API REST |
| `worker` | processamento assíncrono dos scans |
| `postgres` | banco relacional |
| `redis` | fila de scans |
| `zap` | servidor OWASP ZAP |
| `mailhog` | SMTP/UI para e-mails de desenvolvimento |
| `prometheus` | infraestrutura de métricas preparada |
| `grafana` | infraestrutura de visualização preparada |

---

## 3. Fluxo de submissão

### 3.1 Autenticação

O frontend utiliza JWT recebido pelos endpoints de autenticação.

O backend protege os endpoints de negócio com Spring Security.

---

### 3.2 Submissão

O endpoint:

```text
POST /api/scans
```

recebe uma URL.

O backend:

1. normaliza a URL;
2. extrai o hostname;
3. remove `www.` quando aplicável;
4. valida a existência de um hostname;
5. cria ou reutiliza o `Domain` do usuário;
6. cria o `Scan`;
7. retorna o token de verificação.

O estado inicial é:

```text
PENDING_VERIFICATION
```

---

## 4. Verificação de propriedade

O serviço `DomainVerificationService` implementa dois mecanismos.

### DNS TXT

Consulta registros TXT do hostname procurando o token.

### Meta tag

Consulta a página inicial via HTTPS e, como fallback, HTTP, procurando:

```html
<meta name="websec-verification" content="TOKEN">
```

Somente após encontrar o token:

```text
PENDING_VERIFICATION
        ↓
QUEUED
```

O backend então publica o ID do scan em:

```text
scan-queue
```

no Redis.

---

## 5. Processamento assíncrono

O worker Python executa um loop que consome:

```text
scan-queue
```

através de `BRPOP`.

Para cada ID recebido:

```text
QUEUED
   ↓
RUNNING
   ↓
ZAP
   ↓
findings
   ↓
COMPLETED
```

Em caso de exceção:

```text
RUNNING
   ↓
FAILED
```

A API não permanece bloqueada esperando a execução do ZAP.

---

## 6. Integração atual com OWASP ZAP

O worker utiliza a API Python do ZAP.

O fluxo atualmente implementado é:

```text
target_url
    ↓
Spider
    ↓
aguarda 100%
    ↓
Active Scan
    ↓
aguarda 100%
    ↓
consulta alerts
```

### Importante

A implementação atual **não possui um conjunto próprio de testes para cada categoria do OWASP Top 10**.

Também não deve ser descrita como uma implementação de "baseline + testes customizados OWASP Top 10".

O que existe hoje é uma execução via API do ZAP utilizando spider e active scan.

---

## 7. Normalização dos achados

Cada alerta retornado pelo ZAP é transformado em um objeto contendo:

- categoria/código informado pelo alerta;
- descrição;
- score numérico atualmente aproximado;
- recomendação.

Os achados são persistidos na entidade `Finding`.

### Classificação atual

O worker utiliza o nível de risco textual do ZAP e faz um mapeamento aproximado:

| Risco ZAP | Valor atual |
|---|---:|
| High | 8.5 |
| Medium | 5.5 |
| Low | 3.0 |
| Informational | 0.5 |

Isso é **um mapeamento interno**, não um cálculo CVSS.

A entidade `Finding` posteriormente transforma o valor numérico em:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

conforme faixas de score.

### Débito técnico

Implementar CVSS real, incluindo versão utilizada e, idealmente, vetor, antes de apresentar os valores como CVSS no produto.

---

## 8. Persistência

O modelo atual contém:

```text
User
 └── Domain
      └── Scan
           └── Finding

Scan
 └── Report
```

### User

- `id`
- `email`
- `passwordHash`
- `name`
- `role`
- `createdAt`

### Domain

- `id`
- `user`
- `hostname`
- `verificationToken`
- `verifiedAt`

Existe uma restrição única para:

```text
hostname + user_id
```

### Scan

- `id`
- `domain`
- `status`
- `createdAt`
- `startedAt`
- `finishedAt`

Estados:

```text
PENDING_VERIFICATION
QUEUED
RUNNING
COMPLETED
FAILED
```

### Finding

- `id`
- `scan`
- `owaspCategory`
- `description`
- `cvssScore`
- `severity`
- `recommendation`

### Report

- `id`
- `scan`
- `pdfUrl`
- `sentAt`

A entidade existe, mas o fluxo atual do worker ainda não persiste automaticamente um `Report` correspondente após gerar o PDF.

---

## 9. Relatórios

O worker utiliza ReportLab para gerar:

```text
/data/reports/scan-{id}.pdf
```

O documento contém:

- título;
- hostname;
- ID do scan;
- total de achados;
- tabela de achados;
- categoria;
- descrição;
- score numérico;
- recomendação.

### E-mail

O worker envia o PDF via SMTP.

No ambiente Docker atual:

```text
SMTP → MailHog
```

A falha no envio é registrada em log e não altera o resultado do scan.

---

## 10. Frontend

O frontend atual contém telas para:

- login;
- cadastro;
- dashboard;
- submissão de scan;
- verificação de domínio;
- visualização do relatório.

A submissão possui mecanismo de tentativa automática para a verificação de propriedade enquanto a propagação do DNS ainda não estiver disponível.

O histórico possui suporte no backend, mas a interface ainda não representa todo o fluxo de histórico/comparação previsto no produto.

---

## 11. API atual

Principais endpoints relacionados ao scan:

```text
POST /api/scans
POST /api/scans/{id}/confirm-verification
GET  /api/scans/{id}
GET  /api/scans/domain/{domainId}/history
```

Autenticação:

```text
POST /api/auth/register
POST /api/auth/login
```

A API é documentada por OpenAPI/Swagger.

---

## 12. Observabilidade

Existem containers para:

```text
Prometheus
Grafana
```

e uma configuração do Prometheus apontando para:

```text
/actuator/prometheus
```

Entretanto, o backend atual não possui o Actuator configurado no `pom.xml`.

Portanto, neste ciclo:

> **Observabilidade está preparada em infraestrutura, mas não está implementada de ponta a ponta.**

Ainda faltam:

- Actuator;
- métricas da API;
- métricas do worker;
- dashboards versionados;
- alertas;
- estratégia de logs centralizados.

---

## 13. Banco de dados e migrations

O backend atualmente utiliza:

```yaml
spring.jpa.hibernate.ddl-auto: update
```

Isso é adequado para o estágio local/prototípico atual, mas não para uma estratégia madura de versionamento de schema.

Próximo passo recomendado:

```text
Flyway/Liquibase
       ↓
migrations versionadas
       ↓
ddl-auto: validate
```

---

## 14. CI/CD

O repositório não contém atualmente um pipeline GitHub Actions funcional para build, testes e deploy.

Portanto:

> CI/CD permanece como requisito e backlog, não como funcionalidade concluída.

---

## 15. Decisões arquiteturais

### ADR-001 — Processamento assíncrono

**Decisão:** utilizar Redis como fila.

**Motivo:** a execução de uma varredura pode durar minutos e não deve bloquear a requisição HTTP.

---

### ADR-002 — Worker separado

**Decisão:** executar o scanner em worker/container separado da API.

**Motivo:** ferramentas de segurança possuem comportamento e consumo de recursos diferentes da aplicação de negócio. O isolamento reduz o impacto de falhas.

---

### ADR-003 — Verificação do alvo

**Decisão:** exigir prova de controle do domínio antes de enfileirar o scan.

**Motivo:** impedir uso da plataforma para varreduras não autorizadas.

---

### ADR-004 — Não chamar o mapeamento atual de CVSS

**Decisão:** tratar o score atual como classificação aproximada baseada no risco do ZAP.

**Motivo:** simplesmente transformar `High` em `8.5`, por exemplo, não constitui cálculo CVSS. O produto deverá implementar um cálculo/versionamento de CVSS antes de utilizar essa nomenclatura.

---

## 16. Débitos arquiteturais prioritários

1. autorização por recurso/ownership;
2. persistência da URL original do alvo;
3. CVSS real;
4. mapeamento OWASP consistente;
5. persistência do `Report`;
6. armazenamento de evidências/resultados brutos do ZAP;
7. migrations;
8. testes automatizados;
9. observabilidade real;
10. CI/CD.
