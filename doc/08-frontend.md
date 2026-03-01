# Frontend

O frontend e uma SPA React com Vite, TailwindCSS, React Query e Framer Motion.

## Estrutura

```
frontend/src/
├── components/
│   ├── atoms/          # 15 componentes basicos
│   ├── organisms/      # 22 componentes complexos
│   └── sections/       # 11 secoes da landing page
├── hooks/              # 19 hooks customizados
├── lib/                # Utilitarios (api, templates, fonts, pix)
├── pages/              # 16 paginas
└── providers/          # Context providers (Auth, Query)
```

---

## Paginas (16)

| Pagina | Rota | Auth | Descricao |
|--------|------|------|-----------|
| LandingPage | `/` | - | Landing page publica |
| LoginPage | `/login` | - | Login (email/senha + Google) |
| RegisterPage | `/register` | - | Cadastro nativo |
| ForgotPasswordPage | `/forgot-password` | - | Solicitar reset de senha |
| ResetPasswordPage | `/reset-password` | - | Redefinir senha |
| EditorPage | `/editor` | JWT | Editor principal do cartao |
| BillingPage | `/billing` | JWT | Gestao de assinatura |
| BillingSuccessPage | `/billing/success` | JWT | Confirmacao de pagamento |
| TutorialPage | `/tutorial` | JWT | Onboarding |
| OrgDashboardPage | `/org/:orgId` | JWT | Dashboard da organizacao |
| OrgJoinPage | `/org/join/:token` | JWT | Aceitar convite de org |
| WebhooksPage | `/webhooks` | JWT | Configuracao de webhooks |
| AdminPage | `/admin` | SUPER_ADMIN | Painel administrativo |
| WidgetPage | `/widget/:slug` | - | Widget embarcavel |
| PublicCardPage | `/:slug` | - | Cartao publico |
| NotFound | `*` | - | Pagina 404 |

**Roteamento:** React Router v6 com lazy loading para paginas autenticadas.

---

## Componentes

### Atoms (15)

| Componente | Descricao |
|------------|-----------|
| Logo | Logo do CraftCard |
| LoadingSpinner | Indicador de carregamento |
| ErrorBoundary | Wrapper de tratamento de erros |
| ScrollProgressBar | Barra de progresso de scroll |
| StickyCtaBanner | Banner CTA fixo |
| SectionDivider | Divisor visual entre secoes |
| FloatingDecorations | Elementos decorativos animados |
| Marquee | Texto/conteudo em scroll continuo |
| MagneticButton | Botao com efeito magnetico ao cursor |
| BackToTopButton | Botao de voltar ao topo |
| Typewriter | Efeito de digitacao |
| RevealSection | Animacao de revelacao no scroll |
| Pagination | Controle de paginacao |
| AnimatedBackground | Background animado |
| LandingBackground | Background especifico da landing |

### Organisms (22)

| Componente | Descricao |
|------------|-----------|
| Header | Navegacao principal |
| Footer | Rodape |
| ProtectedRoute | Wrapper de rota autenticada |
| AdminRoute | Wrapper de rota admin |
| CardPreview | Preview em tempo real do cartao |
| StyleEditor | Editor de estilos do cartao |
| TemplatePicker | Seletor de templates |
| CardSwitcher | Alternancia entre cartoes |
| OnboardingWizard | Wizard de onboarding multi-step |
| BookingCalendar | Calendario de agendamentos |
| ServicesEditor | Editor de servicos |
| FaqEditor | Editor de FAQs |
| GalleryGrid | Grid de imagens da galeria |
| FormFieldEditor | Editor de campos de formulario |
| CustomQrCode | Gerador de QR code |
| EmailSignature | Gerador de assinatura de email |
| WidgetCodeGenerator | Gerador de codigo de widget embarcavel |
| NotificationBell | Centro de notificacoes |
| SortableLinkItem | Item de link arrastavel/ordenavel |
| LinkRenderer | Renderizador dinamico de links |
| UpgradeBanner | Banner de upgrade de plano |
| FeatureLock | Bloqueio de feature por plano |

### Sections (Landing Page) (11)

| Componente | Descricao |
|------------|-----------|
| HeroSection | Secao hero com CTA principal |
| SocialProofSection | Depoimentos e prova social |
| TrustedBySection | Logos de empresas/clientes |
| FeaturesShowcaseSection | Showcase de funcionalidades |
| UseCasesSection | Casos de uso |
| TemplateGallerySection | Galeria de templates |
| HowItWorksSection | Passo a passo |
| BenefitsSection | Beneficios |
| PricingSection | Tabela de precos |
| FaqSection | Perguntas frequentes |
| CtaSection | Call-to-action final |

---

## Hooks (19)

| Hook | Descricao |
|------|-----------|
| `useProfile` | CRUD de perfil, cartoes, upload de foto/cover/resume/video/background |
| `useContacts` | Mensagens recebidas, marcar como lida, enviar mensagem |
| `useTestimonials` | Depoimentos: listar, aprovar, rejeitar, enviar |
| `useGallery` | Galeria: upload, delete, reorder, caption |
| `useBookings` | Agendamentos: slots, horarios, criar, atualizar status |
| `useServices` | Servicos: CRUD + reorder |
| `useFaq` | FAQs: CRUD + reorder |
| `useFormFields` | Campos de formulario customizados |
| `useAnalytics` | Dashboard de analytics, tracking de clicks e views |
| `useBilling` | Info de cobranca, checkout |
| `useNotifications` | Notificacoes in-app |
| `usePushNotifications` | Push notifications (VAPID) |
| `useWebhooks` | CRUD de webhooks + teste |
| `useOrganization` | Org completo: CRUD, membros, convites, analytics, leads, branding |
| `useAdmin` | Painel admin: dashboard, usuarios, pagamentos, orgs |
| `useAchievements` | Conquistas/gamificacao |
| `usePwaInstall` | Instalacao PWA |
| `useCountUp` | Animacao de contagem (scroll-triggered) |
| `useDebouncedCallback` | Debounce de callbacks |

Todos os hooks usam **React Query (TanStack)** para gerenciar estado do servidor com:
- Stale time: 5 minutos
- Retry: 1 tentativa
- Invalidacao automatica apos mutations

---

## Providers

### AuthProvider

Gerencia estado global de autenticacao e dados do usuario.

**Metodos:**
- `login(googleCredential)` — Login via Google OAuth
- `loginWithPassword(email, password)` — Login nativo
- `register(data)` — Registro (com suporte a inviteToken)
- `devLogin()` — Login dev (desenvolvimento)
- `logout()` — Logout
- `refreshAuth()` — Re-buscar dados do usuario
- `hasFeature(feature)` — Verificar feature do plano

**Estado:**
- `user` — Dados do usuario logado
- `isAuthenticated` — Se esta autenticado
- `plan` — Plano ativo (FREE/PRO/BUSINESS/ENTERPRISE)
- `planLimits` — Limites do plano (maxCards, maxLinks, etc.)
- `cards` — Cartoes do usuario
- `organizations` — Organizacoes do usuario

### QueryProvider

Configura React Query com defaults globais:
- Stale time: 5 minutos
- Retry: 1 vez
- Sem refetch automatico ao focar janela

---

## Lib (Utilitarios)

### api.ts

Instancia Axios configurada:
- Base URL do ambiente (`VITE_API_URL`)
- Interceptor de 401: refresh automatico com fila de requisicoes
- Suporte a FormData (remove Content-Type para multipart)
- Tratamento de erros customizado

### constants.ts

- `BRAND_COLORS`: Cyan, Magenta, Purple, Dark BG
- `PRESET_BUTTON_COLORS`: 16 cores de botao
- `PRESET_GRADIENTS`: 8 gradientes pre-definidos
- `PRESET_PATTERNS`: 6 patterns de background (dots, grid, waves, etc.)
- `LINK_STYLES`: 5 estilos de link (rounded, pill, square, outline, ghost)
- `LINK_ANIMATIONS`: 4 animacoes (none, scale, slide, glow)
- `SOCIAL_PLATFORMS`: 16 plataformas (WhatsApp, Instagram, GitHub, LinkedIn, etc.)

### card-templates.ts

5 templates pre-definidos:
1. **Developer** — Tema neon, cor cyan, foco em GitHub/LinkedIn
2. **Designer** — Tema gradient, cor magenta, foco em Instagram/portfolio
3. **Marketing** — Tema bold, cor amber, foco em growth/cases
4. **Lawyer** — Tema elegant, cor gold, foco em profissionalismo/agendamento
5. **Freelancer** — Tema ocean, cor cyan, foco em portfolio/pricing

### google-fonts.ts

- 15 fontes disponiveis (Inter, Poppins, Roboto, Montserrat, etc.)
- `loadGoogleFont(family)` — Carrega fonte dinamicamente via `<link>`

### pix-generator.ts

Gerador de QR code Pix (BR Code / EMV):
- `generatePixPayload({ pixKey, merchantName, merchantCity, amount, description })`
- Gera payload renderizavel como QR code

---

## PWA

Configurado via `vite-plugin-pwa` com Workbox:

- **Auto-update**: Service worker atualiza automaticamente
- **Manifesto**: Nome "CraftCard", tema cyan (#00E4F2)
- **Icons**: 192x192 e 512x512 (maskable)
- **Cache strategies**:
  - Google Fonts: Cache-first, 1 ano
  - Resume endpoints: Network-first, 1 hora
  - API endpoints: Network-first, 5 minutos
- **Push**: Importa `push-sw.js` para notificacoes push
- **Critico**: `navigateFallbackDenylist: [/^\/uploads\//]` — Previne SW de interceptar uploads

### Instalacao PWA

O hook `usePwaInstall` detecta:
- `beforeinstallprompt` event
- Modo standalone (ja instalado)
- Retorna `{ canInstall, isInstalled, install() }`

---

## Build e Desenvolvimento

### Desenvolvimento

```bash
cd frontend && npm run dev
# Vite dev server em http://localhost:5173
# Proxy /api → http://localhost:3000
```

### Build

```bash
cd frontend && npm run build
# Saida: frontend/dist/
# Assets com hash para cache busting
```

### Path Aliases

- `@` resolve para `./src` (configurado no Vite)

```typescript
import { api } from '@/lib/api';
import { useProfile } from '@/hooks/useProfile';
```

---

## Testes E2E

Framework: **Playwright** (`frontend/e2e/`)

```bash
make test-e2e
# ou: cd frontend && npx playwright test
```
