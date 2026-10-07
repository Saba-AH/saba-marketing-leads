import { describe, expect, it, vi } from 'vitest';
import type { WebhookEventPublisherPort } from '../../modules/whatsapp/application/ports/out/WebhookEventPublisherPort';
import type { WebhookEventRepositoryPort } from '../../modules/whatsapp/application/ports/out/WebhookEventRepositoryPort';
import { RecibirWebhookUseCase } from '../../modules/whatsapp/application/use-cases/RecibirWebhookUseCase';
import { VerificarSuscripcionWebhookUseCase } from '../../modules/whatsapp/application/use-cases/VerificarSuscripcionWebhookUseCase';
import { FirmaWebhookInvalidaException } from '../../modules/whatsapp/domain/exceptions/FirmaWebhookInvalidaException';
import { SuscripcionWebhookRechazadaException } from '../../modules/whatsapp/domain/exceptions/SuscripcionWebhookRechazadaException';
import { extraerCambios } from '../../modules/whatsapp/domain/WebhookCambio';

describe('VerificarSuscripcionWebhookUseCase', () => {
  const useCase = new VerificarSuscripcionWebhookUseCase({
    verifyToken: 'secreto',
  });

  it('devuelve el challenge cuando el token coincide', () => {
    expect(
      useCase.execute({
        mode: 'subscribe',
        verifyToken: 'secreto',
        challenge: '1158201444',
      })
    ).toBe('1158201444');
  });

  it.each([
    { mode: 'subscribe', verifyToken: 'otro', challenge: 'c' },
    { mode: 'unsubscribe', verifyToken: 'secreto', challenge: 'c' },
    { mode: 'subscribe', verifyToken: 'secreto', challenge: undefined },
    { mode: undefined, verifyToken: undefined, challenge: undefined },
  ])('rechaza %o', (solicitud) => {
    expect(() => useCase.execute(solicitud)).toThrow(
      SuscripcionWebhookRechazadaException
    );
  });

  it('rechaza todo si no hay verify token configurado', () => {
    const sinConfigurar = new VerificarSuscripcionWebhookUseCase({
      verifyToken: null,
    });
    expect(() =>
      sinConfigurar.execute({
        mode: 'subscribe',
        verifyToken: '',
        challenge: 'c',
      })
    ).toThrow(SuscripcionWebhookRechazadaException);
  });
});

describe('RecibirWebhookUseCase', () => {
  const cuerpo = {
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

  function armar(firmaValida: boolean) {
    const eventos: WebhookEventRepositoryPort = {
      guardar: vi.fn(async (cambios) => cambios.map((_, i) => `id-${i}`)),
      registrarFallo: vi.fn(),
      pendientes: vi.fn(),
    };
    const publicador: WebhookEventPublisherPort = {
      publicarRecibidos: vi.fn(),
    };
    const useCase = new RecibirWebhookUseCase(
      { esValida: () => firmaValida },
      eventos,
      publicador
    );
    return { useCase, eventos, publicador };
  }

  it('guarda un evento por cada cambio de cada entry y los publica', async () => {
    const { useCase, eventos, publicador } = armar(true);

    const guardados = await useCase.execute({
      rawBody: Buffer.from('x'),
      firma: 'sha256=x',
      cuerpo,
    });

    expect(guardados).toBe(3);
    expect(eventos.guardar).toHaveBeenCalledWith([
      { campo: 'messages', payload: { messages: [{ id: 'wamid.1' }] } },
      { campo: 'message_template_status_update', payload: { event: 'X' } },
      { campo: 'messages', payload: { statuses: [] } },
    ]);
    expect(publicador.publicarRecibidos).toHaveBeenCalledWith([
      'id-0',
      'id-1',
      'id-2',
    ]);
  });

  it('rechaza una firma inválida sin guardar nada', async () => {
    const { useCase, eventos } = armar(false);

    await expect(
      useCase.execute({ rawBody: Buffer.from('x'), firma: undefined, cuerpo })
    ).rejects.toBeInstanceOf(FirmaWebhookInvalidaException);
    expect(eventos.guardar).not.toHaveBeenCalled();
  });

  it('acepta sin guardar un cuerpo firmado que no es un webhook de WhatsApp', async () => {
    const { useCase, eventos, publicador } = armar(true);

    const guardados = await useCase.execute({
      rawBody: Buffer.from('x'),
      firma: 'sha256=x',
      cuerpo: { hola: 'mundo' },
    });

    expect(guardados).toBe(0);
    expect(eventos.guardar).not.toHaveBeenCalled();
    expect(publicador.publicarRecibidos).not.toHaveBeenCalled();
  });
});

describe('extraerCambios', () => {
  it('guarda null cuando el cambio no trae value', () => {
    expect(
      extraerCambios({ entry: [{ changes: [{ field: 'messages' }] }] })
    ).toEqual([{ campo: 'messages', payload: null }]);
  });
});
