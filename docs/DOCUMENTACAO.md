# CraftCard — Documentacao Tecnica Completa

> Plataforma SaaS de cartoes digitais profissionais da CodeCraftGenZ.
> Dominio: [craftcardgenz.com](https://craftcardgenz.com)

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Arquitetura](#2-arquitetura)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Backend — Modulos e Endpoints](#5-backend--modulos-e-endpoints)
6. [Frontend — Paginas e Componentes](#6-frontend--paginas-e-componentes)
7. [Banco de Dados](#7-banco-de-dados)
8. [Autenticacao e Seguranca](#8-autenticacao-e-seguranca)
9. [Planos e Cobranca](#9-planos-e-cobranca)
10. [Organizacoes (B2B)](#10-organizacoes-b2b)
11. [Upload de Arquivos](#11-upload-de-arquivos)
12. [Webhooks e API Publica](#12-webhooks-e-api-publica)
13. [Notificacoes e E-mails](#13-notificacoes-e-emails)
14. [Deploy e Infraestrutura](#14-deploy-e-infraestrutura)
15. [Scripts Utilitarios](#15-scripts-utilitarios)
16. [Variaveis de Ambiente](#16-variaveis-de-ambiente)

---

## 1. Visao Geral

O **CraftCard** e uma plataforma SaaS que permite a criacao de cartoes digitais profissionais. Os usuarios criam perfis personalizaveis com links, informacoes de contato, portfolio, agenda e muito mais — tudo acessivel via um link unico ou QR Code.

### Funcionalidades Principais

| Recurso | Descricao |
|---------|-----------|
| **Cartoes Digitais** | Perfis personalizaveis com 18 temas, 8 animacoes de link, 16 estilos de icone e fundos mesh gradient |
| **QR Code** | Geracao automatica para compartilhamento rapido |
| **Analytics** | Dashboard com views, cliques, dispositivos, paises e referrers |
| **Formulario de Contato** | Captura de leads diretamente no cartao |
| **Agendamentos** | Sistema de booking integrado com Google Calendar |
| **Depoimentos** | Coleta e moderacao de avaliacoes publicas |
| **Galeria** | Upload de imagens com lightbox |
| **Servicos** | Catalogo de servicos com precos |
| **FAQ** | Perguntas frequentes no cartao |
| **Conexoes** | Rede de networking entre usuarios |
| **Organizacoes** | Gestao B2B com branding corporativo |
| **Webhooks** | Integracao com sistemas externos |
| **API Publica** | API REST para clientes Enterprise |
| **PWA** | App instalavel com push notifications |
| **Compartilhamento Social** | WhatsApp, Telegram, Email, Instagram Stories, Copiar Link |
| **Estatisticas Publicas** | Contadores reais na landing page (cartoes, views, usuarios) |
| **Chat de Suporte** | WhatsApp flutuante (visitantes) + multicanal para planos pagos |
| **Pagina Sobre** | Pagina institucional `/about` com historia, missao e equipe |
| **Export Instagram Stories** | Exportar cartao como imagem 1080x1920 para compartilhar nos Stories |

### Opcoes de Personalizacao Visual

O editor oferece uma ampla variedade de opcoes visuais:

#### 18 Temas de Cartao

`default`, `gradient`, `minimal`, `bold`, `ocean`, `sunset`, `forest`, `neon`, `elegant`, `cosmic`, `glass`, `brutalist`, `neumorphism`, `terminal`, `polaroid`, `pastel`, `noir`, `retro`

#### 8 Animacoes de Link

`none`, `scale`, `slide`, `glow`, `bounce`, `tilt3d`, `flip`, `pulse`

#### 16 Estilos de Icone

`default`, `filled`, `outline`, `neomorph`, `glass`, `gradient`, `neon`, `shadow`, `minimal`, `circle`, `soft`, `duotone`, `isometric`, `badge`, `floating`, `diamond`

#### 8 Fundos Mesh Gradient

`mesh-rose`, `mesh-ocean`, `mesh-sunset`, `mesh-aurora`, `mesh-berry`, `mesh-ember`, `mesh-arctic`, `mesh-gold`

---

## 2. Arquitetura

```
[Navegador/PWA] ←→ [Frontend React - Hostinger]
                           ↓ HTTPS
                    [Backend NestJS - Render]
                           ↓
                    [MySQL - Hostinger]
                           ↓
                    [Cloudflare R2 - Storage]
                           ↓
                    [Redis - BullMQ - Emails]
```

- **Frontend**: SPA React servida como arquivos estaticos no Hostinger
- **Backend**: API REST NestJS hospedada no Render (free tier, auto-deploy)
- **Banco**: MySQL no Hostinger (srv1889.hstgr.io)
- **Storage**: Cloudflare R2 (compativel S3) para fotos, videos, PDFs
- **Fila de emails**: BullMQ (Redis) com fallback para SMTP direto

---

## 3. Stack Tecnologico

### Backend
| Tecnologia | Uso |
|-----------|-----|
| NestJS | Framework HTTP |
| Prisma | ORM + migrações |
| MySQL | Banco de dados |
| JWT + Passport | Autenticacao |
| bcrypt (12 rounds) | Hash de senhas |
| TOTP (otpauth) | 2FA |
| Sharp | Processamento de imagens |
| AWS SDK (S3) | Upload para R2 |
| BullMQ | Fila de emails |
| Nodemailer | Envio SMTP |
| Zod | Validacao de DTOs |
| Helmet | Headers de seguranca |

### Frontend
| Tecnologia | Uso |
|-----------|-----|
| React 18 | UI |
| TypeScript | Tipagem |
| Vite | Build/dev server |
| TailwindCSS | Estilizacao |
| React Router v6 | Roteamento SPA |
| React Query (TanStack) | Cache e fetching |
| Framer Motion | Animacoes |
| Recharts | Graficos |
| qrcode.react | QR Codes |
| Workbox (PWA) | Service Worker |

---

## 4. Estrutura de Pastas

```
CardCraft/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelos do banco de dados
│   │   └── migrations/            # Historico de migracoes
│   └── src/
│       ├── main.ts                # Ponto de entrada, middleware de seguranca
│       ├── app.module.ts          # Modulo raiz, imports globais
│       ├── auth/                  # Autenticacao (JWT, Google, 2FA)
│       ├── me/                    # Endpoint GET /me (sessao do usuario)
│       ├── profiles/              # CRUD de perfis/cartoes
│       ├── payments/              # Mercado Pago, planos, webhooks de pagamento
│       ├── organizations/         # Organizacoes B2B
│       ├── storage/               # Upload de arquivos (R2)
│       ├── analytics/             # Views, cliques, achievements
│       ├── contacts/              # Formulario de contato / leads
│       ├── bookings/              # Agendamentos + Google Calendar
│       ├── connections/           # Rede de networking
│       ├── testimonials/          # Depoimentos
│       ├── gallery/               # Galeria de imagens
│       ├── events/                # Eventos
│       ├── tags/                  # Tags de conexoes
│       ├── notifications/         # Push + in-app notifications
│       ├── webhooks/              # Webhooks de saida
│       ├── public-api/            # API REST publica (Enterprise)
│       ├── mail/                  # Servico de email (BullMQ)
│       ├── slugs/                 # Validacao de slugs
│       ├── og/                    # Open Graph / SEO
│       ├── admin/                 # Painel administrativo
│       └── common/                # Guards, decorators, exceptions, config
├── frontend/
│   └── src/
│       ├── App.tsx                # Router + providers
│       ├── pages/                 # 19 paginas (Editor, Landing, About, Billing...)
│       ├── components/
│       │   ├── atoms/             # Componentes basicos (Logo, Spinner...)
│       │   ├── organisms/         # Componentes complexos (Header, Footer...)
│       │   └── sections/          # Secoes da landing page
│       ├── hooks/                 # 22 custom hooks
│       ├── providers/             # AuthProvider, QueryProvider
│       ├── lib/                   # api.ts, constants, utils
│       └── hackathon/             # Componentes do hackathon
├── scripts/
│   ├── deploy-frontend.mjs       # Deploy FTP para Hostinger
│   └── deploy-sftp.mjs           # Deploy SFTP (fallback)
└── docs/
    ├── DOCUMENTACAO.md            # Este arquivo
    └── APRESENTACAO_CLIENTES.md   # Apresentacao comercial
```

---

## 5. Backend — Modulos e Endpoints

### Autenticacao (`/auth`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/auth/google` | Login via Google OAuth |
| POST | `/auth/register` | Registro com email/senha |
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/forgot-password` | Solicitar reset de senha |
| POST | `/auth/reset-password` | Confirmar reset |
| POST | `/auth/setup-2fa` | Gerar QR Code para TOTP |
| POST | `/auth/verify-2fa-setup` | Confirmar ativacao 2FA |
| POST | `/auth/disable-2fa` | Desativar 2FA |
| POST | `/auth/login-2fa` | Login com codigo 2FA |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Revogar refresh token |

### Sessao (`/me`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/me` | Dados do usuario autenticado (perfil, plano, orgs) |
| DELETE | `/me` | Excluir conta (requer confirmacao LGPD) |

### Perfis (`/me/profile`, `/profile`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/me/profile` | Perfil do usuario |
| PUT | `/me/profile` | Atualizar perfil |
| GET | `/me/cards` | Listar cartoes |
| POST | `/me/cards` | Criar novo cartao |
| DELETE | `/me/cards/:id` | Excluir cartao |
| GET | `/profile/:slug` | Perfil publico (visitante) |

### Pagamentos (`/payments`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/payments/checkout` | Criar preferencia Mercado Pago |
| POST | `/payments/webhook` | Webhook IPN do Mercado Pago |
| GET | `/payments/billing` | Info do plano atual |
| POST | `/payments/verify` | Verificar pagamento |

### Organizacoes (`/organizations`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/organizations` | Criar organizacao |
| GET | `/organizations/me` | Minhas organizacoes |
| GET | `/organizations/:orgId` | Detalhes da org |
| PUT | `/organizations/:orgId` | Atualizar org (ADMIN+) |
| DELETE | `/organizations/:orgId` | Excluir org (OWNER) |
| POST | `/organizations/:orgId/invite` | Convidar membro |
| POST | `/organizations/:orgId/bulk-apply` | Aplicar branding em todos |
| GET | `/organizations/:orgId/analytics` | Analytics consolidado |
| GET | `/organizations/:orgId/leads` | Leads consolidados |
| POST | `/organizations/:orgId/cover-upload` | Upload capa (OWNER) |
| POST | `/organizations/:orgId/background-upload` | Upload fundo (OWNER) |

### Upload de Arquivos (`/me/*-upload`)
| Metodo | Rota | Max | Formato |
|--------|------|-----|---------|
| POST | `/me/photo-upload` | 5MB | JPEG/PNG/WebP → 400x400 WebP |
| POST | `/me/cover-upload` | 5MB | JPEG/PNG/WebP → 1200x400 WebP |
| POST | `/me/background-upload` | 8MB | JPEG/PNG/WebP → 1920x1080 WebP |
| POST | `/me/resume-upload` | 10MB | PDF |
| POST | `/me/video-upload` | 20MB | MP4 |

### Analytics (`/analytics`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/analytics/me` | Dashboard de analytics |
| POST | `/analytics/view` | Registrar visualizacao (publico) |
| POST | `/analytics/click` | Registrar clique em link (publico) |

### Contatos (`/contacts`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/contacts/:slug` | Enviar mensagem (publico) |
| GET | `/contacts/me` | Listar mensagens recebidas |
| GET | `/contacts/me/export` | Exportar leads em CSV |

### Agendamentos (`/bookings`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/bookings/slots/:slug` | Horarios disponiveis (publico) |
| POST | `/bookings/:slug` | Agendar horario (publico) |
| GET | `/bookings/me/list` | Meus agendamentos |
| PUT | `/bookings/me/:id/status` | Confirmar/cancelar |

### Webhooks (`/webhooks`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/webhooks` | Listar webhooks |
| POST | `/webhooks` | Criar webhook |
| POST | `/webhooks/:id/test` | Enviar teste |
| GET | `/webhooks/:id/logs` | Historico de disparos |

### Estatisticas Publicas (`/stats`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/stats/public` | Numeros agregados para landing page (cache 5min, sem auth) |

Retorna: `{ totalCards, totalViews, totalUsers }` — usado na secao "TrustedBySection" da landing page com contadores animados.

### API Publica (`/api/v1`) — Enterprise
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/leads` | Listar leads |
| GET | `/api/v1/connections` | Listar conexoes |
| GET | `/api/v1/profiles` | Listar perfis |
| GET | `/api/v1/analytics` | Dados de analytics |

---

## 6. Frontend — Paginas e Componentes

### Paginas (19)
| Pagina | Rota | Descricao |
|--------|------|-----------|
| LandingPage | `/` | Pagina de marketing |
| AboutPage | `/about` | Pagina institucional (historia, missao, equipe) |
| LoginPage | `/login` | Login (Google + email) |
| RegisterPage | `/register` | Cadastro |
| EditorPage | `/editor` | Editor principal do cartao |
| BillingPage | `/billing` | Gestao de plano/assinatura |
| TutorialPage | `/tutorial` | Tutorial de uso |
| ConnectionsPage | `/connections` | Rede de contatos |
| OrgDashboardPage | `/org/:orgId` | Dashboard da organizacao |
| WebhooksPage | `/webhooks` | Configuracao de webhooks |
| AdminPage | `/admin` | Painel administrativo |
| PublicCardPage | `/:slug` | Cartao publico (visitante) |

### Hooks Principais (22)
| Hook | Responsabilidade |
|------|-----------------|
| `useProfile` | CRUD de perfil, uploads de midia |
| `useOrganization` | CRUD de org, membros, convites, analytics |
| `useBilling` | Checkout, verificacao de pagamento |
| `useAnalytics` | Dashboard de metricas |
| `useContacts` | Mensagens/leads recebidos |
| `useBookings` | Agendamentos + Google Calendar |
| `useConnections` | Rede de networking |
| `useNotifications` | Push + notificacoes in-app |

---

## 7. Banco de Dados

**30 modelos** no Prisma Schema. Principais:

| Modelo | Descricao |
|--------|-----------|
| `User` | Conta do usuario (email, senha, plano, role) |
| `Profile` | Cartao digital (bio, foto, tema, links, secoes) |
| `SocialLink` | Links sociais e personalizados do cartao |
| `Payment` | Registro de pagamentos (Mercado Pago) |
| `ContactMessage` | Mensagens/leads recebidos |
| `Booking` | Agendamentos com horario e status |
| `Testimonial` | Depoimentos com moderacao |
| `Organization` | Organizacao B2B com branding |
| `OrganizationMember` | Membro com role (OWNER/ADMIN/MEMBER) |
| `Connection` | Conexao entre usuarios (networking) |
| `Webhook` | Webhook de saida configurado |
| `ViewEvent` | Evento de analytics detalhado |
| `Notification` | Notificacao in-app |

---

## 8. Autenticacao e Seguranca

### Fluxo de Autenticacao
1. **Login**: Google OAuth ou email/senha → backend retorna `accessToken` (JWT, 15min)
2. **Refresh**: Cookie httpOnly `refresh_token` (7 dias) → `POST /auth/refresh`
3. **Replay Detection**: Se um refresh token ja revogado for reusado, TODAS as sessoes sao invalidadas
4. **2FA**: TOTP via app autenticador (Google Authenticator, etc.)

### Medidas de Seguranca
| Medida | Implementacao |
|--------|--------------|
| **Body size limit** | 2MB max (previne DoS com payloads grandes) |
| **Helmet** | CSP, X-Frame-Options, HSTS |
| **Rate limiting** | Global + por rota (ThrottlerModule) |
| **CORS** | Apenas origens confiáveis |
| **HMAC Webhook** | Verificacao obrigatória de assinatura Mercado Pago |
| **SSRF Protection** | URLs de webhook bloqueiam IPs internos/privados |
| **bcrypt 12 rounds** | Hash de senhas |
| **Zod validation** | Validacao de todos os inputs |

---

## 9. Planos e Cobranca

### Tabela de Planos
| Feature | FREE | PRO (R$19,90/mes) | BUSINESS | ENTERPRISE |
|---------|------|-----|----------|------------|
| Cartoes | 1 | 3 | 3 | 3 |
| Links | 5 | 20 | 50 | 50 |
| Analytics | - | Sim | Sim | Sim |
| Galeria | - | Sim | Sim | Sim |
| Agendamentos | - | Sim | Sim | Sim |
| Depoimentos | - | Sim | Sim | Sim |
| Contatos/Leads | - | Sim | Sim | Sim |
| Video | - | Sim | Sim | Sim |
| Org Dashboard | - | - | Sim | Sim |
| Webhooks | - | - | Sim | Sim |
| Dominio Custom | - | - | - | Sim |
| Conexoes | 10 | 100 | 500 | 1000 |

### Whitelist Admin
Emails em `admin-whitelist.ts` recebem acesso ENTERPRISE gratuitamente (fundadores/contas internas).

### Fluxo de Pagamento
1. Frontend chama `POST /payments/checkout` com plano e ciclo
2. Backend cria preferencia no Mercado Pago e retorna URL
3. Usuario paga no checkout do Mercado Pago
4. MP envia webhook `POST /payments/webhook` com assinatura HMAC
5. Backend verifica HMAC, atualiza plano do usuario atomicamente

---

## 10. Organizacoes (B2B)

### Hierarquia de Roles
| Role | Permissoes |
|------|-----------|
| **OWNER** | Tudo (excluir org, promover admins, upload de imagens) |
| **ADMIN** | Convidar/remover membros, branding, analytics, leads |
| **MEMBER** | Apenas editar proprio cartao |

### Branding Corporativo
- Owner pode ativar `brandingActive` → bloqueia customizacao visual dos membros
- Owner pode setar **capa** e **fundo** da org → membros nao podem sobrescrever
- "Aplicar em todos" propaga cores, fontes, tema e imagens para todos os cartoes

### Fluxo de Convite
1. Admin cria convite com email e role
2. Email enviado com link de convite (valido 7 dias)
3. Usuario aceita → perfis linkados a org automaticamente

---

## 11. Upload de Arquivos

- **Storage**: Cloudflare R2 (S3-compatible)
- **Processamento**: Sharp comprime/redimensiona imagens para WebP
- **Path**: `{folder}/{userId}/{uuid}.webp`
- **Limite por usuario**: 10 uploads/minuto (rate limiting)

| Tipo | Tamanho Max | Resolucao Final | Formato |
|------|------------|-----------------|---------|
| Foto perfil | 5MB | 400x400 | WebP |
| Capa | 5MB | 1200x400 | WebP |
| Fundo | 8MB | 1920x1080 | WebP |
| Video | 20MB | Original | MP4 |
| Curriculo | 10MB | Original | PDF |

---

## 12. Webhooks e API Publica

### Webhooks de Saida
Eventos suportados:
- `new_message` — Nova mensagem de contato recebida
- `new_booking` — Novo agendamento criado
- `new_testimonial` — Novo depoimento recebido
- `new_view` — Nova visualizacao do cartao
- `lead_status_changed` — Lead marcado como lido

**Seguranca**: URLs devem ser HTTPS. IPs internos/privados sao bloqueados (SSRF protection). Payload assinado com HMAC-SHA256.

### API Publica (Enterprise)
Autenticacao via API Key no header `X-API-Key`. Endpoints:
- `GET /api/v1/leads` — Leads/contatos
- `GET /api/v1/connections` — Conexoes
- `GET /api/v1/profiles` — Perfis
- `GET /api/v1/analytics` — Metricas

---

## 13. Notificacoes e E-mails

### Tipos de Email
| Tipo | Quando |
|------|--------|
| Reset de senha | Usuario solicita recuperacao |
| Nova mensagem | Alguem envia formulario de contato |
| Novo agendamento | Alguem agenda horario |
| Lembrete (30min) | 30 minutos antes do agendamento |
| Convite de org | Admin convida membro |
| Depoimento aprovado | Admin aprova depoimento |

### Infraestrutura
- **BullMQ** (Redis) para fila com retry exponencial (3x)
- **Fallback**: Se Redis indisponivel, envia direto via SMTP
- **Push Notifications**: Web Push API (VAPID keys)

---

## 14. Deploy e Infraestrutura

### Backend (Render)
- **URL**: `https://craftcard.onrender.com`
- **Deploy**: Auto-deploy via push para `main` no GitHub
- **Start**: `prisma migrate deploy && node dist/main`
- **Free tier**: Spin down apos 15min de inatividade

### Frontend (Hostinger)
- **URL**: `https://craftcardgenz.com`
- **Deploy**: `npm run build` → SFTP para Hostinger
- **Script**: `node scripts/deploy-sftp.mjs`
- **SFTP**: Host 147.93.37.67, porta 65002

### Banco de Dados (Hostinger)
- **Host**: srv1889.hstgr.io:3306
- **DB**: u984096926_db_cardCraft

### Storage (Cloudflare R2)
- Bucket dedicado para uploads
- URL publica configurada via `R2_PUBLIC_URL`

---

## 15. Scripts Utilitarios

| Script | Descricao |
|--------|-----------|
| `scripts/deploy-frontend.mjs` | Deploy FTP para Hostinger (pode falhar em redes com portas passivas bloqueadas) |
| `scripts/deploy-sftp.mjs` | Deploy SFTP para Hostinger (fallback confiavel, porta 65002) |

---

## 16. Variaveis de Ambiente

### Backend (`backend/.env`)
```
DATABASE_URL=mysql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...
MP_ACCESS_TOKEN=...
MP_WEBHOOK_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
REDIS_URL=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
FRONTEND_URL=https://craftcardgenz.com
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=https://craftcard.onrender.com/api
VITE_GOOGLE_CLIENT_ID=...
```

---

*Documentacao gerada em Marco/2026. Produto CodeCraftGenZ.*
