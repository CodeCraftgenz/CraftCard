/**
 * Abstract Payment Gateway Interface
 * ===================================
 * Decouples business logic from specific payment provider (Mercado Pago, Stripe, etc.)
 * Any new provider implements this interface — zero changes needed in PaymentsService.
 */

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface CheckoutPreferenceInput {
  paymentId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  payerEmail: string;
  backUrls: { success: string; failure: string; pending: string };
  notificationUrl: string;
}

export interface CheckoutPreferenceResult {
  checkoutUrl: string;
  preferenceId: string;
}

export interface FetchedPayment {
  status: string;
  externalReference: string | null;
  amount: number;
  payerEmail: string | null;
  rawResponse: string;
}

export interface PaymentSearchResult {
  payments: FetchedPayment[];
}

export interface PaymentGateway {
  createPreference(input: CheckoutPreferenceInput): Promise<CheckoutPreferenceResult>;
  fetchPayment(providerPaymentId: string): Promise<FetchedPayment>;
  searchPaymentsByReference(externalRef: string): Promise<PaymentSearchResult>;
  verifyWebhookSignature(body: unknown, headers: Record<string, string>, secret: string): boolean;
}
