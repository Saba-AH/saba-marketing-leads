import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { HmacWebhookSignatureVerifier } from '../../modules/whatsapp/infrastructure/external/HmacWebhookSignatureVerifier';

const SECRETO = 'app-secret';
const cuerpo = Buffer.from('{"object":"whatsapp_business_account"}');

function firmar(body: Buffer, secreto: string = SECRETO): string {
  return `sha256=${createHmac('sha256', secreto).update(body).digest('hex')}`;
}

describe('HmacWebhookSignatureVerifier', () => {
  const verifier = new HmacWebhookSignatureVerifier({
    appSecret: SECRETO,
    verifyToken: null,
  });

  it('acepta la firma calculada con el app secret sobre el cuerpo crudo', () => {
    expect(verifier.esValida(cuerpo, firmar(cuerpo))).toBe(true);
  });

  it.each([
    ['otro secreto', firmar(cuerpo, 'otro')],
    ['otro cuerpo', firmar(Buffer.from('{}'))],
    ['sin prefijo', firmar(cuerpo).replace('sha256=', '')],
    ['largo distinto', 'sha256=abcd'],
    ['no hex', 'sha256=zz'],
    ['ausente', undefined],
  ])('rechaza una firma con %s', (_caso, firma) => {
    expect(verifier.esValida(cuerpo, firma)).toBe(false);
  });

  it('rechaza si no llegó el cuerpo crudo', () => {
    expect(verifier.esValida(undefined, firmar(cuerpo))).toBe(false);
  });

  it('rechaza todo si no hay app secret configurado', () => {
    const sinSecreto = new HmacWebhookSignatureVerifier({
      appSecret: null,
      verifyToken: null,
    });
    expect(sinSecreto.esValida(cuerpo, firmar(cuerpo))).toBe(false);
  });
});
