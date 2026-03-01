# Autenticacao

O CraftCard utiliza um sistema de autenticacao multi-estrategia combinando **Google OAuth 2.0**, **login nativo (email/senha)**, **JWT tokens** e **account linking**.

## Estrategias de Login

### 1. Google OAuth

```
Frontend                  Google                   Backend
   │                        │                         │
   │─── Login c/ Google ───>│                         │
   │<── JWT credential ────│                         │
   │                        │                         │
   │───── POST /auth/google { credential } ──────────>│
   │                        │         Valida token c/ │
   │                        │         Google API      │
   │<──── { user, accessToken } + cookie refreshToken─│
```

**Fluxo:**
1. Frontend usa Google Identity Services para obter `credential` (JWT)
2. Backend valida o JWT com a Google API usando `GOOGLE_CLIENT_ID`
3. Se `googleId` nao existe no banco:
   - Verifica se ja existe usuario com mesmo email (account linking)
   - Se nao existe: cria usuario + perfil primario com slug auto-gerado
   - Envia email de boas-vindas
4. Gera access token (15min) + refresh token (7d em httpOnly cookie)

### 2. Login Nativo (Email/Senha)

**Registro:**
```
POST /auth/register
{
  "email": "user@example.com",
  "name": "Nome",
  "password": "Senha123",
  "confirmPassword": "Senha123",
  "inviteToken": "abc123"  // opcional
}
```

- Senha validada: min 8 chars, 1 maiuscula, 1 numero
- Hash com bcrypt (12 rounds)
- Se email existe sem senha: vincula senha a conta Google (account linking)
- Se email existe com senha: erro `409 CONFLICT`
- Cria perfil primario com slug sanitizado
- Se `inviteToken` presente: aceita convite de organizacao automaticamente

**Login:**
```
POST /auth/login
{
  "email": "user@example.com",
  "password": "Senha123"
}
```

- Se usuario so tem Google (sem passwordHash): `"Use o login com Google para esta conta"`
- Resposta generica em caso de erro (nao revela se email existe)

### 3. Account Linking

O sistema vincula automaticamente contas quando o email coincide:

| Cenario | Acao |
|---------|------|
| Google primeiro, depois registro nativo | Adiciona `passwordHash` ao usuario existente |
| Registro nativo primeiro, depois Google | Adiciona `googleId` ao usuario existente |

Isso permite que o usuario use ambos os metodos de login na mesma conta.

---

## Tokens JWT

### Access Token

- **Duracao**: 15 minutos (`JWT_EXPIRES_IN`)
- **Secret**: `JWT_SECRET`
- **Payload**: `{ sub: userId, email, role }`
- **Transporte**: httpOnly cookie `accessToken` ou header `Authorization: Bearer`
- **Uso**: autenticar cada requisicao

### Refresh Token

- **Duracao**: 7 dias (`REFRESH_TOKEN_EXPIRES_IN`)
- **Secret**: `JWT_REFRESH_SECRET`
- **Armazenamento**: hash SHA256 na tabela `RefreshToken`
- **Transporte**: httpOnly cookie `refreshToken`
- **Uso**: renovar access token sem re-login

### Fluxo de Refresh

```
1. Access token expira
2. Frontend recebe 401
3. POST /auth/refresh (cookie refreshToken vai automatico)
4. Backend:
   a. Busca token pelo hash SHA256
   b. Verifica se nao foi revogado (revokedAt == null)
   c. Se revogado → REVOGA TODOS os tokens do usuario (replay detection)
   d. Revoga token atual
   e. Gera novo par (access + refresh)
5. Retorna novo accessToken + novo cookie refreshToken
```

### Cookie Config

```typescript
{
  httpOnly: true,
  secure: isProduction,                    // HTTPS only em prod
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000         // 7 dias
}
```

---

## Recuperacao de Senha

### Solicitar Reset

```
POST /auth/forgot-password
{ "email": "user@example.com" }
→ Sempre retorna: "Se o email existir, enviaremos um link de recuperacao"
```

- Token random gerado e salvo como SHA256 no banco
- Expira em 1 hora
- Email enviado com link: `{FRONTEND_URL}/reset-password?token={rawToken}`

### Redefinir Senha

```
POST /auth/reset-password
{
  "token": "raw-token-from-email",
  "password": "NovaSenha123",
  "confirmPassword": "NovaSenha123"
}
```

- Valida token (hash SHA256) e expiracao
- Atualiza senha (bcrypt 12 rounds)
- **Revoga TODOS os refresh tokens** do usuario (force logout em todos os dispositivos)
- Limpa token de reset

---

## Guards e Decorators

### Guards Globais (app.module.ts)

Aplicados a TODAS as rotas na seguinte ordem:

1. **JwtAuthGuard** — Valida JWT (respeita `@Public()`)
2. **RolesGuard** — Valida role da plataforma (respeita `@Public()`)
3. **ThrottlerGuard** — Rate limiting

### Guards de Modulo

| Guard | Descricao | Uso |
|-------|-----------|-----|
| `PlanGuard` | Verifica plano do usuario + feature | `@UseGuards(PlanGuard)` + `@RequiresFeature('feature')` |
| `OrgRoleGuard` | Verifica papel na organizacao | `@UseGuards(OrgRoleGuard)` + `@RequiresOrgRole('ADMIN')` |

### Decorators

| Decorator | Descricao | Exemplo |
|-----------|-----------|---------|
| `@Public()` | Endpoint sem autenticacao | `@Public() @Post('register')` |
| `@CurrentUser()` | Injeta usuario JWT no handler | `@CurrentUser() user: JwtPayload` |
| `@CurrentUser('sub')` | Injeta campo especifico | `@CurrentUser('sub') userId: string` |
| `@Roles('ADMIN')` | Requer role da plataforma | `@Roles('SUPER_ADMIN')` |
| `@RequiresOrgRole('ADMIN')` | Requer role na org | `@RequiresOrgRole('OWNER')` |
| `@RequiresFeature('analytics')` | Requer feature do plano | `@RequiresFeature('gallery')` |

### Hierarquia de Roles

**Plataforma:**
- `USER` < `ADMIN` < `SUPER_ADMIN`
- `SUPER_ADMIN` bypassa qualquer verificacao de role

**Organizacao:**
- `MEMBER` (1) < `ADMIN` (2) < `OWNER` (3)
- `SUPER_ADMIN` da plataforma bypassa roles de org

---

## Seguranca

| Mecanismo | Implementacao |
|-----------|---------------|
| Senha | bcrypt 12 rounds |
| Tokens no banco | SHA256 hash (refresh + reset) |
| Refresh rotation | Token usado uma vez, revogado apos uso |
| Replay detection | Token revogado reutilizado → revoga todos |
| Password reset | Revoga todas as sessoes apos reset |
| Rate limiting | 3-5 req/60s em endpoints de auth |
| httpOnly cookies | JS nao acessa tokens (protecao XSS) |
| Resposta generica | Forgot-password nao revela se email existe |
| CORS | Configurado com origem especifica |

---

## Modelo de Dados

```prisma
model User {
  id                     String    @id @default(uuid())
  email                  String    @unique
  name                   String
  googleId               String?   @unique
  passwordHash           String?
  passwordResetToken     String?           // SHA256 hash
  passwordResetExpiresAt DateTime?
  avatarUrl              String?
  plan                   String    @default("FREE")
  role                   String    @default("USER")
  refreshTokens          RefreshToken[]
}

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique   // SHA256 do token
  expiresAt DateTime
  revokedAt DateTime?           // null = ativo
  user      User      @relation(...)
}
```

---

## Variaveis de Ambiente

| Variavel | Descricao |
|----------|-----------|
| `JWT_SECRET` | Secret para assinar access tokens |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens |
| `JWT_EXPIRES_IN` | Duracao do access token (default: `15m`) |
| `REFRESH_TOKEN_EXPIRES_IN` | Duracao do refresh token (default: `7d`) |
| `GOOGLE_CLIENT_ID` | Client ID do Google OAuth |
| `FRONTEND_URL` | URL do frontend (para links em emails) |
