# Deploy

## Arquitetura de Producao

```
                    ┌──────────────────┐
                    │   Cloudflare R2  │
                    │   (Storage)      │
                    └────────┬─────────┘
                             │
┌──────────────┐    ┌───────┴────────┐    ┌──────────────┐
│  Frontend    │───>│    Backend     │───>│   MySQL 8.0  │
│  Hostinger   │    │    Render      │    │   Hostinger  │
│  SPA (Vite)  │    │    NestJS      │    │              │
└──────────────┘    └───────┬────────┘    └──────────────┘
                            │
                    ┌───────┴────────┐
                    │  Mercado Pago  │
                    │  (Pagamentos)  │
                    └────────────────┘
```

| Componente | Servico | URL |
|------------|---------|-----|
| Frontend | Hostinger (shared hosting) | https://craftcardgenz.com |
| Backend | Render (free tier) | https://craftcard.onrender.com |
| Banco | MySQL Hostinger | srv1889.hstgr.io:3306 |
| Storage | Cloudflare R2 | via UPLOADS_PUBLIC_URL |
| Dominio | craftcardgenz.com | Hostinger DNS |

---

## Backend (Render)

### Configuracao (render.yaml)

```yaml
services:
  - type: web
    name: craftcard-api
    runtime: node
    plan: free
    region: oregon
    buildCommand: npm ci && npx prisma generate && npm run build
    startCommand: npx prisma migrate deploy && node dist/main
    healthCheckPath: /api/health
```

### Fluxo de Deploy

```
1. Push para branch main no GitHub
2. Render detecta push → auto-deploy
3. Build:
   a. npm ci (instala dependencias)
   b. npx prisma generate (gera Prisma Client)
   c. npm run build (compila NestJS → dist/)
4. Start:
   a. npx prisma migrate deploy (aplica migracoes pendentes)
   b. node dist/main (inicia servidor)
5. Health check: GET /api/health
```

**Tempo**: ~2-3 minutos do push ao deploy completo.

### Cuidados

- **Free tier**: Spins down apos inatividade. Cold start ~30s.
- **Header**: `x-render-routing: no-server` = servico esta down/sleeping
- **Migracoes**: Se `prisma migrate deploy` falhar, o backend NAO inicia
  - Nunca renomear diretorios de migracao apos push
  - Se migracao falhar: `prisma migrate resolve --applied <name>` no banco de producao

---

## Frontend (Hostinger)

### Build

```bash
cd frontend && npm run build
# Saida: frontend/dist/
```

### Deploy via FTP (Primario)

```bash
npm run deploy
# Executa: node scripts/deploy-frontend.mjs
```

- Usa `basic-ftp` lib
- Le credenciais do `backend/.env` (FTP_HOST, FTP_USER, FTP_PASSWORD)
- Limpa diretorio `/assets` antigo
- Upload de `frontend/dist/` para `/public_html/`

### Deploy via SFTP (Fallback)

```bash
npm run deploy:sftp
# Executa: node scripts/deploy-sftp.mjs
```

- Usa `ssh2-sftp-client` (instalado como devDependency)
- SSH host: 147.93.37.67, porta: 65002
- User: u984096926
- **Diretorio correto**: `./domains/craftcardgenz.com/public_html/` (NAO `./public_html/`)
- Mais confiavel que FTP (portas passivas podem ser bloqueadas em algumas redes)

### SPA Routing

O Hostinger precisa de um `.htaccess` para SPA routing:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

---

## CI/CD (GitHub Actions)

### Workflow: `.github/workflows/ci.yml`

**Trigger**: Push ou PR para `main`

**Jobs paralelos:**

1. **Backend**:
   ```
   Checkout → Node 20 + cache → npm ci → prisma generate → lint → build
   ```

2. **Frontend**:
   ```
   Checkout → Node 20 + cache → npm ci → lint → build
   ```

Ambos precisam passar para merge na main.

---

## Banco de Dados (Producao)

| Config | Valor |
|--------|-------|
| Host | srv1889.hstgr.io |
| Porta | 3306 |
| Database | u984096926_db_cardCraft |
| User | u984096926 |
| Tipo | MySQL 8.0 (Hostinger managed) |

### Migracoes em Producao

```bash
# Automatico no deploy do Render:
npx prisma migrate deploy

# Manual (se precisar resolver migracao):
npx prisma migrate resolve --applied <migration_name>
```

**Regras:**
- NUNCA renomear diretorios de migracao apos push para main
- NUNCA usar `prisma migrate dev` em producao (cria nova migracao)
- Sempre usar `prisma migrate deploy` (aplica migracoes existentes)

---

## Storage (Cloudflare R2)

Uploads de arquivos (fotos, covers, resumes, videos, backgrounds) vao para Cloudflare R2.

| Config | Variavel |
|--------|----------|
| Endpoint | `R2_ENDPOINT` |
| Access Key | `R2_ACCESS_KEY_ID` |
| Secret Key | `R2_SECRET_ACCESS_KEY` |
| Bucket | `R2_BUCKET` |
| URL Publica | `UPLOADS_PUBLIC_URL` |

---

## Troubleshooting

### Backend nao inicia apos deploy

1. Verificar logs no Render dashboard
2. Se `x-render-routing: no-server` → servico esta down
3. Verificar `DATABASE_URL` esta correto no Render
4. Se migracao falhou:
   ```bash
   npx prisma migrate status  # ver status
   npx prisma migrate resolve --applied <name>  # resolver
   ```

### Frontend nao atualiza

1. Verificar credenciais FTP/SFTP em `backend/.env`
2. Limpar cache do navegador (Ctrl+Shift+R)
3. Verificar se service worker nao esta cacheando versao antiga
4. Confirmar que `/assets` foi limpo antes do upload

### Pagamentos nao sincronizam

1. Verificar `MP_WEBHOOK_SECRET` no Render
2. Verificar `notification_url` na preferencia MP
3. Fallback manual: `POST /payments/verify` no frontend
4. Comparar status no dashboard MP vs banco

### Service worker causa 404 em uploads

Garantir que `navigateFallbackDenylist: [/^\/uploads\//]` esta no `vite.config.ts`.
Sem isso, o SW intercepta paths `/uploads/` e serve `index.html`.
