# API Endpoints

Todos os endpoints sao prefixados com `/api` pelo proxy do Vite (desenvolvimento) ou pelo deploy (producao).

## Convencoes

- **Autenticacao**: JWT em httpOnly cookie (automatico)
- **Rate Limiting**: `@Throttle()` com buckets `short` (3-5/60s) e `medium` (60/60s)
- **Feature Gating**: `@RequiresFeature('feature')` + `PlanGuard` verifica plano do usuario
- **Org Roles**: `@RequiresOrgRole('ROLE')` + `OrgRoleGuard` verifica papel na organizacao
- **Cache**: `CacheInterceptor` + `@CacheTTL(300)` em endpoints publicos (5 min)
- **Validacao**: Zod schemas em todos os DTOs
- **Resposta padrao**: `{ data, message?, statusCode }` via `ResponseInterceptor`

---

## Auth (`/auth`)

| Metodo | Path | Auth | Rate Limit | Descricao |
|--------|------|------|------------|-----------|
| POST | `/auth/google` | Public | 5/60s | Login via Google OAuth |
| POST | `/auth/register` | Public | 5/60s | Registro com email/senha |
| POST | `/auth/login` | Public | 5/60s | Login com email/senha |
| POST | `/auth/forgot-password` | Public | 3/60s | Solicitar reset de senha |
| POST | `/auth/reset-password` | Public | 3/60s | Redefinir senha com token |
| POST | `/auth/refresh` | Public | 5/60s | Renovar tokens JWT |
| POST | `/auth/logout` | JWT | - | Logout (revoga refresh tokens) |
| POST | `/auth/dev` | Public | - | Login dev (bloqueado em producao) |

---

## Me (`/me`)

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/me` | JWT | Dados do usuario logado + plano + limites |
| DELETE | `/me` | JWT | Deletar conta do usuario |

---

## Profiles (varios prefixos)

### Perfil do usuario

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/me/profile` | JWT | Obter perfil do usuario |
| PUT | `/me/profile` | JWT | Atualizar perfil |
| GET | `/me/cards` | JWT | Listar cartoes do usuario |
| POST | `/me/cards` | JWT | Criar novo cartao |
| DELETE | `/me/cards/:id` | JWT | Deletar cartao |
| PUT | `/me/cards/:id/primary` | JWT | Definir cartao como principal |
| GET | `/profile/:slug` | Public | Perfil publico (cache 5 min) |

### Servicos (PRO+)

| Metodo | Path | Feature | Descricao |
|--------|------|---------|-----------|
| GET | `/me/services` | `services` | Listar servicos |
| POST | `/me/services` | `services` | Criar servico |
| PUT | `/me/services/:id` | `services` | Atualizar servico |
| DELETE | `/me/services/:id` | `services` | Deletar servico |
| PUT | `/me/services-order` | `services` | Reordenar servicos |

### FAQ (PRO+)

| Metodo | Path | Feature | Descricao |
|--------|------|---------|-----------|
| GET | `/me/faq` | `faq` | Listar FAQs |
| POST | `/me/faq` | `faq` | Criar FAQ |
| PUT | `/me/faq/:id` | `faq` | Atualizar FAQ |
| DELETE | `/me/faq/:id` | `faq` | Deletar FAQ |
| PUT | `/me/faq-order` | `faq` | Reordenar FAQs |

### Dominio Custom (ENTERPRISE)

| Metodo | Path | Feature | Descricao |
|--------|------|---------|-----------|
| GET | `/me/domain` | `customDomain` | Obter dominio custom |
| POST | `/me/domain` | `customDomain` | Configurar dominio |
| POST | `/me/domain/verify` | `customDomain` | Verificar DNS do dominio |
| DELETE | `/me/domain` | `customDomain` | Remover dominio |

### Campos de Formulario (PRO+)

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/me/form-fields` | `contacts` | Listar campos customizados |
| POST | `/me/form-fields` | `contacts` | Criar campo |
| PUT | `/me/form-fields/:id` | `contacts` | Atualizar campo |
| DELETE | `/me/form-fields/:id` | `contacts` | Deletar campo |
| PUT | `/me/form-fields-order` | `contacts` | Reordenar campos |
| GET | `/profile/:slug/form-fields` | Public | Campos publicos do perfil |

---

## OG (Open Graph) (`/og`)

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/og/image/:slug` | Public | Gerar imagem OG para compartilhamento |
| GET | `/og/:slug` | Public | Meta tags OG (redireciona para frontend se nao for bot) |

---

## Contacts (`/contacts`)

| Metodo | Path | Auth | Rate Limit | Descricao |
|--------|------|------|------------|-----------|
| POST | `/contacts/:slug` | Public | 5/60s | Enviar mensagem para perfil |
| GET | `/contacts/me` | `contacts` | - | Mensagens recebidas |
| GET | `/contacts/me/export` | `leadsExport` | - | Exportar mensagens CSV |
| GET | `/contacts/me/unread-count` | `contacts` | - | Contagem de nao lidas |
| PATCH | `/contacts/:id/read` | `contacts` | - | Marcar como lida |

---

## Testimonials (`/testimonials`)

| Metodo | Path | Auth | Rate Limit | Descricao |
|--------|------|------|------------|-----------|
| POST | `/testimonials/:slug` | Public | 5/60s | Enviar depoimento |
| GET | `/testimonials/me` | `testimonials` | - | Listar depoimentos |
| PATCH | `/testimonials/:id/approve` | `testimonials` | - | Aprovar depoimento |
| DELETE | `/testimonials/:id` | `testimonials` | - | Rejeitar/deletar depoimento |

---

## Gallery (`/me/gallery`)

Todos os endpoints requerem `@RequiresFeature('gallery')`.

| Metodo | Path | Descricao |
|--------|------|-----------|
| POST | `/me/gallery` | Upload de imagem (max 5MB, jpeg/png/webp) |
| GET | `/me/gallery` | Listar imagens da galeria |
| PUT | `/me/gallery/order` | Reordenar imagens |
| PUT | `/me/gallery/:id/caption` | Atualizar legenda |
| DELETE | `/me/gallery/:id` | Deletar imagem |

---

## Bookings (`/bookings`)

### Publicos

| Metodo | Path | Rate Limit | Descricao |
|--------|------|------------|-----------|
| GET | `/bookings/slots/:slug` | - | Slots disponiveis do perfil |
| GET | `/bookings/available/:slug` | - | Horarios livres para uma data |
| POST | `/bookings/:slug` | 5/60s | Criar agendamento |

### Autenticados (PRO+)

| Metodo | Path | Feature | Descricao |
|--------|------|---------|-----------|
| GET | `/bookings/me/list` | `bookings` | Meus agendamentos |
| GET | `/bookings/me/slots` | `bookings` | Meus slots de disponibilidade |
| PUT | `/bookings/me/slots` | `bookings` | Salvar slots |
| PUT | `/bookings/me/:id/status` | `bookings` | Atualizar status do agendamento |

---

## Analytics (`/analytics`)

### Publicos (Tracking)

| Metodo | Path | Rate Limit | Descricao |
|--------|------|------------|-----------|
| POST | `/analytics/click` | 30/60s | Registrar clique em link |
| POST | `/analytics/view` | 30/60s | Registrar visualizacao (com UTM) |

### Autenticados

| Metodo | Path | Feature | Descricao |
|--------|------|---------|-----------|
| GET | `/analytics/me` | `analytics` | Dashboard de analytics |
| GET | `/analytics/achievements` | JWT | Listar conquistas |
| POST | `/analytics/achievements/check` | JWT | Verificar novas conquistas |

---

## Payments (`/payments`)

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/payments/checkout` | JWT | Criar preferencia de checkout (Mercado Pago) |
| GET | `/payments/billing` | JWT | Info de cobranca + historico |
| POST | `/payments/verify` | JWT | Verificar pagamentos pendentes (fallback) |
| POST | `/payments/webhook` | Public | Webhook Mercado Pago (IPN + JSON) |
| POST | `/payments/admin/activate-plan` | SUPER_ADMIN | Ativar plano manualmente |
| GET | `/payments/admin/users` | SUPER_ADMIN | Listar usuarios com planos |

---

## Organizations (`/organizations`)

### CRUD

| Metodo | Path | Role | Descricao |
|--------|------|------|-----------|
| POST | `/organizations` | JWT | Criar organizacao |
| GET | `/organizations/me` | JWT | Minhas organizacoes |
| GET | `/organizations/:orgId` | MEMBER | Detalhes da org |
| PUT | `/organizations/:orgId` | ADMIN | Atualizar org (branding, config) |
| DELETE | `/organizations/:orgId` | OWNER | Deletar organizacao |

### Membros

| Metodo | Path | Role | Descricao |
|--------|------|------|-----------|
| GET | `/organizations/:orgId/members` | MEMBER | Listar membros |
| PUT | `/organizations/:orgId/members/:memberId` | ADMIN | Alterar papel do membro |
| DELETE | `/organizations/:orgId/members/:memberId` | ADMIN | Remover membro |

### Convites

| Metodo | Path | Role | Descricao |
|--------|------|------|-----------|
| POST | `/organizations/:orgId/invite` | ADMIN | Criar convite (7 dias) |
| GET | `/organizations/:orgId/invites` | ADMIN | Listar convites pendentes |
| GET | `/organizations/invite/:token` | Public | Preview do convite |
| POST | `/organizations/join/:token` | JWT | Aceitar convite |
| DELETE | `/organizations/:orgId/invites/:inviteId` | ADMIN | Revogar convite |

### Branding & Analytics

| Metodo | Path | Role | Descricao |
|--------|------|------|-----------|
| POST | `/organizations/:orgId/bulk-apply` | ADMIN | Aplicar branding em todos os perfis |
| GET | `/organizations/:orgId/analytics` | ADMIN | Analytics consolidado |

### Leads

| Metodo | Path | Role | Descricao |
|--------|------|------|-----------|
| GET | `/organizations/:orgId/leads` | ADMIN | Leads com paginacao e busca |
| PUT | `/organizations/:orgId/leads/mark-all-read` | ADMIN | Marcar todos como lidos |
| PUT | `/organizations/:orgId/leads/:leadId/read` | ADMIN | Marcar lead como lido |
| GET | `/organizations/:orgId/leads/export` | ADMIN | Exportar leads CSV |

### Perfis

| Metodo | Path | Role | Descricao |
|--------|------|------|-----------|
| POST | `/organizations/:orgId/profiles/:profileId` | ADMIN | Vincular perfil a org |
| DELETE | `/organizations/:orgId/profiles/:profileId` | ADMIN | Desvincular perfil |

---

## Webhooks (`/webhooks`)

Todos requerem `@RequiresFeature('webhooks')` (BUSINESS+).

| Metodo | Path | Descricao |
|--------|------|-----------|
| GET | `/webhooks` | Listar webhooks |
| POST | `/webhooks` | Criar webhook |
| PUT | `/webhooks/:id` | Atualizar webhook |
| DELETE | `/webhooks/:id` | Deletar webhook |
| POST | `/webhooks/:id/test` | Testar webhook |

---

## Notifications (`/notifications`)

### Push

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/notifications/vapid-key` | Public | Chave publica VAPID |
| POST | `/notifications/subscribe` | JWT | Inscrever para push |
| DELETE | `/notifications/subscribe` | JWT | Cancelar push |

### In-App

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/notifications` | JWT | Listar notificacoes |
| PUT | `/notifications/read-all` | JWT | Marcar todas como lidas |
| PUT | `/notifications/:id/read` | JWT | Marcar como lida |

---

## Storage (uploads)

### Gratuitos

| Metodo | Path | Max Size | Formatos | Descricao |
|--------|------|----------|----------|-----------|
| POST | `/me/photo-upload` | 5MB | jpeg, png, webp | Foto do perfil |
| POST | `/me/cover-upload` | 5MB | jpeg, png, webp | Foto de capa |

### PRO+

| Metodo | Path | Feature | Max Size | Formatos | Descricao |
|--------|------|---------|----------|----------|-----------|
| POST | `/me/resume-upload` | `resume` | 10MB | pdf | Curriculo |
| POST | `/me/video-upload` | `video` | 20MB | mp4 | Video de apresentacao |
| POST | `/me/background-upload` | `customBg` | 5MB | jpeg, png, webp | Background customizado |
| DELETE | `/me/background` | `customBg` | - | - | Remover background |

---

## Slugs (`/slug`)

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/slug/check/:slug` | JWT | Verificar disponibilidade do slug |
| GET | `/slug/suggestions/:base` | JWT | Sugestoes de slug baseadas em um texto |

---

## Admin (`/admin`)

Todos requerem `@Roles('SUPER_ADMIN')`.

| Metodo | Path | Descricao |
|--------|------|-----------|
| GET | `/admin/dashboard` | Estatisticas do dashboard |
| GET | `/admin/users` | Listar usuarios (busca, filtro por plano/role) |
| GET | `/admin/users/:userId` | Detalhes do usuario |
| PUT | `/admin/users/:userId` | Atualizar usuario |
| DELETE | `/admin/users/:userId` | Deletar usuario |
| GET | `/admin/payments` | Listar pagamentos (filtro por status/plano) |
| GET | `/admin/organizations` | Listar organizacoes |
| GET | `/admin/organizations/:orgId` | Detalhes da organizacao |
| PUT | `/admin/organizations/:orgId` | Atualizar organizacao |

---

## Resumo

| Modulo | Endpoints | Observacao |
|--------|-----------|------------|
| Auth | 8 | Todos publicos com rate limiting |
| Me | 2 | Dados do usuario logado |
| Profiles | 30 | Maior controller, inclui servicos, FAQ, dominio, form fields |
| OG | 2 | Imagens e meta tags para compartilhamento social |
| Contacts | 5 | Mensagens de contato com export CSV |
| Testimonials | 4 | Depoimentos com aprovacao manual |
| Gallery | 5 | Upload e gestao de imagens |
| Bookings | 7 | Agendamentos publicos + gestao |
| Analytics | 5 | Tracking publico + dashboard PRO |
| Payments | 6 | Checkout Mercado Pago + webhook |
| Organizations | 20 | B2B completo: membros, convites, branding, analytics, leads |
| Webhooks | 5 | Integracoes externas (BUSINESS+) |
| Notifications | 6 | Push (VAPID) + in-app |
| Storage | 6 | Upload de arquivos (R2) |
| Slugs | 2 | Verificacao e sugestoes de URL |
| Admin | 9 | Painel administrativo SUPER_ADMIN |
| **Total** | **~122** | |
