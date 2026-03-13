/**
 * MercadoPagoProvider — Unit Tests
 * ==================================
 * Testa a implementacao concreta do PaymentGateway.
 */
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoProvider } from './mercadopago.provider';
import { createConfigMock, mockFetchMpApi, buildMpApiResponse } from '../../../test/helpers/test-utils';

// Mock do MercadoPago SDK para nao precisar de token real
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue({
      id: 'pref-123',
      init_point: 'https://mercadopago.com/checkout',
      sandbox_init_point: 'https://sandbox.mercadopago.com/checkout',
    }),
  })),
}));

describe('MercadoPagoProvider', () => {
  let provider: MercadoPagoProvider;

  beforeEach(() => {
    const configMock = createConfigMock();
    provider = new MercadoPagoProvider(configMock as unknown as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ──────────────────────────────────────────────
  // createPreference
  // ──────────────────────────────────────────────

  describe('createPreference', () => {
    it('deve retornar checkoutUrl e preferenceId', async () => {
      const result = await provider.createPreference({
        paymentId: 'pay-1',
        title: 'CraftCard PRO',
        description: 'Plano PRO anual',
        price: 29.90,
        currency: 'BRL',
        payerEmail: 'user@test.com',
        backUrls: { success: '/ok', failure: '/fail', pending: '/pending' },
        notificationUrl: '/webhook',
      });

      expect(result.preferenceId).toBe('pref-123');
      expect(result.checkoutUrl).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // fetchPayment
  // ──────────────────────────────────────────────

  describe('fetchPayment', () => {
    it('deve mapear status approved corretamente', async () => {
      const mpData = buildMpApiResponse('mp-1', 'pay-1', 'approved', 29.90);
      mockFetchMpApi(mpData);

      const result = await provider.fetchPayment('mp-1');

      expect(result.status).toBe('approved');
      expect(result.externalReference).toBe('pay-1');
      expect(result.amount).toBe(29.90);
      expect(result.payerEmail).toBe('test@test.local');
    });

    it('deve mapear status in_process como pending', async () => {
      const mpData = buildMpApiResponse('mp-2', 'pay-2', 'in_process', 29.90);
      mockFetchMpApi(mpData);

      const result = await provider.fetchPayment('mp-2');

      expect(result.status).toBe('pending');
    });

    it('deve mapear status rejected', async () => {
      const mpData = buildMpApiResponse('mp-3', 'pay-3', 'rejected', 29.90);
      mockFetchMpApi(mpData);

      const result = await provider.fetchPayment('mp-3');

      expect(result.status).toBe('rejected');
    });

    it('deve mapear status charged_back como refunded', async () => {
      const mpData = buildMpApiResponse('mp-4', 'pay-4', 'charged_back', 29.90);
      mockFetchMpApi(mpData);

      const result = await provider.fetchPayment('mp-4');

      expect(result.status).toBe('refunded');
    });

    it('deve lancar erro para API error', async () => {
      mockFetchMpApi({}, false, 500);

      await expect(provider.fetchPayment('mp-fail')).rejects.toThrow('MP API error 500');
    });
  });

  // ──────────────────────────────────────────────
  // searchPaymentsByReference
  // ──────────────────────────────────────────────

  describe('searchPaymentsByReference', () => {
    it('deve retornar lista de pagamentos', async () => {
      mockFetchMpApi({
        results: [
          buildMpApiResponse('mp-1', 'pay-1', 'approved', 29.90),
          buildMpApiResponse('mp-2', 'pay-1', 'pending', 29.90),
        ],
      });

      const result = await provider.searchPaymentsByReference('pay-1');

      expect(result.payments).toHaveLength(2);
      expect(result.payments[0].status).toBe('approved');
      expect(result.payments[1].status).toBe('pending');
    });

    it('deve retornar lista vazia se nenhum resultado', async () => {
      mockFetchMpApi({ results: [] });

      const result = await provider.searchPaymentsByReference('pay-nonexistent');

      expect(result.payments).toHaveLength(0);
    });

    it('deve lancar erro para API error', async () => {
      mockFetchMpApi({}, false, 401);

      await expect(
        provider.searchPaymentsByReference('pay-1'),
      ).rejects.toThrow('MP search API error 401');
    });
  });

  // ──────────────────────────────────────────────
  // verifyWebhookSignature
  // ──────────────────────────────────────────────

  describe('verifyWebhookSignature', () => {
    const secret = 'test-webhook-secret';

    it('deve verificar assinatura valida', () => {
      const dataId = 'payment-123';
      const requestId = 'req-abc';
      const ts = '1234567890';
      const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
      const v1 = crypto.createHmac('sha256', secret).update(template).digest('hex');

      const result = provider.verifyWebhookSignature(
        { data: { id: dataId } },
        { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId },
        secret,
      );

      expect(result).toBe(true);
    });

    it('deve rejeitar assinatura invalida', () => {
      const result = provider.verifyWebhookSignature(
        { data: { id: 'payment-123' } },
        { 'x-signature': 'ts=123,v1=invalid-hash', 'x-request-id': 'req-abc' },
        secret,
      );

      expect(result).toBe(false);
    });

    it('deve rejeitar se headers ausentes', () => {
      const result = provider.verifyWebhookSignature(
        { data: { id: 'payment-123' } },
        {},
        secret,
      );

      expect(result).toBe(false);
    });
  });
});
