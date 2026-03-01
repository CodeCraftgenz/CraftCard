# Organizacoes (B2B)

O sistema de organizacoes permite que empresas gerenciem cartoes digitais de seus colaboradores com branding centralizado.

## Conceito

Uma **Organization** agrupa usuarios (membros) sob uma marca corporativa. O OWNER (criador) define branding, convida membros, e tem acesso a analytics e leads consolidados de todos os perfis vinculados.

---

## Roles

| Role | Nivel | Permissoes |
|------|-------|------------|
| **MEMBER** | 1 | Visualizar org, acessar perfis vinculados |
| **ADMIN** | 2 | Gerenciar membros, convites, branding, analytics, leads |
| **OWNER** | 3 | Tudo de ADMIN + deletar org, transferir ownership |

- O criador da org e automaticamente OWNER
- `SUPER_ADMIN` da plataforma bypassa todas as verificacoes de role

---

## Fluxo de Criacao

```
1. POST /organizations { name: "Acme Corp", slug: "acme-corp" }
   → Cria org + criador como OWNER (transacao atomica)

2. POST /organizations/:orgId/invite { email: "user@acme.com", role: "ADMIN" }
   → Cria convite com token unico (expira em 7 dias)
   → Envia email com link de convite

3. Usuario recebe email e clica no link
   → Se ja tem conta: POST /organizations/join/:token
   → Se nao tem conta: POST /auth/register { inviteToken: "token" }
     → Registro + aceite automatico do convite
```

---

## Convites

### Criar Convite

```
POST /organizations/:orgId/invite
{
  "email": "user@example.com",
  "role": "MEMBER"  // MEMBER ou ADMIN
}
```

**Validacoes:**
- Verifica limite de membros: `maxMembers + extraSeats`
- Impede convites duplicados para mesmo email (pendentes)
- Token unico gerado, expira em 7 dias
- Email enviado via MailService (fire-and-forget)

### Aceitar Convite

```
POST /organizations/join/:token
```

**Fluxo atomico (transacao):**
1. Marca convite como usado (`usedAt = now()`)
2. Cria `OrganizationMember` com o role do convite
3. Vincula todos os perfis sem org do usuario a esta org
4. Se usuario nao tem perfis: cria perfil padrao vinculado a org

### Preview de Convite

```
GET /organizations/invite/:token
→ { orgName, orgLogo, inviterName, role, expiresAt }
```

Endpoint publico (sem auth) — usado na pagina de aceite.

---

## Branding Centralizado

A organizacao define um conjunto de estilos que podem ser aplicados aos perfis dos membros.

### Campos de Branding

| Campo | Tipo | Default | Descricao |
|-------|------|---------|-----------|
| `logoUrl` | string? | null | Logo da organizacao |
| `primaryColor` | string | `#00E4F2` | Cor primaria |
| `secondaryColor` | string | `#D12BF2` | Cor secundaria |
| `fontFamily` | string | `Inter` | Fonte principal |
| `brandingActive` | boolean | false | Branding ativo |
| `cardTheme` | enum | null | Tema do cartao |
| `linkStyle` | enum | null | Estilo dos links |
| `linkAnimation` | enum | null | Animacao dos links |
| `backgroundType` | enum | null | Tipo de background |
| `backgroundGradient` | string? | null | Gradiente customizado |

### Aplicar Branding em Massa

```
POST /organizations/:orgId/bulk-apply
→ Atualiza TODOS os perfis vinculados a org com as configuracoes de branding
```

Campos aplicados: `cardTheme`, `linkStyle`, `linkAnimation`, `backgroundType`, `backgroundGradient`, `primaryColor`, `secondaryColor`, `fontFamily`.

---

## Analytics Consolidado

```
GET /organizations/:orgId/analytics
```

Agrega metricas de **todos os perfis vinculados** a org (ultimos 30 dias):

- Views diarias por perfil
- Total de mensagens recebidas
- Total de agendamentos
- Cliques em links (ranking)
- Distribuicao por dispositivo
- Top referrers
- Top paises

---

## Leads Consolidado

```
GET /organizations/:orgId/leads?page=1&limit=20&search=joao&isRead=false
```

Retorna todas as mensagens de contato recebidas em perfis da org:

- Paginacao: `page` + `limit` (max 50)
- Busca: por nome ou email do remetente
- Filtro: `isRead` (boolean)
- Ordenacao: mais recentes primeiro

### Acoes sobre Leads

| Endpoint | Descricao |
|----------|-----------|
| `PUT /:orgId/leads/:leadId/read` | Marcar como lido |
| `PUT /:orgId/leads/mark-all-read` | Marcar todos como lidos |
| `GET /:orgId/leads/export` | Exportar CSV |

---

## Heranca de Plano

Membros herdam automaticamente o plano do OWNER se for BUSINESS ou superior:

```
OWNER (BUSINESS) → Membros recebem acesso BUSINESS
OWNER (ENTERPRISE) → Membros recebem acesso ENTERPRISE
```

Isso significa que membros FREE de uma org BUSINESS podem usar features como analytics, galeria, agendamentos, etc.

---

## Modelo de Dados

```prisma
model Organization {
  id               String   @id @default(uuid())
  name             String
  slug             String   @unique
  logoUrl          String?
  primaryColor     String   @default("#00E4F2")
  secondaryColor   String   @default("#D12BF2")
  fontFamily       String   @default("Inter")
  domain           String?
  maxMembers       Int      @default(10)
  extraSeats       Int      @default(0)
  brandingActive   Boolean  @default(false)
  cardTheme        String?
  linkStyle        String?
  linkAnimation    String?
  backgroundType   String?
  backgroundGradient String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  members  OrganizationMember[]
  invites  OrganizationInvite[]
  profiles Profile[]
}

model OrganizationMember {
  id       String   @id @default(uuid())
  orgId    String
  userId   String
  role     String   // OWNER | ADMIN | MEMBER
  joinedAt DateTime @default(now())

  org  Organization @relation(...)
  user User         @relation(...)
  @@unique([orgId, userId])
}

model OrganizationInvite {
  id        String    @id @default(uuid())
  orgId     String
  email     String
  role      String    @default("MEMBER")
  token     String    @unique
  expiresAt DateTime  // +7 dias
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  org Organization @relation(...)
}
```

---

## Endpoints

Ver [04-api-endpoints.md](04-api-endpoints.md#organizations-organizations) para a lista completa de 20 endpoints.

## Planos Necessarios

- Criar org: qualquer plano
- Funcionalidades de org (branding, analytics, leads): requer BUSINESS+
- Frontend verifica `hasFeature('orgDashboard')` e `hasFeature('branding')`
