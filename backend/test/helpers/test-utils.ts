/**
 * CraftCard QA Test Utilities
 * ===========================
 * Helpers centralizados para toda a suíte de testes.
 * NENHUM dado de produção é tocado — tudo usa mocks ou sandbox.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const TEST_JWT_SECRET = 'test-jwt-secret-min-32-chars-long!!';
export const TEST_REFRESH_SECRET = 'test-refresh-secret-min-32-chars!!';

export const TEST_USERS = {
  freeUser: {
    id: randomUUID(),
    email: 'free-user@test.local',
    name: 'Free User',
    plan: 'FREE',
    role: 'USER',
    passwordHash: null,
    avatarUrl: null,
    googleId: null,
  },
  proUser: {
    id: randomUUID(),
    email: 'pro-user@test.local',
    name: 'Pro User',
    plan: 'PRO',
    role: 'USER',
    passwordHash: null,
    avatarUrl: null,
    googleId: null,
  },
  businessOwner: {
    id: randomUUID(),
    email: 'biz-owner@test.local',
    name: 'Business Owner',
    plan: 'BUSINESS',
    role: 'USER',
    passwordHash: null,
    avatarUrl: null,
    googleId: null,
  },
  enterpriseUser: {
    id: randomUUID(),
    email: 'ent-user@test.local',
    name: 'Enterprise User',
    plan: 'ENTERPRISE',
    role: 'USER',
    passwordHash: null,
    avatarUrl: null,
    googleId: null,
  },
  superAdmin: {
    id: randomUUID(),
    email: 'admin@test.local',
    name: 'Super Admin',
    plan: 'FREE',
    role: 'SUPER_ADMIN',
    passwordHash: null,
    avatarUrl: null,
    googleId: null,
  },
  whitelistUser: {
    id: randomUUID(),
    email: 'ricardocoradini97@gmail.com',
    name: 'Whitelist User',
    plan: 'FREE',
    role: 'USER',
    passwordHash: null,
    avatarUrl: null,
    googleId: null,
  },
} as const;

export const TEST_ORGS = {
  orgA: {
    id: randomUUID(),
    name: 'Org Alpha',
    slug: 'org-alpha',
    maxMembers: 10,
    extraSeats: 0,
  },
  orgB: {
    id: randomUUID(),
    name: 'Org Beta',
    slug: 'org-beta',
    maxMembers: 10,
    extraSeats: 0,
  },
} as const;

// ──────────────────────────────────────────────
// JWT Helpers
// ──────────────────────────────────────────────

const jwtService = new JwtService({});

/** Generate a valid test JWT */
export function generateTestJwt(
  payload: { sub: string; email: string; role?: string },
  options?: { expiresIn?: string; secret?: string },
): string {
  return jwtService.sign(
    { sub: payload.sub, email: payload.email, role: payload.role || 'USER' },
    {
      secret: options?.secret || TEST_JWT_SECRET,
      expiresIn: options?.expiresIn || '15m',
    },
  );
}

/** Generate an expired JWT for security tests */
export function generateExpiredJwt(payload: { sub: string; email: string; role?: string }): string {
  return generateTestJwt(payload, { expiresIn: '0s' });
}

/** Generate a JWT signed with the wrong secret */
export function generateBadSecretJwt(payload: { sub: string; email: string }): string {
  return generateTestJwt(payload, { secret: 'completely-wrong-secret-key-1234' });
}

// ──────────────────────────────────────────────
// Refresh Token Helpers
// ──────────────────────────────────────────────

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(64).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

// ──────────────────────────────────────────────
// Prisma Mock Factory
// ──────────────────────────────────────────────

export function createPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationInvite: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contactMessage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    socialLink: {
      findMany: jest.fn(),
    },
    profileView: {
      findMany: jest.fn(),
    },
    viewEvent: {
      groupBy: jest.fn(),
    },
    linkClick: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    booking: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(undefined)),
  };
}

// ──────────────────────────────────────────────
// Config Mock Factory
// ──────────────────────────────────────────────

export function createConfigMock(overrides: Record<string, string> = {}) {
  const defaults: Record<string, string> = {
    NODE_ENV: 'test',
    JWT_SECRET: TEST_JWT_SECRET,
    JWT_REFRESH_SECRET: TEST_REFRESH_SECRET,
    JWT_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    MP_ACCESS_TOKEN: 'APP_USR-test-sandbox-token',
    MP_WEBHOOK_SECRET: 'test-webhook-secret',
    MP_PUBLIC_KEY: 'APP_USR-test-public-key',
    BACKEND_URL: 'http://localhost:3000',
    FRONTEND_URL: 'http://localhost:5173',
    CORS_ORIGIN: 'http://localhost:5173',
    GOOGLE_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
  };

  const values = { ...defaults, ...overrides };

  return {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      if (!values[key]) throw new Error(`Missing config: ${key}`);
      return values[key];
    }),
  };
}

// ──────────────────────────────────────────────
// Mail Mock Factory
// ──────────────────────────────────────────────

export function createMailMock() {
  return {
    sendWelcome: jest.fn().mockResolvedValue(true),
    sendPaymentConfirmation: jest.fn().mockResolvedValue(true),
    sendPasswordReset: jest.fn().mockResolvedValue(true),
    sendOrgInvite: jest.fn().mockResolvedValue(true),
  };
}

// ──────────────────────────────────────────────
// Payment Gateway Mock Factory
// ──────────────────────────────────────────────

export function createGatewayMock() {
  return {
    createPreference: jest.fn().mockResolvedValue({ checkoutUrl: 'https://sandbox.mercadopago.com/test', preferenceId: 'pref-mock-1' }),
    fetchPayment: jest.fn(),
    searchPaymentsByReference: jest.fn().mockResolvedValue({ payments: [] }),
    verifyWebhookSignature: jest.fn().mockReturnValue(true),
  };
}

/** Configure gateway mock to return a specific payment status */
export function mockGatewayFetchPayment(
  gatewayMock: ReturnType<typeof createGatewayMock>,
  mpPaymentId: string,
  externalRef: string,
  status = 'approved',
  amount = 30,
) {
  gatewayMock.fetchPayment.mockResolvedValue({
    status,
    externalReference: externalRef,
    amount,
    payerEmail: 'test@test.local',
    rawResponse: JSON.stringify({ id: mpPaymentId, status, external_reference: externalRef, transaction_amount: amount }),
  });
}

/** Configure gateway mock to throw (simulates network/API failure) */
export function mockGatewayFetchError(
  gatewayMock: ReturnType<typeof createGatewayMock>,
  errorMessage = 'MP API error 500',
) {
  gatewayMock.fetchPayment.mockRejectedValue(new Error(errorMessage));
}

// ──────────────────────────────────────────────
// Mercado Pago Webhook Payload Builders
// ──────────────────────────────────────────────

export function buildMpWebhookPayload(mpPaymentId: string, type = 'payment') {
  return {
    type,
    action: 'payment.updated',
    data: { id: mpPaymentId },
  };
}

export function buildMpApiResponse(
  mpPaymentId: string,
  externalRef: string,
  status = 'approved',
  amount = 30,
) {
  return {
    id: mpPaymentId,
    status,
    external_reference: externalRef,
    transaction_amount: amount,
    currency_id: 'BRL',
    payer: { email: 'test@test.local' },
    date_approved: status === 'approved' ? new Date().toISOString() : null,
  };
}

/** Simulates a fetch() response from Mercado Pago API */
export function mockFetchMpApi(responseBody: unknown, ok = true, status = 200) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(responseBody),
  } as unknown as Response);
}

/** Simulates a fetch() that throws (network failure) */
export function mockFetchNetworkError(errorMessage = 'Network error') {
  return jest.spyOn(global, 'fetch').mockRejectedValue(new Error(errorMessage));
}
