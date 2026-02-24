<p align="center">
  <img src="logo-codecraftgenz.png" alt="CodeCraftGenZ" width="400" />
</p>

<h1 align="center">CraftCard</h1>

<p align="center">
  <strong>Plataforma completa de cartoes digitais profissionais</strong><br />
  Links, Portfolio, QR Code, Agendamentos, Leads e muito mais.
</p>

<p align="center">
  <a href="https://craftcardgenz.com">craftcardgenz.com</a>
</p>

---

## Sobre o Projeto

**CraftCard** e uma plataforma SaaS para criacao e gerenciamento de cartoes digitais profissionais. Oferece funcionalidades B2C (usuarios individuais) e B2B (organizacoes com gestao de equipes).

### Principais Funcionalidades

- Cartoes digitais personalizaveis com 10+ temas visuais
- Links sociais com rastreamento de cliques
- Galeria de portfolio com upload de imagens
- Sistema de agendamentos (booking)
- Depoimentos de clientes
- Servicos e FAQ
- QR Code para compartilhamento
- Analytics detalhado (views, cliques, dispositivos, UTM)
- Organizacoes B2B com branding corporativo e dashboard
- Sistema de planos (Free, Pro, Business, Enterprise)
- Pagamentos via Mercado Pago (PIX + cartao)
- Notificacoes push (Web Push API)
- PWA instalavel
- Gamificacao com conquistas
- Webhooks para integracoes externas
- Dominio customizado (Enterprise)
- Email de convites corporativos

---

## Tech Stack

### Backend

| Tecnologia | Uso |
|---|---|
| **NestJS** | Framework HTTP + modular |
| **Prisma** | ORM + migrations |
| **MySQL** | Banco de dados |
| **Zod** | Validacao de DTOs |
| **Passport JWT** | Autenticacao (access + refresh tokens) |
| **Google Auth** | OAuth 2.0 login |
| **Mercado Pago SDK** | Pagamentos |
| **NodeMailer** | Envio de emails |
| **Sharp** | Processamento de imagens |
| **web-push** | Notificacoes push |

### Frontend

| Tecnologia | Uso |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **TailwindCSS** | Estilizacao |
| **React Query** | Cache e estado do servidor |
| **Framer Motion** | Animacoes |
| **Lucide React** | Icones |
| **VitePWA** | Progressive Web App |
| **html2canvas** | Export de cartoes |

---

## Estrutura do Projeto

```
CardCraft/
├── backend/
│   ├── prisma/           # Schema + migrations
│   └── src/
│       ├── admin/        # Painel super admin
│       ├── analytics/    # Views, cliques, UTM
│       ├── auth/         # Google OAuth + JWT
│       ├── bookings/     # Agendamentos
│       ├── contacts/     # Mensagens de contato
│       ├── gallery/      # Portfolio de imagens
│       ├── mail/         # Servico de email
│       ├── me/           # Endpoint /me (perfil do usuario)
│       ├── notifications/# Push notifications
│       ├── organizations/# B2B: orgs, membros, convites
│       ├── payments/     # Planos, Mercado Pago, guards
│       ├── profiles/     # CRUD de cartoes digitais
│       └── common/       # Config, exceptions, guards
├── frontend/
│   ├── public/           # Assets estaticos, SW
│   └── src/
│       ├── components/   # atoms, organisms, sections
│       ├── pages/        # 12 paginas principais
│       ├── hooks/        # 16 custom hooks
│       ├── lib/          # API, utils, templates
│       └── providers/    # Auth provider
├── infra/                # Docker, configs
├── scripts/              # Deploy, utilitarios
└── Makefile              # Comandos rapidos
```

---

## Configuracao Local

### Pre-requisitos

- Node.js >= 20
- MySQL 8+
- Conta Google Cloud (OAuth)
- Conta Mercado Pago (pagamentos)

### 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/CardCraft.git
cd CardCraft
npm install
```

### 2. Configurar variaveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` com suas credenciais (DB, JWT, Google OAuth, Mercado Pago, SMTP, VAPID).

### 3. Configurar banco de dados

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Rodar em desenvolvimento

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

---

## Deploy

| Servico | Plataforma | Metodo |
|---|---|---|
| Backend | Render | Push to `main` → auto-deploy |
| Frontend | Hostinger | `npm run build` → FTP deploy via script |
| Banco | Hostinger | MySQL remoto |

---

## Planos e Monetizacao

| Feature | Free | Pro | Business | Enterprise |
|---|:---:|:---:|:---:|:---:|
| Cartoes | 1 | 5 | 50 | 50 |
| Links | 5 | 20 | 50 | 50 |
| Temas | 3 | Todos | Todos | Todos |
| Analytics | - | ✓ | ✓ | ✓ |
| Galeria | - | ✓ | ✓ | ✓ |
| Agendamentos | - | ✓ | ✓ | ✓ |
| Depoimentos | - | ✓ | ✓ | ✓ |
| Org Dashboard | - | - | ✓ | ✓ |
| Branding Corp. | - | - | ✓ | ✓ |
| Dominio Custom | - | - | - | ✓ |
| Webhooks | - | - | ✓ | ✓ |

---

## Licenca

Projeto proprietario — **CodeCraftGenZ**. Todos os direitos reservados.
