import { describe, expect, it, vi } from 'vitest';
import type { WebhookEventPublisherPort } from '../../modules/whatsapp/application/ports/out/WebhookEventPublisherPort';
import type { WebhookEventRepositoryPort } from '../../modules/whatsapp/application/ports/out/WebhookEventRepositoryPort';
import { ReceiveWebhookUseCase } from '../../modules/whatsapp/application/use-cases/ReceiveWebhookUseCase';
import { VerifyWebhookSubscriptionUseCase } from '../../modules/whatsapp/application/use-cases/VerifyWebhookSubscriptionUseCase';
import { InvalidWebhookSignatureException } from '../../modules/whatsapp/domain/exceptions/InvalidWebhookSignatureException';
import { WebhookSubscriptionRejectedException } from '../../modules/whatsapp/domain/exceptions/WebhookSubscriptionRejectedException';
import { extractChanges } from '../../modules/whatsapp/domain/WebhookChange';

describe('VerifyWebhookSubscriptionUseCase', () => {
  const useCase = new VerifyWebhookSubscriptionUseCase({
    verifyToken: 'secret',
  });

  it('returns the challenge when the token matches', () => {
    expect(
      useCase.execute({
        mode: 'subscribe',
        verifyToken: 'secret',
        challenge: '1158201444',
      })
    ).toBe('1158201444');
  });

  it.each([
    { mode: 'subscribe', verifyToken: 'other', challenge: 'c' },
    { mode: 'unsubscribe', verifyToken: 'secret', challenge: 'c' },
    { mode: 'subscribe', verifyToken: 'secret', challenge: undefined },
    { mode: undefined, verifyToken: undefined, challenge: undefined },
  ])('rejects %o', (application) => {
    expect(() => useCase.execute(application)).toThrow(
      WebhookSubscriptionRejectedException
    );
  });

  it('rejects everything if no verify token is configured', () => {
    const unconfigured = new VerifyWebhookSubscriptionUseCase({
      verifyToken: null,
    });
    expect(() =>
      unconfigured.execute({
        mode: 'subscribe',
        verifyToken: '',
        challenge: 'c',
      })
    ).toThrow(WebhookSubscriptionRejectedException);
  });
});

describe('ReceiveWebhookUseCase', () => {
  const body = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA',
        changes: [
          { field: 'messages', value: { messages: [{ id: 'wamid.1' }] } },
          { field: 'message_template_status_update', value: { event: 'X' } },
        ],
      },
      { id: 'WABA', changes: [{ field: 'messages', value: { statuses: [] } }] },
    ],
  };

  function build(validSignature: boolean) {
    const events: WebhookEventRepositoryPort = {
      save: vi.fn(async (changes) => changes.map((_, i) => `id-${i}`)),
      registerFailure: vi.fn(),
      pending: vi.fn(),
    };
    const publisher: WebhookEventPublisherPort = {
      publishReceived: vi.fn(),
    };
    const useCase = new ReceiveWebhookUseCase(
      { isValid: () => validSignature },
      events,
      publisher
    );
    return { useCase, events, publisher };
  }

  it('saves one event per change of each entry and publishes them', async () => {
    const { useCase, events, publisher } = build(true);

    const saved = await useCase.execute({
      rawBody: Buffer.from('x'),
      signature: 'sha256=x',
      body,
    });

    expect(saved).toBe(3);
    expect(events.save).toHaveBeenCalledWith([
      { field: 'messages', payload: { messages: [{ id: 'wamid.1' }] } },
      { field: 'message_template_status_update', payload: { event: 'X' } },
      { field: 'messages', payload: { statuses: [] } },
    ]);
    expect(publisher.publishReceived).toHaveBeenCalledWith([
      'id-0',
      'id-1',
      'id-2',
    ]);
  });

  it('rejects an invalid signature without saving anything', async () => {
    const { useCase, events } = build(false);

    await expect(
      useCase.execute({ rawBody: Buffer.from('x'), signature: undefined, body })
    ).rejects.toBeInstanceOf(InvalidWebhookSignatureException);
    expect(events.save).not.toHaveBeenCalled();
  });

  it('accepts without saving a signed body that is not a WhatsApp webhook', async () => {
    const { useCase, events, publisher } = build(true);

    const saved = await useCase.execute({
      rawBody: Buffer.from('x'),
      signature: 'sha256=x',
      body: { hello: 'mundo' },
    });

    expect(saved).toBe(0);
    expect(events.save).not.toHaveBeenCalled();
    expect(publisher.publishReceived).not.toHaveBeenCalled();
  });
});

describe('extractChanges', () => {
  it('saves null when the change carries no value', () => {
    expect(
      extractChanges({ entry: [{ changes: [{ field: 'messages' }] }] })
    ).toEqual([{ field: 'messages', payload: null }]);
  });
});
