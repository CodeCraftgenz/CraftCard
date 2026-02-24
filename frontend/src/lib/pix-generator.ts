/**
 * Pix QR Code payload generator — EMV QR Code standard (BR Code)
 * Generates the payload string that can be rendered as a QR code for Pix payments.
 *
 * Reference: BACEN specification for BR Code (based on EMV QRCPS-MPM).
 */

/** Build a TLV (Tag-Length-Value) field */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/** CRC16-CCITT calculation */
function crc16(payload: string): string {
  const bytes = new TextEncoder().encode(payload);
  let crc = 0xffff;

  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  /** Pix key (CPF, CNPJ, email, phone, or random key) */
  pixKey: string;
  /** Merchant name (receiver name) */
  merchantName: string;
  /** Merchant city */
  merchantCity: string;
  /** Optional: transaction amount in BRL (e.g. "10.00") */
  amount?: string;
  /** Optional: description/identifier */
  description?: string;
}

/**
 * Generate a Pix payload string in BR Code (EMV) format.
 * This string can be rendered as a QR code for Pix payments.
 */
export function generatePixPayload(params: PixPayloadParams): string {
  const { pixKey, merchantName, merchantCity, amount, description } = params;

  // Sanitize inputs
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25);
  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 15);

  // Payload Format Indicator (ID 00) — always "01"
  let payload = tlv('00', '01');

  // Merchant Account Information (ID 26) — Pix specific
  const gui = tlv('00', 'br.gov.bcb.pix'); // GUI for Pix
  const key = tlv('01', pixKey);
  const descField = description ? tlv('02', description.slice(0, 25)) : '';
  payload += tlv('26', gui + key + descField);

  // Merchant Category Code (ID 52) — "0000" for general
  payload += tlv('52', '0000');

  // Transaction Currency (ID 53) — "986" = BRL
  payload += tlv('53', '986');

  // Transaction Amount (ID 54) — optional
  if (amount && parseFloat(amount) > 0) {
    payload += tlv('54', parseFloat(amount).toFixed(2));
  }

  // Country Code (ID 58) — "BR"
  payload += tlv('58', 'BR');

  // Merchant Name (ID 59)
  payload += tlv('59', cleanName);

  // Merchant City (ID 60)
  payload += tlv('60', cleanCity);

  // Additional Data Field Template (ID 62) — txid
  const txId = tlv('05', '***'); // Dynamic txid placeholder
  payload += tlv('62', txId);

  // CRC16 (ID 63) — must be last, 4 hex digits
  payload += '6304'; // placeholder for CRC
  const crc = crc16(payload);
  payload = payload.slice(0, -4) + crc;

  return payload;
}
