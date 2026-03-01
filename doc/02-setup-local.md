# Setup Local

## Pre-requisitos

- **Node.js** 20+ (LTS)
- **MySQL** 8.0 (ou Docker)
- **Git**

## 1. Clonar o repositorio

```bash
git clone https://github.com/CodeCraftgenz/CraftCard.git
cd CraftCard
```

## 2. Instalar dependencias

```bash
# Instala deps do root, backend e frontend
make install

# Ou manualmente:
npm install
cd backend && npm install
cd ../frontend && npm install
```

## 3. Configurar variaveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env com suas credenciais

# Frontend
cp frontend/.env.example frontend/.env
```

O backend requer no minimo:
- `DATABASE_URL` — conexao MySQL
- `JWT_SECRET` e `JWT_REFRESH_SECRET` — strings de 32+ caracteres
- `GOOGLE_CLIENT_ID` — OAuth client ID do Google

Ver [10-variaveis-ambiente.md](10-variaveis-ambiente.md) para a lista completa.

## 4. Banco de dados

### Opcao A: Docker (recomendado)

```bash
make up-db
# Isso inicia um container MySQL 8.0 via docker-compose
# User: craftcard / Pass: craftcard_pass / DB: craftcard
```

### Opcao B: MySQL local

Crie o banco manualmente e configure `DATABASE_URL` no `.env`:

```
DATABASE_URL="mysql://user:password@localhost:3306/craftcard"
```

## 5. Rodar migracoes + gerar Prisma Client

```bash
make db-migrate
# Ou:
cd backend && npx prisma migrate dev
```

Isso aplica todas as migracoes e gera o Prisma Client.

## 6. Iniciar servidores

```bash
# Backend + Frontend simultaneos
make dev

# Ou separados:
make dev-backend   # http://localhost:3000
make dev-frontend  # http://localhost:5173
```

O frontend faz proxy de `/api` para o backend via Vite config.

## Comandos Uteis (Makefile)

| Comando | Descricao |
|---------|-----------|
| `make dev` | Inicia DB + backend + frontend |
| `make dev-backend` | Apenas backend |
| `make dev-frontend` | Apenas frontend |
| `make up-db` | Inicia MySQL (Docker) |
| `make down-db` | Para MySQL |
| `make db-migrate` | Roda migracoes Prisma |
| `make db-studio` | Abre Prisma Studio (GUI do banco) |
| `make db-generate` | Regenera Prisma Client |
| `make build` | Build de producao (backend + frontend) |
| `make test` | Roda todos os testes |
| `make test-e2e` | Roda testes E2E (Playwright) |
| `make lint` | Lint do codigo |
| `make typecheck` | Type checking TypeScript |
| `make clean` | Remove node_modules e dist |

## Estrutura do Docker Compose

Arquivo: `infra/docker-compose.yml`

- **MySQL 8.0** na porta 3306
- Volume persistente `craftcard-data`
- Healthcheck automatico
- Variaveis configuraveis: `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
