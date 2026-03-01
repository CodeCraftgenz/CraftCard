# Variaveis de Ambiente

Todas as variaveis sao validadas com **Zod** na inicializacao do backend (`env.config.ts`). Se alguma variavel obrigatoria estiver faltando, o servidor nao inicia.

## Backend

### Geral

| Variavel | Tipo | Default | Obrigatoria | Descricao |
|----------|------|---------|-------------|-----------|
| `NODE_ENV` | enum | `development` | Nao | `development`, `production` ou `test` |
| `PORT` | number | `3000` | Nao | Porta do servidor |

### Banco de Dados

| Variavel | Tipo | Default | Obrigatoria | Descricao |
|----------|------|---------|-------------|-----------|
| `DATABASE_URL` | string (URL) | - | Sim | Connection string MySQL. Ex: `mysql://user:pass@host:3306/db` |

### Autenticacao

| Variavel | Tipo | Default | Obrigatoria | Descricao |
|----------|------|---------|-------------|-----------|
| `JWT_SECRET` | string (32+) | - | Sim | Secret para assinar access tokens JWT |
| `JWT_REFRESH_SECRET` | string (32+) | - | Sim | Secret para refresh tokens |
| `JWT_EXPIRES_IN` | string | `15m` | Nao | Duracao do access token (ex: `15m`, `1h`) |
| `REFRESH_TOKEN_EXPIRES_IN` | string | `7d` | Nao | Duracao do refresh token (ex: `7d`, `30d`) |
| `GOOGLE_CLIENT_ID` | string | - | Sim | Client ID do Google OAuth 2.0 |

### Mercado Pago

| Variavel | Tipo | Default | Obrigatoria | Descricao |
|----------|------|---------|-------------|-----------|
| `MP_ACCESS_TOKEN` | string | - | Sim | Token de acesso da API Mercado Pago |
| `MP_WEBHOOK_SECRET` | string | - | Sim | Secret para validar assinatura do webhook |
| `MP_PUBLIC_KEY` | string | - | Sim | Chave publica MP (exposta ao frontend via endpoint) |

### Cloudflare R2 (Storage)

| Variavel | Tipo | Default | Obrigatoria | Descricao |
|----------|------|---------|-------------|-----------|
| `R2_ACCOUNT_ID` | string | - | Sim | Account ID do Cloudflare |
| `R2_ACCESS_KEY_ID` | string | - | Sim | Access key para S3 API |
| `R2_SECRET_ACCESS_KEY` | string | - | Sim | Secret key para S3 API |
| `R2_BUCKET_NAME` | string | - | Sim | Nome do bucket R2 |
| `R2_PUBLIC_URL` | string (URL) | - | Sim | URL publica do bucket (para servir arquivos) |

### URLs

| Variavel | Tipo | Default | Obrigatoria | Descricao |
|----------|------|---------|-------------|-----------|
| `BACKEND_URL` | string | `http://localhost:3000` | Nao | URL do backend (auto-detecta `RENDER_EXTERNAL_URL` no Render) |
| `CORS_ORIGIN` | string | `http://localhost:5173` | Nao | Origem permitida para CORS |
| `FRONTEND_URL` | string | `http://localhost:5173` | Nao | URL do frontend (usada em emails e redirects) |

### Email (SMTP)

| Variavel | Tipo | Default | Obrigatoria | Descricao |
|----------|------|---------|-------------|-----------|
| `MAIL_HOST` | string | - | Nao | Host do servidor SMTP |
| `MAIL_PORT` | number | - | Nao | Porta SMTP (587 para TLS, 465 para SSL) |
| `MAIL_USER` | string | - | Nao | Usuario SMTP |
| `MAIL_PASS` | string | - | Nao | Senha SMTP |
| `MAIL_FROM` | string | - | Nao | Endereco de remetente (ex: `CraftCard <noreply@craftcard.com>`) |

> Se variaveis de email nao estiverem configuradas, o envio de emails falha silenciosamente (logado como warning).

### Push Notifications (VAPID)

| Variavel | Tipo | Default | Obrigatoria | Descricao |
|----------|------|---------|-------------|-----------|
| `VAPID_PUBLIC_KEY` | string | - | Nao | Chave publica VAPID (exposta ao frontend) |
| `VAPID_PRIVATE_KEY` | string | - | Nao | Chave privada VAPID |
| `VAPID_SUBJECT` | string | - | Nao | Subject VAPID (ex: `mailto:admin@craftcard.com`) |

> Gerar par de chaves VAPID: `npx web-push generate-vapid-keys`

---

## Frontend

| Variavel | Tipo | Default | Descricao |
|----------|------|---------|-----------|
| `VITE_API_URL` | string | `/api` | URL base da API (em dev, proxy Vite redireciona para backend) |
| `VITE_GOOGLE_CLIENT_ID` | string | - | Client ID do Google OAuth (mesmo do backend) |

---

## Arquivos de Exemplo

- `backend/.env.example` — Template com todas as variaveis do backend
- `frontend/.env.example` — Template com variaveis do frontend

### Setup Rapido

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env com suas credenciais

# Frontend
cp frontend/.env.example frontend/.env
# Editar frontend/.env (normalmente so VITE_GOOGLE_CLIENT_ID)
```

---

## Valores de Producao

| Variavel | Onde Configurar | Observacao |
|----------|-----------------|------------|
| `DATABASE_URL` | Render Dashboard | Nao usar sync (contém senha) |
| `JWT_SECRET` | Render Dashboard | Auto-gerado pelo render.yaml |
| `JWT_REFRESH_SECRET` | Render Dashboard | Auto-gerado pelo render.yaml |
| `GOOGLE_CLIENT_ID` | Render Dashboard | Console do Google Cloud |
| `MP_ACCESS_TOKEN` | Render Dashboard | Dashboard Mercado Pago |
| `MP_WEBHOOK_SECRET` | Render Dashboard | Dashboard Mercado Pago |
| `MP_PUBLIC_KEY` | Render Dashboard | Dashboard Mercado Pago |
| `R2_*` | Render Dashboard | Dashboard Cloudflare |
| `MAIL_*` | Render Dashboard | Config SMTP do provedor |
| `VAPID_*` | Render Dashboard | Gerar com web-push CLI |
| `BACKEND_URL` | Auto-detectado | `RENDER_EXTERNAL_URL` se nao definido |
| `FRONTEND_URL` | Render Dashboard | `https://craftcardgenz.com` |
| `CORS_ORIGIN` | Render Dashboard | `https://craftcardgenz.com` |
