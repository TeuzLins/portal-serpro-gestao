# Portal SERPRO – Back-end Profissional

API REST completa em Node.js + Express + PostgreSQL com arquitetura em camadas,
autenticação JWT, importação CSV e Dockerização.

---

## Arquitetura

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
│   ├── auth.middleware.js         # Valida Bearer JWT
│   ├── validate.middleware.js     # Coleta erros do express-validator
│   └── errorHandler.middleware.js # Handler global de exceções
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

### Fluxo de uma requisição

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
                → ← response helpers (ok/created/paginated)
      → errorHandler (trata AppError, erros PG, 500)
```

---

## Endpoints

### Autenticação
| Método | Rota            | Auth | Descrição              |
|--------|-----------------|------|------------------------|
| POST   | /auth/register  | ✗    | Registrar usuário      |
| POST   | /auth/login     | ✗    | Login → retorna JWT    |
| GET    | /auth/me        | ✔    | Dados do token atual   |

### Empregados
| Método | Rota                        | Auth | Descrição               |
|--------|-----------------------------|------|-------------------------|
| GET    | /empregados                 | ✔    | Listar (filtros + paginação) |
| GET    | /empregados/:id             | ✔    | Buscar por ID           |
| POST   | /empregados                 | ✔    | Cadastrar               |
| PUT    | /empregados/:id             | ✔    | Atualizar               |
| DELETE | /empregados/:id             | ✔    | Remover                 |
| POST   | /empregados/importar-csv    | ✔    | Importação em massa     |

### Dossiês
| Método | Rota                     | Auth | Descrição               |
|--------|--------------------------|------|-------------------------|
| GET    | /dossies                 | ✔    | Listar (filtros + paginação) |
| GET    | /dossies/:id             | ✔    | Buscar por ID           |
| POST   | /dossies                 | ✔    | Criar                   |
| PUT    | /dossies/:id             | ✔    | Atualizar               |
| DELETE | /dossies/:id             | ✔    | Remover                 |
| POST   | /dossies/importar-csv    | ✔    | Importação em massa     |

### Dashboard
| Método | Rota                | Auth | Descrição        |
|--------|---------------------|------|------------------|
| GET    | /dashboard/metrics  | ✔    | Métricas gerais  |

### Sistema
| Método | Rota    | Auth | Descrição     |
|--------|---------|------|---------------|
| GET    | /health | ✗    | Health check  |

> Prefixo global: `/api/v1`  
> Exemplo completo: `POST http://localhost:3000/api/v1/auth/login`

---

## Execução com Docker (recomendado)

### 1. Clonar e configurar variáveis
```bash
cp .env.example .env
# Edite .env e defina JWT_SECRET e DB_PASSWORD
```

### 2. Subir todos os serviços
```bash
docker compose up --build -d
```

### 3. Verificar
```bash
curl http://localhost/health          # via Nginx (porta 80)
curl http://localhost:3000/health     # direto na API
```

### 4. Parar
```bash
docker compose down          # mantém o volume do banco
docker compose down -v       # remove tudo (inclusive dados)
```

---

## Execução local (sem Docker)

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

### Passos
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

| Variável         | Obrigatória | Padrão          | Descrição                          |
|------------------|-------------|-----------------|-------------------------------------|
| DATABASE_URL     | ✔           | —               | Connection string PostgreSQL        |
| JWT_SECRET       | ✔           | —               | Segredo para assinar tokens JWT     |
| PORT             | ✗           | 3000            | Porta da API                        |
| NODE_ENV         | ✗           | development     | Ambiente (development/production)   |
| JWT_EXPIRES_IN   | ✗           | 8h              | Validade do JWT                     |
| CORS_ORIGINS     | ✗           | *               | Origens permitidas (separadas por vírgula) |
| RATE_LIMIT_MAX   | ✗           | 300             | Max requisições por 15 min por IP   |
| DB_PASSWORD      | ✗           | serpro_pass_dev | Senha do PostgreSQL (Docker)        |

---

## Formato das respostas

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

## Importação CSV – Empregados

Colunas esperadas (cabeçalho obrigatório na primeira linha):

```
nm_pessoa,cd_cpf,cd_matricula,nm_regional,dt_admissao,dt_desligamento,status
João Silva,123.456.789-00,MAT001,Regional Norte,2020-03-01,,Ativo
Maria Souza,987.654.321-00,MAT002,Regional Sul,2019-06-15,2023-12-31,Inativo
```

Resposta:
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

## Importação CSV – Dossiês

```
num,etiqueta_caixa,etiqueta_documento,caixa_serpro,num_documento,departamento,descricao
2024-001,CX-01,DOC-001,SERP-01,NF-1234,TI,Nota fiscal de equipamento
```

---

## Integração com o Front-end

Veja o arquivo `FRONTEND_INTEGRATION.js` para o guia completo.

### Resumo rápido

1. **Login** → guarda o token em `localStorage`
2. **Toda requisição** → envia `Authorization: Bearer <token>`
3. **Token expirado (401)** → redireciona para login
4. Substitua dados mockados chamando as funções do guia de integração

---

## Segurança implementada

- **Helmet** – cabeçalhos HTTP seguros
- **CORS** restrito por origem
- **Rate limiting** – 300 req/15min por IP
- **JWT** com expiração configurável
- **Bcrypt custo 12** para hash de senhas
- **Mensagem genérica** em erros de credenciais (sem revelar se usuário existe)
- **express-validator** – validação e sanitização de entrada
- **Variáveis de ambiente** para todos os segredos
- **Usuário sem root** no container Docker
- **Multi-stage build** – imagem Docker enxuta

---

## Usuário padrão

Criado automaticamente pelo `init.sql`:

| username | password  |
|----------|-----------|
| admin    | admin123  |

> ⚠️ Altere a senha do admin imediatamente em produção.
