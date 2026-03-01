# Planos e Pagamentos

## Planos

O CraftCard oferece 4 planos de assinatura anual:

| Plano | Preco | Descricao |
|-------|-------|-----------|
| **FREE** | R$ 0 | Cartao basico com funcionalidades limitadas |
| **PRO** | R$ 30/ano | Cartao profissional completo |
| **BUSINESS** | R$ 189,90/ano | Equipes e organizacoes |
| **ENTERPRISE** | R$ 299,90/ano | Dominio customizado + tudo |

## Limites por Plano

| Feature | FREE | PRO | BUSINESS | ENTERPRISE |
|---------|------|-----|----------|------------|
| Max Cartoes | 1 | 3 | 3 | 3 |
| Max Links | 5 | 20 | 50 | 50 |
| Temas | 3 | todos | todos | todos |
| Analytics | - | sim | sim | sim |
| Galeria | - | sim | sim | sim |
| Agendamentos | - | sim | sim | sim |
| Depoimentos | - | sim | sim | sim |
| Contatos/Leads | - | sim | sim | sim |
| Servicos | - | sim | sim | sim |
| FAQ | - | sim | sim | sim |
| Curriculo | - | sim | sim | sim |
| Video | - | sim | sim | sim |
| Marca d'agua | sim | - | - | - |
| Fontes Custom | - | sim | sim | sim |
| Background Custom | - | sim | sim | sim |
| Export Leads | - | sim | sim | sim |
| Dashboard Org | - | - | sim | sim |
| Branding Org | - | - | sim | sim |
| Webhooks | - | - | sim | sim |
| Dominio Custom | - | - | - | sim |

## Feature Gating

### Backend: PlanGuard + @RequiresFeature

```typescript
@UseGuards(PlanGuard)
@RequiresFeature('analytics')
@Get('/analytics/me')
async getAnalytics(@CurrentUser('sub') userId: string) { }
```

**Fluxo:**
1. `PlanGuard` intercepta a requisicao
2. Busca plano do usuario (incluindo heranca de org)
3. Consulta `PLAN_LIMITS[plan]` para obter limites
4. Verifica se a feature esta habilitada
5. Se nao: `403 Forbidden - Recurso nao disponivel no seu plano`

### Frontend: hasFeature + FeatureLock

```tsx
// No AuthProvider
const { hasFeature } = useAuth();
if (hasFeature('analytics')) { /* mostra analytics */ }

// Componente FeatureLock
<FeatureLock feature="gallery">
  <GalleryGrid />
</FeatureLock>
```

O endpoint `GET /me` retorna `planLimits` com todos os limites do plano ativo.

---

## Checkout com Mercado Pago

### Fluxo Completo

```
1. Usuario clica "Assinar PRO"
   └── POST /payments/checkout { plan: "PRO" }

2. Backend cria Payment (status: pending) no banco
   └── Cria preferencia no Mercado Pago

3. Backend retorna URL do checkout MP
   └── Frontend redireciona usuario

4. Usuario paga no Mercado Pago
   └── MP redireciona para /billing/success

5. MP envia webhook → POST /payments/webhook
   └── Backend:
       a. Busca detalhes do pagamento na API do MP
       b. Atualiza Payment: status=approved, paidAt=now, expiresAt=+365d
       c. Atualiza User: plan=PRO
       d. Envia email de confirmacao

6. Frontend verifica /me → hasPaid=true, plan=PRO
```

### Preferencia Mercado Pago

```typescript
{
  items: [{
    id: payment.id,
    title: "CraftCard Pro - Cartao Digital Profissional (Anual)",
    quantity: 1,
    currency_id: "BRL",
    unit_price: 30.0
  }],
  back_urls: {
    success: "${FRONTEND_URL}/billing/success",
    failure: "${FRONTEND_URL}/editor?payment=failed",
    pending: "${FRONTEND_URL}/editor?payment=pending"
  },
  notification_url: "${BACKEND_URL}/api/payments/webhook",
  external_reference: payment.id,
  payment_methods: { installments: 4 },
  auto_return: "approved"
}
```

### Webhook Processing

O webhook suporta dois formatos:

1. **IPN**: `?topic=payment&id=12345`
2. **JSON body**: `{ type: "payment", data: { id: "12345" } }`

**Seguranca:**
- Validacao de assinatura MP (nao-bloqueante, loga warning se falhar)
- Deduplicacao atomica: `WHERE id = :ref AND status != 'approved'`
- Previne webhooks concorrentes de creditar duas vezes

### Verificacao Fallback

Se o webhook nao chegar:
```
POST /payments/verify
→ Backend consulta API do MP: GET /v1/payments/search?external_reference={paymentId}
→ Se aprovado no MP: sincroniza localmente
→ Retorna: { synced: boolean, status: "approved" | "pending" | "still_pending" }
```

---

## Whitelist de Acesso Gratuito

Emails fundadores recebem ENTERPRISE permanente sem pagamento:

```typescript
const FREE_ACCESS_EMAILS = new Set([
  'ricardocoradini97@gmail.com',
  'paulommc@gmail.com',
  'mfacine@gmail.com',
  'gabriel.gondrone@gmail.com',
  'codecraftgenz@gmail.com',
]);
```

Verificado em `getUserPlanInfo()` → retorna `{ plan: 'ENTERPRISE', expiresAt: null }`.

---

## Heranca de Plano B2B

Membros de organizacao herdam o plano do OWNER se for BUSINESS+.

**Logica:**
1. Obtem plano pessoal do usuario (`user.plan`)
2. Para cada org do usuario, verifica plano do OWNER
3. Se OWNER tem BUSINESS+ → membro herda esse plano
4. O maior plano herdado prevalece

**Exemplo:**
- Maria (FREE) entra na Org do Joao (BUSINESS) → Maria ganha BUSINESS
- Maria tambem esta na Org da Ana (ENTERPRISE) → Maria ganha ENTERPRISE

---

## Modelo de Dados

```prisma
model Payment {
  id             String    @id @default(uuid())
  userId         String
  preferenceId   String?         // ID da preferencia MP
  mpPaymentId    String?  @unique // ID do pagamento MP
  amount         Decimal(10,2)
  currency       String   @default("BRL")
  status         String   @default("pending")  // pending|approved|rejected|cancelled|refunded
  plan           String?         // PRO|BUSINESS|ENTERPRISE
  payerEmail     String?
  mpResponseJson String?  @db.Text  // JSON completo da resposta MP
  paidAt         DateTime?
  expiresAt      DateTime?       // +365 dias apos aprovacao
  createdAt      DateTime @default(now())
  user           User     @relation(...)

  @@index([userId, status])
  @@index([payerEmail])
}
```

---

## Variaveis de Ambiente

| Variavel | Descricao |
|----------|-----------|
| `MP_ACCESS_TOKEN` | Token de acesso da API Mercado Pago |
| `MP_WEBHOOK_SECRET` | Secret para validar assinatura do webhook |
| `MP_PUBLIC_KEY` | Chave publica MP (exposta ao frontend) |
| `BACKEND_URL` | URL do backend (para notification_url do webhook) |
| `FRONTEND_URL` | URL do frontend (para back_urls do checkout) |
