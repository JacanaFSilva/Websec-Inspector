# WebSec Inspector — Backlog do Produto

**Atualizado em:** 02/09/2026

Este documento substitui a visão de "sprints sugeridos" por uma visão de backlog baseada no estado real do produto.

A prioridade deve ser revisada no Jira conforme a evolução do ciclo.

---

## 1. Legenda

| Status | Significado |
|---|---|
| ✅ Concluído | Implementação integrada e demonstrável. |
| 🟡 Parcial | Parte da história está implementada. |
| 🚧 Em desenvolvimento | Item prioritário do ciclo atual. |
| ⬜ Backlog | Ainda não iniciado ou fora do foco imediato. |

---

# Épico 1 — Autenticação e contas

## US01 — Cadastro de usuário
**Status:** ✅

Como visitante, quero me cadastrar com nome, e-mail e senha para acessar a plataforma.

### Critérios de aceitação

- senha armazenada com hash;
- e-mail único;
- validação dos dados de entrada;
- erro compreensível para cadastro inválido ou duplicado.

---

## US02 — Login com JWT
**Status:** ✅

Como usuário cadastrado, quero autenticar com e-mail e senha para obter acesso à plataforma.

### Critérios de aceitação

- credenciais válidas geram JWT;
- token possui expiração configurada;
- endpoints protegidos rejeitam requisições sem autenticação válida.

---

# Épico 2 — Submissão e autorização do alvo

## US03 — Submeter URL
**Status:** ✅

Como usuário autenticado, quero informar uma URL para iniciar uma avaliação de segurança.

### Critérios de aceitação

- aceitar HTTP/HTTPS;
- extrair hostname;
- rejeitar alvo sem hostname válido;
- criar scan com `PENDING_VERIFICATION`.

---

## US04 — Verificar propriedade do domínio
**Status:** ✅

Como usuário, quero provar que controlo o domínio antes da análise para garantir que o scan seja autorizado.

### Critérios de aceitação

- gerar token de verificação;
- suportar DNS TXT;
- suportar meta tag;
- não enfileirar scan sem verificação;
- permitir nova tentativa enquanto a propagação não estiver concluída.

---

# Épico 3 — Execução de segurança

## US05 — Enfileirar scan
**Status:** ✅

Como sistema, quero colocar scans autorizados em uma fila para não bloquear a API.

### Critérios de aceitação

- scan verificado passa para `QUEUED`;
- ID é publicado na fila Redis;
- worker consegue consumir o ID;
- scan passa para `RUNNING`.

---

## US06 — Executar OWASP ZAP
**Status:** 🟡

Como sistema, quero executar uma varredura automatizada com OWASP ZAP para identificar possíveis problemas de segurança.

### Implementado

- worker Python;
- container separado;
- integração com API do ZAP;
- spider;
- active scan;
- coleta de alerts;
- persistência dos findings.

### Pendente

- timeout/retry mais robustos;
- armazenamento dos resultados brutos;
- evidências;
- classificação OWASP consistente;
- controle mais completo do alvo;
- endurecimento do isolamento.

---

## US07 — Classificar achados
**Status:** 🟡

Como analista, quero classificar os achados para permitir priorização.

### Implementado

- conversão do risco textual do ZAP em valor numérico;
- severidade interna derivada do score.

### Pendente

- implementação real de CVSS;
- definir versão do CVSS;
- armazenar vetor;
- documentar metodologia;
- separar claramente risco ZAP de CVSS.

---

## US08 — Checks baseados no OWASP Top 10
**Status:** ⬜

Como analista, quero identificar categorias relevantes do OWASP Top 10 de forma rastreável.

### Critérios de aceitação

- definir catálogo de checks;
- mapear evidência para categoria;
- permitir identificar a origem do finding;
- evitar afirmar cobertura de categoria sem evidência.

---

## US09 — Checks customizados
**Status:** ⬜

Como time de segurança, quero implementar verificações adicionais além das capacidades padrão do ZAP.

### Exemplos futuros

- headers de segurança;
- políticas de cookies;
- configurações de CORS;
- exposição de informações;
- configurações TLS/HTTP.

---

# Épico 4 — Resultados e relatórios

## US10 — Consultar resultado do scan
**Status:** 🟡

Como usuário, quero visualizar o estado e os achados da minha varredura.

### Implementado

- consulta por ID;
- retorno de findings;
- frontend para visualização do resultado.

### Pendente

- autorização por ownership;
- estados e mensagens mais completos;
- apresentação mais rica das evidências.

---

## US11 — Gerar relatório PDF
**Status:** 🟡

Como usuário, quero receber um relatório técnico para registrar os resultados.

### Implementado

- geração PDF;
- identificação do scan;
- hostname;
- quantidade de findings;
- tabela de findings;
- recomendações.

### Pendente

- persistência efetiva de `Report`;
- sumário executivo;
- evidências;
- classificação correta;
- distribuição por severidade;
- acabamento do documento.

---

## US12 — Enviar relatório por e-mail
**Status:** 🟡

Como usuário, quero receber o relatório por e-mail.

### Implementado

- SMTP;
- anexo PDF;
- MailHog no ambiente local;
- falha de envio não interrompe o processamento concluído.

### Pendente

- destinatário associado ao usuário;
- configuração de SMTP real;
- secrets fora do repositório;
- rastreamento persistido do envio.

---

## US13 — Histórico
**Status:** 🟡

Como usuário, quero visualizar minhas execuções anteriores.

### Implementado

- endpoint de histórico por domínio.

### Pendente

- autorização por ownership;
- integração completa no frontend;
- paginação;
- filtros.

---

## US14 — Comparação
**Status:** ⬜

Como usuário, quero comparar duas execuções para identificar evolução.

### Critérios de aceitação

A comparação deverá identificar:

- achados novos;
- achados corrigidos;
- achados persistentes;
- mudança de severidade;
- evolução geral.

---

# Épico 5 — Plataforma e administração

## US15 — Painel administrativo
**Status:** ⬜

Como administrador, quero indicadores gerais da plataforma.

### Indicadores previstos

- scans por período;
- scans por estado;
- distribuição de severidade;
- usuários;
- falhas;
- tempo médio de execução.

---

## US16 — Observabilidade
**Status:** 🟡

Como equipe de engenharia, quero observar a saúde do sistema.

### Já existente

- containers Prometheus/Grafana;
- configuração inicial do Prometheus.

### Pendente

- Actuator;
- métricas do backend;
- métricas do worker;
- dashboards;
- alertas;
- logs centralizados.

---

## US17 — CI/CD
**Status:** ⬜

Como equipe de engenharia, quero automatizar build e testes.

### Critérios de aceitação

- build automatizado;
- testes automatizados;
- validação do backend;
- validação do frontend;
- build das imagens;
- estratégia de deploy definida.

---

# Épico 6 — Qualidade e manutenção

## US18 — Testes automatizados
**Status:** ⬜

Como equipe, quero testes automatizados para reduzir regressões.

### Cobertura desejada

- autenticação;
- verificação de domínio;
- submissão;
- transições de estado;
- fila;
- persistência;
- classificação;
- endpoints protegidos.

---

## US19 — Migrations do banco
**Status:** ⬜

Como equipe, quero versionar alterações do schema.

### Critérios de aceitação

- Flyway ou Liquibase;
- migrations versionadas;
- ambiente reproduzível;
- `ddl-auto` migrado para `validate`.

---

## US20 — Autorização por ownership
**Status:** 🚧

Como usuário, quero que meus scans e domínios sejam acessíveis somente pela minha conta.

### Critérios de aceitação

- `GET /api/scans/{id}` valida proprietário;
- confirmação de verificação valida proprietário;
- histórico valida proprietário;
- findings seguem o scan autorizado;
- ADMIN possui acesso administrativo somente quando necessário.

---

## US21 — Preservar alvo original
**Status:** 🚧

Como usuário, quero que o sistema preserve a URL submetida para que a análise seja executada sobre o alvo efetivamente informado.

### Critérios de aceitação

- armazenar URL original/normalizada;
- manter hostname separado;
- worker utilizar o alvo persistido;
- suportar portas e caminhos quando permitidos pela regra de negócio.

---

# 2. Ordem recomendada do próximo ciclo

## P0

1. US20 — ownership;
2. US21 — alvo original;
3. correções de estados e falhas;
4. testes básicos dos fluxos críticos.

## P1

5. US07 — CVSS;
6. US08 — OWASP;
7. US09 — checks customizados;
8. US11 — relatório completo.

## P2

9. US13 — histórico;
10. US14 — comparação;
11. US12 — e-mail real.

## P3

12. US18 — testes;
13. US19 — migrations;
14. US16 — observabilidade;
15. US17 — CI/CD.

## P4

16. US15 — painel administrativo.

---

## 3. Observação sobre Jira

O Jira deve ser considerado a fonte operacional do backlog.

Este arquivo descreve o **estado técnico consolidado do repositório**. Alterações de prioridade, responsável, estimativa e sprint devem ser registradas no Jira e posteriormente refletidas aqui quando alterarem o estado do produto.
