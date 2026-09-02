# WebSec Inspector — Backlog Inicial

Organizado por frente (dev, sec, QA, infra), como definido na gestão via Jira.
Cada história segue o formato "Como... quero... para..." com critérios de
aceite (DoD por história).

## Épico 1 — Autenticação e Contas (frente: dev)

**US01 — Cadastro de usuário**
Como visitante, quero me cadastrar com e-mail e senha, para acessar a plataforma.
- Critérios de aceite:
  - Senha armazenada com hash (BCrypt).
  - E-mail único, validado por formato.
  - Retorna erro claro em caso de e-mail duplicado.

**US02 — Login com JWT**
Como usuário cadastrado, quero autenticar com e-mail/senha, para obter um token JWT.
- Critérios de aceite:
  - Token expira em tempo configurável.
  - Endpoint protegido rejeita requisições sem token válido (401).

## Épico 2 — Submissão e verificação de domínio (frentes: dev, sec)

**US03 — Submeter URL para análise**
Como usuário autenticado, quero submeter uma URL, para iniciar uma avaliação de segurança.
- Critérios de aceite:
  - URL validada (formato, protocolo http/https).
  - Scan criado com status `PENDING_VERIFICATION`.

**US04 — Verificar propriedade do domínio**
Como sistema, quero exigir prova de propriedade do domínio, para impedir varreduras não autorizadas.
- Critérios de aceite:
  - Token de verificação único gerado por domínio.
  - Aceita verificação via DNS TXT ou meta tag HTML.
  - Scan só avança para `QUEUED` após verificação confirmada.

## Épico 3 — Execução de scans (frentes: sec, infra)

**US05 — Enfileirar scan**
Como backend, quero publicar o scan na fila Redis, para desacoplar a API do processamento.
- Critérios de aceite:
  - Mensagem contém id do scan e domínio de forma idempotente.
  - Falha ao publicar não deixa o scan em estado inconsistente.

**US06 — Executar varredura OWASP ZAP**
Como worker, quero executar o OWASP ZAP baseline + testes OWASP Top 10, para identificar vulnerabilidades.
- Critérios de aceite:
  - Execução ocorre em container isolado.
  - Timeout configurável; scan marcado `FAILED` se exceder o tempo.
  - Resultados brutos do ZAP armazenados para auditoria.

**US07 — Classificar achados com CVSS**
Como worker, quero calcular o score CVSS de cada achado, para indicar severidade.
- Critérios de aceite:
  - Cada `Finding` possui score numérico e categoria (baixo/médio/alto/crítico).
  - Mapeamento auditável (versão do CVSS usada documentada).

## Épico 4 — Relatórios (frentes: dev, sec)

**US08 — Gerar relatório em PDF**
Como usuário, quero receber um relatório em PDF, para compartilhar os achados com minha equipe.
- Critérios de aceite:
  - PDF contém sumário executivo, lista de achados, CVSS e recomendações.
  - Link/arquivo do PDF fica associado ao scan (`Report`).

**US09 — Enviar relatório por e-mail**
Como usuário, quero receber o relatório por e-mail, para não precisar acessar a plataforma.
- Critérios de aceite:
  - E-mail enviado após geração do PDF.
  - Falha de envio é logada e não derruba o fluxo do scan.

**US10 — Histórico e comparação de scans**
Como usuário, quero ver o histórico de varreduras de um domínio e comparar duas execuções, para acompanhar evolução.
- Critérios de aceite:
  - Listagem paginada por domínio.
  - Comparação exibe achados novos, corrigidos e persistentes.

## Épico 5 — Administração e Observabilidade (frentes: infra, QA)

**US11 — Painel administrativo**
Como administrador, quero ver indicadores gerais (scans por período, severidade média, usuários ativos), para acompanhar o uso da plataforma.

**US12 — Observabilidade**
Como time de infra, quero métricas (Prometheus) e dashboards (Grafana) dos workers e da API, para identificar problemas rapidamente.

**US13 — Pipeline CI/CD**
Como time de infra, quero pipelines automatizados (build, teste, deploy) para Dev/Homologação/Produção, para reduzir erro manual de deploy.

## Sprints sugeridos (visão inicial — 5 sprints)

| Sprint | Foco |
|---|---|
| 1 | US01, US02, setup de infra (docker-compose, CI básico) |
| 2 | US03, US04 (submissão + verificação de domínio) |
| 3 | US05, US06 (fila + execução do ZAP em worker isolado) |
| 4 | US07, US08, US09 (CVSS, PDF, e-mail) |
| 5 | US10, US11, US12, US13 (histórico, painel, observabilidade, CI/CD completo) |
