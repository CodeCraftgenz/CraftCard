# CraftCard - Visao Geral

## O que e o CraftCard?

CraftCard e uma plataforma SaaS para criacao de cartoes digitais profissionais. Usuarios podem criar perfis com foto, bio, redes sociais, WhatsApp e compartilhar com um unico link.

**URL de producao:** https://craftcardgenz.com

## Tech Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Backend | NestJS | 10.x |
| ORM | Prisma | 6.x |
| Banco de Dados | MySQL | 8.0 |
| Autenticacao | Passport JWT + Google OAuth + bcrypt | - |
| Pagamentos | Mercado Pago SDK | 2.x |
| Frontend | React | 18.x |
| Build | Vite | 6.x |
| Estilizacao | TailwindCSS | 3.x |
| Estado | React Query (TanStack) | 5.x |
| Animacoes | Framer Motion | 11.x |
| PWA | vite-plugin-pwa (Workbox) | - |
| Testes E2E | Playwright | 1.58 |
| Storage | Cloudflare R2 | - |
| Email | Nodemailer (SMTP) | - |
| CI/CD | GitHub Actions | - |

## Estrutura do Projeto

```
CardCraft/
├── backend/                  # API NestJS
│   ├── prisma/               # Schema + migrations
│   ├── src/
│   │   ├── admin/            # Painel super admin
│   │   ├── analytics/        # Views, cliques, UTM, achievements
│   │   ├── auth/             # Google OAuth + login nativo + JWT
│   │   ├── bookings/         # Agendamentos
│   │   ├── common/           # Guards, decorators, exceptions, interceptors, Prisma
│   │   ├── contacts/         # Mensagens de contato
│   │   ├── gallery/          # Galeria de imagens
│   │   ├── mail/             # Servico de email (SMTP)
│   │   ├── me/               # Endpoint /me (dados do usuario logado)
│   │   ├── notifications/    # Push + in-app notifications
│   │   ├── organizations/    # Sistema B2B (orgs, convites, branding)
│   │   ├── payments/         # Mercado Pago, planos, feature gating
│   │   ├── profiles/         # CRUD de cartoes digitais
│   │   ├── slugs/            # Verificacao e sugestao de slugs
│   │   ├── storage/          # Upload de arquivos (Cloudflare R2)
│   │   ├── testimonials/     # Depoimentos
│   │   ├── users/            # Servico de usuarios
│   │   └── webhooks/         # Webhooks para integracoes
│   └── dist/                 # Build compilado
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── atoms/        # Componentes basicos (15)
│   │   │   ├── molecules/    # Compostos simples
│   │   │   ├── organisms/    # Componentes complexos (20)
│   │   │   └── sections/     # Secoes da landing page (11)
│   │   ├── hooks/            # React hooks customizados (19)
│   │   ├── lib/              # Utilitarios (api, templates, fonts, pix)
│   │   ├── pages/            # Paginas da aplicacao (16)
│   │   └── providers/        # Context providers (Auth, Query)
│   ├── e2e/                  # Testes Playwright
│   └── dist/                 # Build para producao
├── infra/                    # Docker Compose (MySQL)
├── scripts/                  # Scripts de deploy (FTP/SFTP)
├── doc/                      # Documentacao (voce esta aqui)
├── .github/workflows/        # CI/CD
├── Makefile                  # Comandos de desenvolvimento
└── package.json              # Workspace raiz
```

## Modulos do Backend (21)

| Modulo | Descricao |
|--------|-----------|
| `auth` | Login Google OAuth, login nativo, registro, reset senha, JWT |
| `users` | CRUD de usuarios |
| `profiles` | Cartoes digitais (CRUD, servicos, FAQ, dominio custom) |
| `me` | Endpoint `/me` com dados do usuario logado |
| `contacts` | Mensagens recebidas via cartao |
| `testimonials` | Depoimentos de clientes |
| `gallery` | Galeria de imagens do portfolio |
| `bookings` | Sistema de agendamentos |
| `analytics` | Views, cliques, UTM tracking, achievements |
| `payments` | Mercado Pago, checkout, planos |
| `organizations` | Equipes B2B, convites, branding |
| `webhooks` | Integracoes externas |
| `notifications` | Push + in-app notifications |
| `storage` | Upload de fotos, covers, resumes, videos, backgrounds |
| `mail` | Emails transacionais (welcome, reset, invite, booking) |
| `admin` | Painel super admin |
| `slugs` | Verificacao e sugestoes de URL slug |
| `common` | Guards, decorators, exceptions, interceptors, Prisma, cache |

## Paginas do Frontend (16)

| Pagina | Rota | Protegida | Descricao |
|--------|------|-----------|-----------|
| LandingPage | `/` | Nao | Pagina inicial publica |
| LoginPage | `/login` | Nao | Login (email/senha + Google) |
| RegisterPage | `/register` | Nao | Cadastro nativo |
| ForgotPasswordPage | `/forgot-password` | Nao | Solicitar reset de senha |
| ResetPasswordPage | `/reset-password` | Nao | Redefinir senha via token |
| EditorPage | `/editor` | Sim | Editor principal do cartao |
| BillingPage | `/billing` | Sim | Gestao de assinatura |
| BillingSuccessPage | `/billing/success` | Sim | Confirmacao de pagamento |
| TutorialPage | `/tutorial` | Sim | Onboarding / tutorial |
| OrgDashboardPage | `/org/:orgId` | Sim | Dashboard da organizacao |
| OrgJoinPage | `/org/join/:token` | Sim | Aceitar convite de org |
| WebhooksPage | `/webhooks` | Sim | Config de webhooks |
| AdminPage | `/admin` | Sim (SUPER_ADMIN) | Painel administrativo |
| WidgetPage | `/widget/:slug` | Nao | Widget embarcavel |
| PublicCardPage | `/:slug` | Nao | Cartao publico |
| NotFound | `*` | Nao | Pagina 404 |

## Diagrama de Relacoes Principal

```
User
├── Profile[] ──────────────────────────┐
│   ├── SocialLink[] → LinkClick[]      │
│   ├── ProfileView[]                   │
│   ├── ViewEvent[]                     │
│   ├── GalleryImage[]                  │
│   ├── ContactMessage[]                │
│   ├── Testimonial[]                   │
│   ├── AvailableSlot[]                 │
│   ├── Booking[]                       │
│   ├── Service[]                       │
│   ├── FaqItem[]                       │
│   ├── CustomFormField[]               │
│   └── CustomDomain                    │
├── Payment[]                           │
├── RefreshToken[]                      │
├── Achievement[]                       │
├── PushSubscription[]                  │
├── Webhook[]                           │
├── Notification[]                      │
└── OrganizationMember[] ──┐            │
                           ▼            │
                    Organization        │
                    ├── OrganizationMember[]
                    ├── OrganizationInvite[]
                    └── Profile[] ◄─────┘
```
