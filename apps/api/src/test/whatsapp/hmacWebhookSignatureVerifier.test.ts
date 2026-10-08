import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { HmacWebhookSignatureVerifier } from '../../modules/whatsapp/infrastructure/external/HmacWebhookSignatureVerifier';

const SECRET = 'app-secret';
const body = Buffer.from('{"object":"whatsapp_business_account"}');

function sign(body: Buffer, secret: string = SECRET): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

describe('HmacWebhookSignatureVerifier', () => {
  const verifier = new HmacWebhookSignatureVerifier({
    appSecret: SECRET,
    verifyToken: null,
    accessToken: null,
    phoneNumberId: null,
    graphVersion: 'v26.0',
  });

  it('accepts the signature computed with the app secret over the raw body', () => {
    expect(verifier.isValid(body, sign(body))).toBe(true);
  });

  it.each([
    ['another secret', sign(body, 'other')],
    ['another body', sign(Buffer.from('{}'))],
    ['no prefix', sign(body).replace('sha256=', '')],
    ['largo distinto', 'sha256=abcd'],
    ['not hex', 'sha256=zz'],
    ['ausente', undefined],
  ])('rejects a signature with %s', (_case, signature) => {
    expect(verifier.isValid(body, signature)).toBe(false);
  });

  it('rejects if the raw body did not arrive', () => {
    expect(verifier.isValid(undefined, sign(body))).toBe(false);
  });

  it('rejects everything if no app secret is configured', () => {
    const withoutSecret = new HmacWebhookSignatureVerifier({
      appSecret: null,
      verifyToken: null,
      accessToken: null,
      phoneNumberId: null,
      graphVersion: 'v26.0',
    });
    expect(withoutSecret.isValid(body, sign(body))).toBe(false);
  });
});
