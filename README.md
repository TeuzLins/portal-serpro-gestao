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

**Sistema interno corporativo para gestão de empregados e dossiês com autenticação, importação de dados e banco de dados PostgreSQL.**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org)

</div>

---

## Sobre o Projeto

O **Portal SERPRO** é um sistema interno de gestão desenvolvido para centralizar o controle de empregados e dossiês da organização. O sistema oferece uma interface moderna e responsiva, com autenticação segura, importação em massa via CSV e persistência de dados em banco PostgreSQL.

### Funcionalidades

- **Autenticação** — Registro e login com senha criptografada (bcrypt + JWT)
- **Gestão de Empregados** — Cadastro, consulta, edição e exclusão com filtros avançados
- **Gestão de Dossiês** — Controle completo de dossiês vinculados a empregados
- **Dashboard** — Painel executivo com indicadores em tempo real
- **Importação CSV** — Upload em massa de empregados e dossiês
- **Docker** — Ambiente completo containerizado com 3 serviços

---

## Arquitetura

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

---

## Como Executar

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado e rodando

### 1. Clone o repositório

```bash
git clone https://github.com/TeuzLins/portal-serpro-gestao.git
cd portal-serpro-gestao
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
POSTGRES_PASSWORD=sua_senha_aqui
JWT_SECRET=sua_chave_jwt_aqui
```

### 3. Suba os containers

```bash
docker-compose up --build
```

### 4. Acesse o portal

```
http://localhost
```

> Na primeira vez, registre um usuário administrador na tela de login.

---

## API — Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/register` | Criar usuário administrador |
| `POST` | `/api/auth/login` | Login (retorna token JWT) |

### Empregados

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/empregados` | Listar com filtros e paginação |
| `POST` | `/api/empregados` | Criar empregado |
| `PUT` | `/api/empregados/:id` | Atualizar empregado |
| `DELETE` | `/api/empregados/:id` | Remover empregado |
| `POST` | `/api/empregados/importar` | Importar via CSV |

### Dossiês

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dossies` | Listar com filtros e paginação |
| `POST` | `/api/dossies` | Criar dossiê |
| `PUT` | `/api/dossies/:id` | Atualizar dossiê |
| `DELETE` | `/api/dossies/:id` | Remover dossiê |
| `POST` | `/api/dossies/importar` | Importar via CSV |

### Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/stats` | Totais para o painel executivo |

> Todas as rotas (exceto auth) exigem header: `Authorization: Bearer <token>`

---

## Estrutura do Projeto

```
portal-serpro-gestao/
├── docker-compose.yml        # Orquestração dos containers
├── .env                      # Variáveis de ambiente (não versionado)
├── .gitignore
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf            # Proxy reverso para a API
│   └── portal-serpro.html   # Frontend do portal
├── api/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js              # API Express completa
└── db/
    └── init.sql              # Schema inicial do banco
```

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

## Importação CSV

### Formato esperado — Empregados

```csv
cd_cpf,cd_matricula,nm_pessoa,nm_regional,dt_admissao,dt_desligamento
12345678900,1001,JOAO DA SILVA,SERPRO - SEDE - DF,2020-01-15,
```

### Formato esperado — Dossiês

```csv
Nº,Etiqueta caixa,Etiqueta documento,Nº da Caixa SERPRO,Nº documento / processo,Departamento,Descrição
1,G10025845,DC00020G10128272SOS,1,1200298-4,SUPES,Nome do Empregado
```

---

## Comandos Úteis

```bash
# Parar todos os containers
docker-compose down

# Parar e apagar o banco (dados perdidos!)
docker-compose down -v

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f api
docker-compose logs -f db

# Reiniciar apenas a API
docker-compose restart api
```

---

## Segurança

- Senhas armazenadas com **bcrypt** (salt rounds: 10)
- Autenticação via **JWT** com expiração de 8 horas
- Variáveis sensíveis isoladas no `.env` (nunca versionado)
- Nginx como proxy reverso protegendo a API

---

<div align="center">
Desenvolvido para uso interno — <strong>SERPRO</strong>
</div>
