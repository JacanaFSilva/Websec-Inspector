# WebSec Inspector — Documento de Requisitos

Fábrica de Software 2026.2 — UTFPR (Prof. Bruno Honorato) — Grupo 3
Responsável PM/PO + Arquitetura/Dados: Jaçanã

## 1. Visão do Produto

Plataforma que recebe URLs autorizadas pelo usuário e executa verificações de
segurança **não destrutivas**, gerando um relatório técnico com achados,
classificação de risco e recomendações de correção. Foco em DevSecOps:
automação de varredura, processamento assíncrono e observabilidade.

## 2. Escopo (baseado no material da disciplina)

Está dentro do escopo:
- Cadastro/login de usuário com autenticação JWT.
- Submissão de uma URL para varredura.
- Verificação de propriedade do domínio antes de qualquer scan.
- Execução de testes baseados no OWASP Top 10 via OWASP ZAP + verificações
  customizadas.
- Classificação de vulnerabilidades usando CVSS.
- Histórico de varreduras e comparação entre execuções.
- Geração de relatório em PDF e envio por e-mail.
- Painel administrativo com indicadores.

Fora do escopo (v1):
- Testes destrutivos ou exploração ativa de vulnerabilidades (sem exploitation).
- Varredura de rede/infraestrutura fora do domínio autorizado.
- Multi-tenant empresarial (fica para trabalho futuro).

## 3. Requisitos Funcionais (RF)

| ID | Requisito |
|----|-----------|
| RF01 | O sistema deve permitir cadastro e login de usuário com JWT. |
| RF02 | O sistema deve permitir submissão de uma URL para análise. |
| RF03 | O sistema deve verificar a propriedade do domínio (ex: token DNS/meta tag) antes de iniciar o scan. |
| RF04 | O sistema deve executar verificações do OWASP Top 10 via OWASP ZAP. |
| RF05 | O sistema deve permitir verificações customizadas além do OWASP ZAP. |
| RF06 | O sistema deve classificar cada vulnerabilidade encontrada usando CVSS (score e severidade). |
| RF07 | O sistema deve manter histórico de varreduras por usuário/domínio. |
| RF08 | O sistema deve permitir comparação entre duas execuções de varredura. |
| RF09 | O sistema deve gerar relatório em PDF com achados e recomendações. |
| RF10 | O sistema deve enviar o relatório por e-mail ao usuário. |
| RF11 | O sistema deve oferecer painel administrativo com indicadores de uso e varreduras. |
| RF12 | O sistema deve processar as varreduras de forma assíncrona (fila), sem bloquear a API. |

## 4. Requisitos Não Funcionais (RNF)

| ID | Requisito |
|----|-----------|
| RNF01 | Autenticação e autorização via JWT em todos os endpoints protegidos. |
| RNF02 | Scans executados em workers isolados (containers) por questão de segurança/isolamento. |
| RNF03 | Processamento assíncrono via fila (Redis) para desacoplar API e execução dos scans. |
| RNF04 | Observabilidade: logs centralizados, métricas via Prometheus, dashboards via Grafana. |
| RNF05 | CI/CD via GitHub Actions para ambientes de Dev, Homologação e Produção. |
| RNF06 | Documentação de API via Swagger/OpenAPI. |
| RNF07 | Interface responsiva construída em React + TailwindCSS. |
| RNF08 | Nenhum scan deve ser executado sem verificação prévia de propriedade do domínio (compliance/ético). |

## 5. Stakeholders

- Professor orientador da disciplina (avaliador).
- Time de projeto (9 papéis — ver `docs/equipe.md`).
- Usuário final: donos de aplicações/sites que querem avaliar sua postura de segurança.

## 6. Critérios de Aceite Gerais

- Toda funcionalidade entregue deve ter história no Jira com critérios de aceite.
- Todo endpoint deve estar documentado no Swagger.
- Todo scan real só ocorre após verificação de propriedade do domínio.
