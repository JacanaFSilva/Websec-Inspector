# WebSec Inspector — Documento de Requisitos

**Atualizado em:** 09/09/2026

Este documento registra os requisitos do produto e separa requisito de estado atual de implementação.

---

## 1. Visão do produto

O WebSec Inspector é uma plataforma destinada à avaliação automatizada de segurança de aplicações web autorizadas.

O usuário submete um alvo, comprova controle sobre o domínio e, somente então, o sistema enfileira uma varredura executada de forma assíncrona por um worker isolado.

O resultado é composto por achados de segurança, classificação de risco, recomendações e relatório técnico.

---

## 2. Princípios de escopo

### Dentro do escopo

- autenticação de usuários;
- submissão de alvos web;
- verificação de propriedade do domínio;
- processamento assíncrono;
- integração com OWASP ZAP;
- persistência dos resultados;
- geração de relatório;
- envio de relatório por e-mail;
- histórico de scans;
- evolução para classificação CVSS;
- evolução para checks baseados no OWASP Top 10;
- observabilidade;
- administração.

### Fora do escopo

- exploração destrutiva de vulnerabilidades;
- testes destinados a causar indisponibilidade;
- varredura arbitrária de infraestrutura não autorizada;
- exploração pós-descoberta;
- multi-tenant empresarial avançado neste ciclo.

---

## 3. Estado dos requisitos

| Status | Definição |
|---|---|
| ✅ Implementado | Requisito atendido pelo código atual. |
| 🟡 Parcial | Existe implementação, mas o requisito ainda não está completo. |
| 🚧 Em desenvolvimento | Próximo foco de implementação. |
| ⬜ Pendente | Ainda não implementado. |

---

## 4. Requisitos funcionais

| ID | Requisito | Estado | Observação |
|---|---|---|---|
| RF01 | Permitir cadastro e login de usuário com JWT. | ✅ | Implementado no backend e frontend. |
| RF02 | Permitir submissão de URL para análise. | ✅ | URL é normalizada e o hostname é extraído. |
| RF03 | Verificar propriedade do domínio antes do scan. | ✅ | DNS TXT e meta tag. |
| RF04 | Executar verificações de segurança utilizando OWASP ZAP. | 🟡 | Spider + active scan estão implementados; checks próprios do OWASP Top 10 ainda não. |
| RF05 | Executar verificações customizadas além do ZAP. | ⬜ | Ainda não implementado. |
| RF06 | Classificar vulnerabilidades utilizando CVSS. | 🟡 | Há score aproximado baseado no risco ZAP; não é CVSS real. |
| RF07 | Manter histórico de scans por usuário/domínio. | 🟡 | Endpoint de histórico existe; interface e autorização precisam ser completadas. |
| RF08 | Comparar duas execuções. | ⬜ | Ainda não implementado. |
| RF09 | Gerar relatório PDF. | 🟡 | PDF é gerado pelo worker; associação persistida em `Report` ainda precisa ser completada. |
| RF10 | Enviar relatório por e-mail. | 🟡 | Funciona no ambiente de desenvolvimento via MailHog; integração com destinatário real ainda não está concluída. |
| RF11 | Oferecer painel administrativo. | ⬜ | Modelo possui `ADMIN`, mas painel não está implementado. |
| RF12 | Processar scans de forma assíncrona. | ✅ | Redis + worker Python. |

---

## 5. Requisitos não funcionais

| ID | Requisito | Estado | Observação |
|---|---|---|---|
| RNF01 | Autenticação e autorização nos endpoints protegidos. | 🟡 | JWT/autenticação implementados; autorização por ownership ainda precisa ser reforçada. |
| RNF02 | Isolar execução dos scanners em containers. | ✅ | Worker e ZAP separados. |
| RNF03 | Utilizar fila para desacoplar API e execução. | ✅ | Redis. |
| RNF04 | Disponibilizar observabilidade com métricas e dashboards. | 🟡 | Containers preparados; integração efetiva ainda pendente. |
| RNF05 | Disponibilizar CI/CD. | ⬜ | Não há pipeline funcional no estado atual. |
| RNF06 | Documentar API com OpenAPI/Swagger. | ✅ | Springdoc configurado. |
| RNF07 | Interface responsiva em React + TailwindCSS. | 🟡 | Interface atual implementada; evolução visual e cobertura funcional continuam no backlog do Project. |
| RNF08 | Nunca executar scan sem verificação de propriedade. | ✅ | A transição para `QUEUED` exige verificação. |
| RNF09 | Isolar recursos por usuário. | 🚧 | Deve ser consolidado em todos os endpoints que recebem IDs de recursos. |
| RNF10 | Versionar o schema do banco. | ⬜ | Atualmente utiliza `ddl-auto: update`. |

---

## 6. Requisitos de segurança

### RF-S01 — Autorização do alvo

Nenhuma varredura deve ser enviada ao worker antes da comprovação de controle do domínio.

### RF-S02 — Autenticação

Endpoints protegidos devem exigir JWT válido.

### RF-S03 — Ownership

Usuários devem acessar somente:

- seus próprios domínios;
- seus próprios scans;
- seus próprios findings;
- seus próprios relatórios.

Operações administrativas deverão utilizar autorização específica por papel.

### RF-S04 — Execução isolada

A ferramenta de scanning deve permanecer separada da API de negócio.

### RF-S05 — Natureza não destrutiva

O produto não deve executar funcionalidades de exploração destrutiva como objetivo do projeto.

---

## 7. Requisitos de dados

### Usuário

Deve possuir:

- identificação;
- nome;
- e-mail único;
- senha armazenada como hash;
- papel;
- data de criação.

### Domínio

Deve possuir:

- usuário proprietário;
- hostname;
- token de verificação;
- data de verificação.

### Scan

Deve possuir:

- domínio;
- estado;
- timestamps;
- futuramente, alvo original completo.

Estados atuais:

```text
PENDING_VERIFICATION
QUEUED
RUNNING
COMPLETED
FAILED
```

### Finding

Deve possuir:

- scan;
- identificação/categoria;
- descrição;
- score;
- severidade;
- recomendação.

---

## 8. Requisitos de relatório

O relatório deverá evoluir para conter:

- identificação do alvo;
- data da análise;
- resumo executivo;
- quantidade de achados;
- distribuição por severidade;
- identificação dos achados;
- evidências;
- classificação;
- recomendações;
- informações suficientes para auditoria da execução.

O PDF atual representa uma primeira versão funcional e ainda não atende a todo esse conjunto.

---

## 9. Critérios de aceitação gerais

1. Toda funcionalidade deve possuir uma história ou item rastreável no GitHub Projects.
2. Endpoints devem estar documentados no Swagger.
3. Um scan não pode entrar em `QUEUED` sem verificação de propriedade.
4. Erros devem produzir resposta HTTP coerente e mensagem compreensível.
5. O worker deve atualizar o estado do scan.
6. Falhas no processamento devem resultar em `FAILED`.
7. O envio de e-mail não deve derrubar um scan já concluído.
8. Dados pertencentes a outro usuário não devem ser retornados por endpoints protegidos.
9. Funcionalidades marcadas como implementadas na documentação devem ser demonstráveis no código.

---

## 10. Critérios de pronto do ciclo

Uma história somente deve ser considerada concluída quando:

- código implementado;
- fluxo integrado;
- tratamento de erro mínimo;
- teste correspondente quando aplicável;
- documentação atualizada;
- critério de aceitação demonstrável;
- status atualizado no GitHub Projects.

---

## 11. Priorização atual

A priorização operacional e o estado de execução devem ser acompanhados no GitHub Projects. Abaixo permanece somente a ordem técnica de referência:

### P0 — Integridade e segurança

- ownership de recursos;
- alvo original;
- consistência dos estados;
- tratamento de falhas.

### P1 — Qualidade da análise

- CVSS real;
- classificação OWASP;
- checks customizados;
- evidências do ZAP;
- relatório completo.

### P2 — Produto

- histórico;
- comparação;
- e-mail real;
- frontend do resultado.

### P3 — Operação

- testes automatizados;
- Actuator;
- Prometheus;
- Grafana;
- logs;
- migrations;
- CI/CD.

### P4 — Administração

- painel administrativo;
- indicadores;
- funcionalidades específicas de `ADMIN`.
