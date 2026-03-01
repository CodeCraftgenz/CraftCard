# Banco de Dados

**ORM:** Prisma 6.x
**Banco:** MySQL 8.0
**Schema:** `backend/prisma/schema.prisma`

## Modelos

### User (`users`)

Conta de usuario com suporte a autenticacao Google e nativa.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `email` | String (unique) | Email de login |
| `name` | String | Nome do usuario |
| `googleId` | String? (unique) | ID do Google OAuth (opcional para contas nativas) |
| `passwordHash` | String? | Hash bcrypt da senha (contas nativas) |
| `passwordResetToken` | String? | Token SHA256 para reset de senha |
| `passwordResetExpiresAt` | DateTime? | Expiracao do token de reset (1h) |
| `avatarUrl` | String? | URL da foto de perfil |
| `plan` | String | Plano: FREE, PRO, BUSINESS, ENTERPRISE |
| `role` | String | Role: USER, ADMIN, SUPER_ADMIN |
| `createdAt` | DateTime | Data de criacao |
| `updatedAt` | DateTime | Ultima atualizacao |

**Relacoes:** profiles[], payments[], refreshTokens[], orgMemberships[], achievements[], pushSubscriptions[], webhooks[], notifications[]

---

### Profile (`profiles`)

Cartao digital. Um usuario pode ter multiplos perfis.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `displayName` | String | Nome exibido no cartao |
| `label` | String | Label do cartao (Principal, Side Project) |
| `isPrimary` | Boolean | Cartao primario |
| `bio` | Text? | Biografia |
| `photoUrl` | String? | URL da foto (R2) |
| `photoData` | MediumText? | Foto em base64 |
| `resumeUrl` | String? | URL do curriculo |
| `resumeData` | LongText? | Curriculo em base64 |
| `resumeType` | String? | MIME type do curriculo |
| `buttonColor` | String | Cor do botao CTA (default: #00E4F2) |
| `slug` | String (unique) | URL publica (ex: `craftcardgenz.com/joao`) |
| `isPublished` | Boolean | Publicado/visivel |
| `viewCount` | Int | Total de visualizacoes |
| `cardTheme` | String | Tema visual (default, dark, neon...) |
| `coverPhotoUrl` | String? | URL da capa |
| `coverPhotoData` | MediumText? | Capa em base64 |
| `photoPositionY` | Int | Posicao Y da foto (0-100) |
| `coverPositionY` | Int | Posicao Y da capa (0-100) |
| `availabilityStatus` | String? | available, busy, unavailable |
| `availabilityMessage` | String? | Mensagem de disponibilidade |
| `videoUrl` | String? | URL de video intro |
| `leadCaptureEnabled` | Boolean | Formulario de leads ativo |
| `bookingEnabled` | Boolean | Agendamento ativo |
| `fontFamily` | String? | Fonte customizada |
| `fontSizeScale` | Float? | Escala da fonte (default: 1.0) |
| `backgroundType` | String? | theme, gradient, image, pattern |
| `backgroundGradient` | String? | CSS gradient |
| `backgroundImageUrl` | String? | URL da imagem de fundo |
| `backgroundOverlay` | Float? | Opacidade do overlay (0-1) |
| `backgroundPattern` | String? | Nome do pattern |
| `linkStyle` | String? | rounded, pill, sharp, underline |
| `linkAnimation` | String? | none, fade, slide, scale |
| `location` | String? | Cidade/regiao |
| `pronouns` | String? | Pronomes |
| `workingHours` | String? | Horario de trabalho |
| `tagline` | String? | Headline curta |
| `sectionsOrder` | Text? | JSON com ordem das secoes |
| `orgId` | String? | FK → Organization |

**Relacoes:** user, organization?, socialLinks[], profileViews[], contactMessages[], testimonials[], galleryImages[], availableSlots[], bookings[], services[], faqItems[], viewEvents[], customFormFields[], customDomain?

---

### SocialLink (`social_links`)

Links de redes sociais e botoes no cartao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `platform` | String | Nome da plataforma (linkedin, github, whatsapp...) |
| `label` | String | Texto do botao |
| `url` | String | URL completa |
| `order` | Int | Ordem de exibicao |
| `startsAt` | DateTime? | Inicio da visibilidade (agendamento) |
| `endsAt` | DateTime? | Fim da visibilidade |
| `linkType` | String? | link, button, cta |
| `metadata` | Text? | JSON com metadados |

---

### ProfileView (`profile_views`)

Agregacao diaria de views por perfil.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `date` | Date | Data (sem hora) |
| `count` | Int | Quantidade de views no dia |

**Unique:** `[profileId, date]`

---

### LinkClick (`link_clicks`)

Agregacao diaria de cliques por link.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `socialLinkId` | String | FK → SocialLink |
| `date` | Date | Data |
| `count` | Int | Cliques no dia |

**Unique:** `[socialLinkId, date]`

---

### ViewEvent (`view_events`)

Eventos detalhados de visualizacao (analytics avancado).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `timestamp` | DateTime | Momento do evento |
| `country` | String? | Pais |
| `city` | String? | Cidade |
| `device` | String? | mobile, desktop, tablet |
| `browser` | String? | Nome do navegador |
| `referrer` | String? | HTTP referrer |
| `utmSource` | String? | UTM source |
| `utmMedium` | String? | UTM medium |
| `utmCampaign` | String? | UTM campaign |

---

### ContactMessage (`contact_messages`)

Mensagens recebidas pelo formulario de contato do cartao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `senderName` | String | Nome do remetente |
| `senderEmail` | String? | Email do remetente |
| `message` | Text | Conteudo da mensagem |
| `isRead` | Boolean | Lida/nao lida |

---

### Testimonial (`testimonials`)

Depoimentos de clientes (requerem aprovacao).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `authorName` | String | Nome do autor |
| `authorRole` | String? | Cargo/empresa do autor |
| `text` | Text | Texto do depoimento |
| `isApproved` | Boolean | Aprovado pelo dono do perfil |

---

### GalleryImage (`gallery_images`)

Imagens do portfolio.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `imageUrl` | String? | URL da imagem (R2) |
| `imageData` | MediumText? | Base64 |
| `caption` | String? | Legenda (max 200 chars) |
| `order` | Int | Ordem de exibicao |

---

### Service (`services`)

Servicos oferecidos pelo dono do perfil.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `title` | String | Nome do servico |
| `description` | Text? | Descricao |
| `price` | String? | Preco (texto livre) |
| `order` | Int | Ordem |

---

### FaqItem (`faq_items`)

Perguntas frequentes do perfil.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `question` | String | Pergunta |
| `answer` | Text | Resposta |
| `order` | Int | Ordem |

---

### AvailableSlot (`available_slots`)

Horarios disponiveis para agendamento (semanal).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `dayOfWeek` | Int | 0-6 (Domingo-Sabado) |
| `startTime` | String | HH:MM |
| `endTime` | String | HH:MM |
| `duration` | Int | Duracao em minutos (default: 30) |

**Unique:** `[profileId, dayOfWeek]`

---

### Booking (`bookings`)

Agendamentos feitos por visitantes.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `name` | String | Nome do visitante |
| `email` | String | Email |
| `phone` | String? | Telefone |
| `date` | Date | Data do agendamento |
| `time` | String | Horario (HH:MM) |
| `status` | String | pending, confirmed, cancelled |
| `notes` | Text? | Observacoes |

---

### Payment (`payments`)

Transacoes de pagamento (Mercado Pago).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `preferenceId` | String? | ID da preferencia MP |
| `mpPaymentId` | String? (unique) | ID do pagamento MP |
| `amount` | Decimal(10,2) | Valor |
| `currency` | String | BRL |
| `status` | String | pending, approved, rejected, cancelled |
| `plan` | String? | Plano comprado |
| `payerEmail` | String? | Email do pagador |
| `mpResponseJson` | Text? | JSON completo da resposta MP |
| `paidAt` | DateTime? | Data do pagamento |
| `expiresAt` | DateTime? | Expiracao do plano |

---

### RefreshToken (`refresh_tokens`)

Tokens de refresh para sessoes JWT.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `tokenHash` | String (unique) | SHA256 do token |
| `expiresAt` | DateTime | Expiracao (7 dias) |
| `revokedAt` | DateTime? | Data de revogacao |

---

### Organization (`organizations`)

Organizacoes B2B.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `name` | String | Nome da org |
| `slug` | String (unique) | URL slug |
| `logoUrl` | String? | Logo |
| `primaryColor` | String | Cor primaria (default: #00E4F2) |
| `secondaryColor` | String | Cor secundaria (default: #D12BF2) |
| `fontFamily` | String | Fonte (default: Inter) |
| `domain` | String? | Dominio customizado |
| `maxMembers` | Int | Maximo de membros (default: 10) |
| `extraSeats` | Int | Assentos adicionais |
| `brandingActive` | Boolean | Branding ativo |
| `cardTheme` | String? | Tema padrao |
| `linkStyle` | String? | Estilo de links padrao |
| `linkAnimation` | String? | Animacao de links padrao |
| `backgroundType` | String? | Background padrao |
| `backgroundGradient` | String? | Gradiente padrao |

---

### OrganizationMember (`organization_members`)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `orgId` | String | FK → Organization |
| `userId` | String | FK → User |
| `role` | String | OWNER, ADMIN, MEMBER |
| `joinedAt` | DateTime | Data de entrada |

**Unique:** `[orgId, userId]`

---

### OrganizationInvite (`organization_invites`)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `orgId` | String | FK → Organization |
| `email` | String | Email do convidado |
| `role` | String | Role a atribuir |
| `token` | String (unique) | Token de convite (64 chars hex) |
| `expiresAt` | DateTime | Expiracao (7 dias) |
| `usedAt` | DateTime? | Data de aceite |

---

### Achievement (`achievements`)

Gamificacao: conquistas desbloqueadas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `type` | String | Tipo (first_profile, 100_views, etc.) |
| `unlockedAt` | DateTime | Data de desbloqueio |

**Unique:** `[userId, type]`

---

### PushSubscription (`push_subscriptions`)

Assinaturas Web Push.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `endpoint` | String (unique) | URL do Web Push |
| `p256dh` | String | Chave publica |
| `auth` | String | Auth secret |

---

### Webhook (`webhooks`)

Webhooks do usuario para integracoes externas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `url` | String | URL do webhook |
| `events` | Text | JSON array de eventos |
| `secret` | String | HMAC secret |
| `isActive` | Boolean | Ativo/inativo |

**Eventos:** `new_message`, `new_booking`, `new_testimonial`, `new_view`

---

### CustomFormField (`custom_form_fields`)

Campos customizados no formulario de contato.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String | FK → Profile |
| `label` | String | Label do campo |
| `type` | String | text, email, phone, select, textarea, date |
| `options` | Text? | JSON de opcoes (para select) |
| `required` | Boolean | Obrigatorio |
| `order` | Int | Ordem |

---

### CustomDomain (`custom_domains`)

Dominio customizado por perfil (Enterprise).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `profileId` | String (unique) | FK → Profile |
| `domain` | String (unique) | Dominio (ex: joao.com) |
| `verified` | Boolean | Verificado via DNS |
| `verifyToken` | String | Token de verificacao DNS |

---

### Notification (`notifications`)

Notificacoes in-app.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `type` | String | Tipo da notificacao |
| `title` | String | Titulo |
| `message` | Text | Mensagem |
| `metadata` | Text? | JSON com IDs de referencia |
| `isRead` | Boolean | Lida |

## Historico de Migracoes (33)

| Data | Nome | Descricao |
|------|------|-----------|
| 20/02 | `init` | Schema inicial |
| 20/02 | `mercadopago_payment` | Model Payment |
| 21/02 | `photo_data_blob` | Foto em base64 |
| 21/02 | `annual_subscription_features` | Features por plano |
| 22/02 | `cover_photo_and_analytics` | Capa + ViewEvent |
| 22/02 | `contacts_and_availability` | ContactMessage + AvailableSlot |
| 22/02 | `testimonials` | Model Testimonial |
| 22/02 | `add_link_scheduling` | Links com agendamento |
| 22/02 | `add_photo_positioning` | Posicao Y de foto/capa |
| 22/02 | `add_gallery` | Model GalleryImage |
| 22/02 | `add_video_and_leads` | Video + lead capture |
| 22/02 | `add_bookings` | Model Booking |
| 22/02 | `add_multiple_cards` | Multiplos perfis/labels |
| 22/02 | `add_resume_data` | Resume em base64 |
| 22/02 | `add_booking_enabled` | Flag bookingEnabled |
| 23/02 | `add_gallery_image_url` | URL de imagem na galeria |
| 23/02 | `add_user_plan` | Campo plan no User |
| 23/02 | `add_visual_customization` | Font, background, linkStyle |
| 23/02 | `add_link_type_metadata` | linkType + metadata no SocialLink |
| 23/02 | `add_services_faq_bio` | Service, FaqItem, bio expandida |
| 23/02 | `add_organizations` | Org, Member, Invite |
| 23/02 | `add_view_events` | ViewEvent detalhado |
| 23/02 | `add_achievements` | Gamificacao |
| 23/02 | `add_push_webhooks_forms` | Push, Webhook, CustomFormField |
| 24/02 | `add_org_visual_fields` | Branding visual da org |
| 24/02 | `add_plan_to_payment` | Campo plan no Payment |
| 25/02 | `add_user_role` | Campo role no User |
| 25/02 | `fix_gallery_image_data_nullable` | imageData nullable |
| 25/02 | `fix_max_members_default` | maxMembers default 10 |
| 25/02 | `add_notifications` | Model Notification |
| 25/02 | `add_profile_org_index` | Index orgId no Profile |
| 26/02 | `add_extra_seats` | Campo extraSeats na Org |
| 01/03 | `add_native_auth` | passwordHash, resetToken, googleId opcional |
