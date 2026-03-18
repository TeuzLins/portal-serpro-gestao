<div align="center">

```
███████╗███████╗██████╗ ██████╗ ██████╗  ██████╗
██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔═══██╗
███████╗█████╗  ██████╔╝██████╔╝██████╔╝██║   ██║
╚════██║██╔══╝  ██╔══██╗██╔═══╝ ██╔══██╗██║   ██║
███████║███████╗██║  ██║██║     ██║  ██║╚██████╔╝
╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝
```

# Portal SERPRO — Gestão de Empregados e Dossiês

**API REST profissional em Node.js + Express + PostgreSQL com arquitetura em camadas,  
autenticação JWT, importação CSV e ambiente completo Dockerizado.**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org)

</div>

---

## Sobre o Projeto

O **Portal SERPRO** é um sistema interno de gestão desenvolvido para centralizar o controle de empregados e dossiês da organização. O sistema oferece uma interface moderna e responsiva, com autenticação segura, importação em massa via CSV e persistência de dados em banco PostgreSQL.

### Funcionalidades

- **Autenticação** — Registro, login com senha criptografada (bcrypt + JWT) e consulta do token atual
- **Gestão de Empregados** — Cadastro, consulta por ID, edição, exclusão e filtros avançados com paginação
- **Gestão de Dossiês** — Controle completo de dossiês com filtros e paginação
- **Dashboard** — Painel executivo com métricas em tempo real
- **Importação CSV** — Upload em massa de empregados e dossiês com relatório de erros
- **Health Check** — Endpoint de monitoramento do sistema
- **Docker** — Ambiente completo containerizado com 3 serviços

---

## Arquitetura

### Infraestrutura

```
┌─────────────────────────────────────────┐
│              Docker Compose             │
│                                         │
│  ┌──────────┐    ┌──────────────────┐  │
│  │  Nginx   │───▶│   API Node.js    │  │
│  │  :80     │    │   Express :3000  │  │
│  └──────────┘    └────────┬─────────┘  │
│                           │            │
│                  ┌────────▼─────────┐  │
│                  │   PostgreSQL 16  │  │
│                  │      :5432       │  │
│                  └──────────────────┘  │
└─────────────────────────────────────────┘
```

### Estrutura do Código (Arquitetura em Camadas)

```
src/
├── config/
│   ├── database.js        # Pool PostgreSQL centralizado
│   └── jwt.js             # Assinar / verificar tokens
├── controllers/           # Recebe req/res, delega ao service
│   ├── auth.controller.js
│   ├── empregado.controller.js
│   ├── dossie.controller.js
│   └── dashboard.controller.js
├── services/              # Regras de negócio (sem req/res)
│   ├── auth.service.js
│   ├── empregado.service.js
│   ├── dossie.service.js
│   └── dashboard.service.js
├── repositories/          # Queries SQL (sem lógica de negócio)
│   ├── auth.repository.js
│   ├── empregado.repository.js
│   ├── dossie.repository.js
│   └── dashboard.repository.js
├── middlewares/
│   ├── auth.middleware.js          # Valida Bearer JWT
│   ├── validate.middleware.js      # Coleta erros do express-validator
│   └── errorHandler.middleware.js  # Handler global de exceções
├── validators/            # Regras de entrada (express-validator)
│   ├── auth.validator.js
│   ├── empregado.validator.js
│   └── dossie.validator.js
├── routes/
│   ├── index.js           # Agrega todas as rotas em /api/v1
│   ├── auth.routes.js
│   ├── empregado.routes.js
│   ├── dossie.routes.js
│   └── dashboard.routes.js
├── utils/
│   ├── AppError.js        # Erro HTTP tipado
│   └── response.js        # Helpers ok/created/paginated
├── app.js                 # Factory do Express (middlewares globais)
└── server.js              # Entry point + graceful shutdown
```

### Fluxo de uma Requisição

```
HTTP Request
  → Nginx (reverse proxy)
    → Express (helmet, cors, rate-limit, morgan)
      → Router
        → Validator (express-validator)
          → authMiddleware (JWT)
            → Controller (extrai req.body/params)
              → Service (regras de negócio, AppError)
                → Repository (SQL puro, pg.Pool)
                  → PostgreSQL
                ← response helpers (ok/created/paginated)
      → errorHandler (trata AppError, erros PG, 500)
```

### Estrutura de Arquivos do Projeto

```
portal-serpro-gestao/
├── docker-compose.yml        # Orquestração dos containers
├── .env                      # Variáveis de ambiente (não versionado)
├── .env.example              # Modelo de variáveis de ambiente
├── .gitignore
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf            # Proxy reverso para a API
│   └── portal-serpro.html   # Frontend do portal
├── src/                      # Código-fonte da API (arquitetura em camadas)
├── api/
│   ├── Dockerfile
│   └── package.json
└── db/
    └── init.sql              # Schema inicial do banco
```

---

## API — Endpoints

> Prefixo global: `/api/v1`  
> Exemplo: `POST http://localhost:3000/api/v1/auth/login`  
> Todas as rotas marcadas com ✔ exigem header: `Authorization: Bearer <token>`

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/register` | ✗ | Registrar usuário administrador |
| `POST` | `/auth/login` | ✗ | Login (retorna token JWT) |
| `GET`  | `/auth/me` | ✔ | Dados do token atual |

### Empregados

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET`    | `/empregados` | ✔ | Listar com filtros e paginação |
| `GET`    | `/empregados/:id` | ✔ | Buscar por ID |
| `POST`   | `/empregados` | ✔ | Cadastrar empregado |
| `PUT`    | `/empregados/:id` | ✔ | Atualizar empregado |
| `DELETE` | `/empregados/:id` | ✔ | Remover empregado |
| `POST`   | `/empregados/importar-csv` | ✔ | Importação em massa via CSV |

### Dossiês

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET`    | `/dossies` | ✔ | Listar com filtros e paginação |
| `GET`    | `/dossies/:id` | ✔ | Buscar por ID |
| `POST`   | `/dossies` | ✔ | Criar dossiê |
| `PUT`    | `/dossies/:id` | ✔ | Atualizar dossiê |
| `DELETE` | `/dossies/:id` | ✔ | Remover dossiê |
| `POST`   | `/dossies/importar-csv` | ✔ | Importação em massa via CSV |

### Dashboard

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/dashboard/metrics` | ✔ | Métricas gerais do painel executivo |

### Sistema

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/health` | ✗ | Health check |

---

## Como Executar

### Com Docker (recomendado)

**Pré-requisitos:** [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado e rodando.

**1. Clone o repositório**

```bash
git clone https://github.com/TeuzLins/portal-serpro-gestao.git
cd portal-serpro-gestao
```

**2. Configure as variáveis de ambiente**

```bash
cp .env.example .env
# Edite .env e defina JWT_SECRET e DB_PASSWORD
```

**3. Suba os containers**

```bash
docker compose up --build -d
```

**4. Verifique**

```bash
curl http://localhost/health          # via Nginx (porta 80)
curl http://localhost:3000/health     # direto na API
```

**5. Acesse o portal**

```
http://localhost
```

> Na primeira vez, registre um usuário administrador na tela de login ou use o usuário padrão abaixo.

### Sem Docker (execução local)

**Pré-requisitos:** Node.js 18+ e PostgreSQL 14+

```bash
# 1. Instalar dependências
npm install

# 2. Criar banco e tabelas
psql -U postgres -c "CREATE DATABASE serpro;"
psql -U postgres -d serpro -f db/init.sql

# 3. Configurar .env
cp .env.example .env
# Ajuste DATABASE_URL, JWT_SECRET, etc.

# 4. Iniciar em modo desenvolvimento
npm run dev

# 5. Iniciar em produção
npm start
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `DATABASE_URL` | ✔ | — | Connection string PostgreSQL |
| `JWT_SECRET` | ✔ | — | Segredo para assinar tokens JWT |
| `PORT` | ✗ | `3000` | Porta da API |
| `NODE_ENV` | ✗ | `development` | Ambiente (development/production) |
| `JWT_EXPIRES_IN` | ✗ | `8h` | Validade do JWT |
| `CORS_ORIGINS` | ✗ | `*` | Origens permitidas (separadas por vírgula) |
| `RATE_LIMIT_MAX` | ✗ | `300` | Máx. requisições por 15 min por IP |
| `DB_PASSWORD` | ✗ | `serpro_pass_dev` | Senha do PostgreSQL (Docker) |

---

## Banco de Dados

### Tabelas

```sql
usuarios     — Controle de acesso (username + senha bcrypt)
empregados   — cd_cpf, cd_matricula, nm_pessoa, nm_regional, dt_admissao, dt_desligamento
dossies      — num, etiqueta_caixa, etiqueta_documento, caixa_serpro, departamento, descricao
```

### Acessar o banco diretamente

```bash
docker exec -it serpro-db psql -U serpro -d serpro
```

---

## Formato das Respostas

### Sucesso
```json
{ "success": true, "message": "...", "data": { } }
```

### Paginação
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 120, "page": 1, "limit": 50, "pages": 3 }
}
```

### Erro
```json
{ "success": false, "message": "Empregado não encontrado.", "code": "NOT_FOUND" }
```

### Validação (422)
```json
{
  "success": false,
  "message": "Dados de entrada inválidos.",
  "errors": [{ "field": "nm_pessoa", "message": "Nome do empregado é obrigatório." }]
}
```

---

## Importação CSV

### Formato esperado — Empregados

```csv
nm_pessoa,cd_cpf,cd_matricula,nm_regional,dt_admissao,dt_desligamento,status
João Silva,123.456.789-00,MAT001,Regional Norte,2020-03-01,,Ativo
Maria Souza,987.654.321-00,MAT002,Regional Sul,2019-06-15,2023-12-31,Inativo
```

### Formato esperado — Dossiês

```csv
num,etiqueta_caixa,etiqueta_documento,caixa_serpro,num_documento,departamento,descricao
2024-001,CX-01,DOC-001,SERP-01,NF-1234,TI,Nota fiscal de equipamento
```

### Resposta da Importação

```json
{
  "data": {
    "total": 10,
    "inserted": 9,
    "rejected": [{ "registro": "Linha X", "motivo": "..." }]
  }
}
```

---

## Comandos Úteis

```bash
# Parar todos os containers
docker compose down

# Parar e apagar o banco (dados perdidos!)
docker compose down -v

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f api
docker compose logs -f db

# Reiniciar apenas a API
docker compose restart api
```

---

## Segurança

- **Helmet** — cabeçalhos HTTP seguros
- **CORS** restrito por origem configurável
- **Rate limiting** — 300 req/15min por IP
- **JWT** com expiração configurável (padrão 8h)
- **Bcrypt custo 12** para hash de senhas
- **Mensagem genérica** em erros de credenciais (sem revelar se usuário existe)
- **express-validator** — validação e sanitização de toda entrada
- **Variáveis de ambiente** para todos os segredos (nunca versionados)
- **Usuário sem root** no container Docker
- **Multi-stage build** — imagem Docker enxuta

---

## Usuário Padrão

Criado automaticamente pelo `init.sql`:

| username | password |
|----------|----------|
| `admin` | `admin123` |

> Altere a senha do admin imediatamente em produção.

---

## Integração com o Front-end

Consulte o arquivo `frontend.js` para o guia completo.

**Resumo rápido:**
1. **Login** → guarda o token em `localStorage`
2. **Toda requisição** → envia `Authorization: Bearer <token>`
3. **Token expirado (401)** → redireciona para login
4. Substitua dados mockados chamando as funções do guia de integração

---

<div align="center">
Desenvolvido para uso interno — <strong>SERPRO</strong>
</div>
