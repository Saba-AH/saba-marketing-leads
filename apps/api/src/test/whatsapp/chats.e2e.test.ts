import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { BusModule } from '../../bus.module';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { ErrorsModule } from '../../infrastructure/errors/ErrorsModule';
import { LoggingModule } from '../../infrastructure/logging/LoggingModule';
import type { AuthenticatedUser } from '../../modules/auth/domain/AuthSession';
import type { ClienteSaba } from '../../modules/sabaClientes/domain/ClienteSaba';
import { SabaSinPermisoException } from '../../modules/sabaClientes/domain/exceptions/sabaClientesExceptions';
import { SABA_CLIENTES_TOKENS } from '../../modules/sabaClientes/tokens';
import {
  type ArchivoMedia,
  ErrorEnvioMeta,
} from '../../modules/whatsapp/domain/Chats';
import {
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
} from '../../modules/whatsapp/infrastructure/persistence/whatsapp.schema';
import { WhatsAppModule } from '../../modules/whatsapp/module';
import { WHATSAPP_TOKENS } from '../../modules/whatsapp/tokens';
import { ZodValidationPipe } from '../../shared/pipes/zodValidationPipe';
import {
  closeTestDb,
  getTestDb,
  resetDatabase,
  testDatabaseUrl,
} from '../support/testDatabase';

process.env.DATABASE = testDatabaseUrl();

const AHORA = new Date('2026-10-07T20:00:00Z');
const HACE_UNA_HORA = new Date(AHORA.getTime() - 60 * 60 * 1000);
const HACE_DOS_DIAS = new Date(AHORA.getTime() - 48 * 60 * 60 * 1000);
const AGENTE: AuthenticatedUser = {
  id: '11111111-1111-1111-1111-111111111111',
  correo: 'agente@sabatransporte.com',
  nombre: 'Agente',
  rol: 'admin',
};

const enviarTexto = vi.fn<(to: string, cuerpo: string) => Promise<string>>();
const descargarMedia = vi.fn<(mediaId: string) => Promise<ArchivoMedia>>();
const indicarEscribiendo = vi.fn<(wamid: string) => Promise<void>>();
const buscarPorTelefono =
  vi.fn<(telefono: string, credencial: string) => Promise<ClienteSaba[]>>();

function archivo(mimeType: string, contenido: string): ArchivoMedia {
  const bytes = new TextEncoder().encode(contenido);
  return {
    mimeType,
    tamano: bytes.length,
    contenido: new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
  };
}

async function crearChat(datos: {
  waId?: string | null;
  userId?: string | null;
  ultimoEntranteAt: Date | null;
  ultimoMensajeAt?: Date;
  noLeidos?: number;
}): Promise<string> {
  const db = getTestDb();
  const [contacto] = await db
    .insert(whatsappContacts)
    .values({
      waId: datos.waId === undefined ? '584140000001' : datos.waId,
      userId: datos.userId ?? null,
      profileName: 'Cliente',
    })
    .returning();
  if (!contacto) throw new Error('sin contacto');
  const [conversacion] = await db
    .insert(whatsappConversations)
    .values({
      contactId: contacto.id,
      ultimoEntranteAt: datos.ultimoEntranteAt,
      ultimoMensajeAt: datos.ultimoMensajeAt ?? datos.ultimoEntranteAt,
      noLeidos: datos.noLeidos ?? 0,
    })
    .returning();
  if (!conversacion) throw new Error('sin conversación');
  return conversacion.id;
}

describe('chats de WhatsApp (API)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggingModule,
        ErrorsModule,
        DrizzleModule,
        BusModule,
        WhatsAppModule,
      ],
    })
      .overrideProvider(WHATSAPP_TOKENS.WhatsAppCloud)
      .useValue({ enviarTexto, descargarMedia, indicarEscribiendo })
      .overrideProvider(SABA_CLIENTES_TOKENS.Reader)
      .useValue({ buscarPorTelefono })
      .overrideProvider(WHATSAPP_TOKENS.Clock)
      .useValue({ now: () => AHORA })
      .compile();

    app = moduleRef.createNestApplication();
    // Lo que en la app real deja el AuthGuard.
    app.use(
      (
        req: Request & { user?: AuthenticatedUser },
        _res: Response,
        next: NextFunction
      ) => {
        req.user = AGENTE;
        next();
      }
    );
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
    enviarTexto.mockReset();
    descargarMedia.mockReset();
    indicarEscribiendo.mockReset();
    buscarPorTelefono.mockReset();
  });

  it('lista las conversaciones con la de actividad más reciente primero y su ventana', async () => {
    const vieja = await crearChat({
      waId: '584140000001',
      ultimoEntranteAt: HACE_DOS_DIAS,
    });
    const reciente = await crearChat({
      waId: '584140000002',
      ultimoEntranteAt: HACE_UNA_HORA,
      noLeidos: 2,
    });

    const res = await request(app.getHttpServer()).get(
      '/whatsapp/conversaciones'
    );

    expect(res.status).toBe(200);
    expect(res.body.data.map((c: { id: string }) => c.id)).toEqual([
      reciente,
      vieja,
    ]);
    expect(res.body.data[0]).toMatchObject({
      noLeidos: 2,
      contacto: {
        telefono: '584140000002',
        nombreWhatsApp: 'Cliente',
        vinculadoASaba: false,
      },
      ventanaExpiraAt: new Date(
        HACE_UNA_HORA.getTime() + 24 * 3600 * 1000
      ).toISOString(),
    });
  });

  it('devuelve los mensajes en orden cronológico y 404 si la conversación no existe', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
    await getTestDb()
      .insert(whatsappMessages)
      .values([
        {
          conversationId: id,
          wamid: 'w2',
          direccion: 'entrante',
          origen: 'cliente',
          tipo: 'text',
          cuerpo: 'segundo',
          waTimestamp: HACE_UNA_HORA,
        },
        {
          conversationId: id,
          wamid: 'w1',
          direccion: 'entrante',
          origen: 'cliente',
          tipo: 'text',
          cuerpo: 'primero',
          waTimestamp: HACE_DOS_DIAS,
        },
      ]);

    const res = await request(app.getHttpServer()).get(
      `/whatsapp/conversaciones/${id}/mensajes`
    );
    const noExiste = await request(app.getHttpServer()).get(
      '/whatsapp/conversaciones/00000000-0000-0000-0000-000000000000/mensajes'
    );

    expect(res.body.data.map((m: { cuerpo: string }) => m.cuerpo)).toEqual([
      'primero',
      'segundo',
    ]);
    expect(noExiste.status).toBe(404);
  });

  it('responde dentro de la ventana: envía a Meta y guarda el mensaje como enviado', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
    enviarTexto.mockResolvedValue('wamid.RESPUESTA');

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: '  Hola, ¿en qué te ayudo?  ' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      direccion: 'saliente',
      origen: 'sistema',
      cuerpo: 'Hola, ¿en qué te ayudo?',
      estado: 'enviado',
    });
    expect(enviarTexto).toHaveBeenCalledWith(
      '584140000001',
      'Hola, ¿en qué te ayudo?'
    );
    const [guardado] = await getTestDb().select().from(whatsappMessages);
    expect(guardado).toMatchObject({
      wamid: 'wamid.RESPUESTA',
      enviadoPor: AGENTE.id,
    });
    const [conversacion] = await getTestDb()
      .select()
      .from(whatsappConversations);
    expect(conversacion?.ultimoMensajePreview).toBe('Hola, ¿en qué te ayudo?');
  });

  it('no envía con la ventana de 24 h cerrada', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_DOS_DIAS });

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: 'Hola' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('WHATSAPP_VENTANA_CERRADA');
    expect(enviarTexto).not.toHaveBeenCalled();
    expect(await getTestDb().select().from(whatsappMessages)).toEqual([]);
  });

  it('deja el mensaje como fallido y explica el error si Meta lo rechaza', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
    enviarTexto.mockRejectedValue(
      new ErrorEnvioMeta(131030, 'Recipient phone number not in allowed list')
    );

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: 'Hola' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('WHATSAPP_DESTINATARIO_NO_PERMITIDO');
    expect(res.body.error).toContain('destinatarios permitidos');
    const [guardado] = await getTestDb().select().from(whatsappMessages);
    expect(guardado).toMatchObject({
      estado: 'fallido',
      errorCodigo: '131030',
      errorDetalle: 'Recipient phone number not in allowed list',
    });
  });

  it('no responde a un contacto que solo comparte su nombre de usuario', async () => {
    const id = await crearChat({
      waId: null,
      userId: 'VE.1',
      ultimoEntranteAt: HACE_UNA_HORA,
    });

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: 'Hola' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('WHATSAPP_CONTACTO_SIN_TELEFONO');
  });

  it('rechaza un mensaje vacío', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: '   ' });

    expect(res.status).toBe(400);
    expect(enviarTexto).not.toHaveBeenCalled();
  });

  it('marca la conversación como leída', async () => {
    const id = await crearChat({
      ultimoEntranteAt: HACE_UNA_HORA,
      noLeidos: 3,
    });

    const res = await request(app.getHttpServer()).post(
      `/whatsapp/conversaciones/${id}/leida`
    );

    expect(res.status).toBe(200);
    const [conversacion] = await getTestDb()
      .select()
      .from(whatsappConversations)
      .where(eq(whatsappConversations.id, id));
    expect(conversacion?.noLeidos).toBe(0);
  });

  describe('archivos de los mensajes', () => {
    let contactos = 0;
    async function mensajeConMedia(
      tipo: string,
      mediaId: string | null
    ): Promise<string> {
      contactos++;
      const conversationId = await crearChat({
        waId: `58414000${String(contactos).padStart(4, '0')}`,
        ultimoEntranteAt: HACE_UNA_HORA,
      });
      const [mensaje] = await getTestDb()
        .insert(whatsappMessages)
        .values({
          conversationId,
          wamid: `w-${tipo}`,
          direccion: 'entrante',
          origen: 'cliente',
          tipo,
          mediaId,
          waTimestamp: HACE_UNA_HORA,
        })
        .returning();
      if (!mensaje) throw new Error('sin mensaje');
      return mensaje.id;
    }

    it('marca qué mensajes tienen archivo', async () => {
      const id = await mensajeConMedia('image', 'MEDIA1');
      const [{ conversationId }] = await getTestDb()
        .select({ conversationId: whatsappMessages.conversationId })
        .from(whatsappMessages)
        .where(eq(whatsappMessages.id, id));

      const res = await request(app.getHttpServer()).get(
        `/whatsapp/conversaciones/${conversationId}/mensajes`
      );

      expect(res.body.data[0]).toMatchObject({
        tipo: 'image',
        tieneMedia: true,
      });
    });

    it('pasa la imagen de Meta tal cual, para mostrarla en el panel', async () => {
      const id = await mensajeConMedia('image', 'MEDIA1');
      descargarMedia.mockResolvedValue(
        archivo('image/jpeg', 'bytes-de-la-foto')
      );

      const res = await request(app.getHttpServer())
        .get(`/whatsapp/mensajes/${id}/media`)
        .buffer(true)
        .parse((r, done) => {
          let datos = '';
          r.on('data', (c: Buffer) => {
            datos += c.toString();
          });
          r.on('end', () => done(null, datos));
        });

      expect(res.status).toBe(200);
      expect(descargarMedia).toHaveBeenCalledWith('MEDIA1');
      expect(res.headers['content-type']).toBe('image/jpeg');
      expect(res.headers['content-disposition']).toBe('inline');
      expect(res.headers['cache-control']).toBe('private, max-age=3600');
      expect(res.body).toBe('bytes-de-la-foto');
    });

    it('sirve como descarga lo que podría ejecutar código en el navegador', async () => {
      const id = await mensajeConMedia('document', 'MEDIA2');
      descargarMedia.mockResolvedValue(
        archivo('text/html', '<script>alert(1)</script>')
      );

      const res = await request(app.getHttpServer()).get(
        `/whatsapp/mensajes/${id}/media`
      );

      expect(res.headers['content-disposition']).toBe('attachment');
      expect(res.headers['content-security-policy']).toContain('sandbox');
    });

    it('responde 404 si el mensaje no tiene archivo o Meta ya no lo guarda', async () => {
      const sinArchivo = await mensajeConMedia('text', null);
      const vencido = await mensajeConMedia('image', 'MEDIA_VIEJO');
      descargarMedia.mockRejectedValue(
        new ErrorEnvioMeta(100, 'Unsupported get request')
      );

      const a = await request(app.getHttpServer()).get(
        `/whatsapp/mensajes/${sinArchivo}/media`
      );
      const b = await request(app.getHttpServer()).get(
        `/whatsapp/mensajes/${vencido}/media`
      );

      expect(a.status).toBe(404);
      expect(b.status).toBe(404);
      expect(b.body.code).toBe('WHATSAPP_MEDIA_NO_DISPONIBLE');
    });
  });

  describe('indicador de escribiendo', () => {
    async function entrante(
      conversationId: string,
      wamid: string,
      cuando: Date
    ): Promise<void> {
      await getTestDb().insert(whatsappMessages).values({
        conversationId,
        wamid,
        direccion: 'entrante',
        origen: 'cliente',
        tipo: 'text',
        cuerpo: 'hola',
        waTimestamp: cuando,
      });
    }

    it('lo manda a Meta con el último mensaje del cliente', async () => {
      const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
      await entrante(id, 'wamid.viejo', HACE_DOS_DIAS);
      await entrante(id, 'wamid.ultimo', HACE_UNA_HORA);
      indicarEscribiendo.mockResolvedValue();

      const res = await request(app.getHttpServer()).post(
        `/whatsapp/conversaciones/${id}/escribiendo`
      );

      expect(res.status).toBe(200);
      expect(indicarEscribiendo).toHaveBeenCalledWith('wamid.ultimo');
    });

    it('no hace nada con la ventana cerrada', async () => {
      const id = await crearChat({ ultimoEntranteAt: HACE_DOS_DIAS });
      await entrante(id, 'wamid.viejo', HACE_DOS_DIAS);

      const res = await request(app.getHttpServer()).post(
        `/whatsapp/conversaciones/${id}/escribiendo`
      );

      expect(res.status).toBe(200);
      expect(indicarEscribiendo).not.toHaveBeenCalled();
    });

    it('responde 200 aunque Meta lo rechace: es solo cortesía', async () => {
      const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
      await entrante(id, 'wamid.ultimo', HACE_UNA_HORA);
      indicarEscribiendo.mockRejectedValue(
        new ErrorEnvioMeta(100, 'Invalid parameter')
      );

      const res = await request(app.getHttpServer()).post(
        `/whatsapp/conversaciones/${id}/escribiendo`
      );

      expect(res.status).toBe(200);
    });
  });

  describe('cliente de Saba del chat', () => {
    const ana: ClienteSaba = {
      id: 'p1',
      nombre: 'Ana Pérez',
      cedula: 'V12345678',
      correo: null,
      telefono: '04140000001',
      ciudad: 'Caracas',
      origen: 'web',
      clienteDesde: '2026-01-01T00:00:00Z',
      solicitudes: [],
    };

    it('busca en Saba con el teléfono del chat y la sesión del agente', async () => {
      const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
      buscarPorTelefono.mockResolvedValue([ana]);

      const res = await request(app.getHttpServer())
        .get(`/whatsapp/conversaciones/${id}/cliente-saba`)
        .set('Authorization', 'Bearer token-del-agente');

      expect(res.status).toBe(200);
      expect(buscarPorTelefono).toHaveBeenCalledWith(
        '584140000001',
        'token-del-agente'
      );
      expect(res.body.data).toEqual({ sinTelefono: false, clientes: [ana] });
    });

    it('no consulta Saba si el contacto solo comparte su nombre de usuario', async () => {
      const id = await crearChat({
        waId: null,
        userId: 'VE.1',
        ultimoEntranteAt: HACE_UNA_HORA,
      });

      const res = await request(app.getHttpServer())
        .get(`/whatsapp/conversaciones/${id}/cliente-saba`)
        .set('Authorization', 'Bearer t');

      expect(res.body.data).toEqual({ sinTelefono: true, clientes: [] });
      expect(buscarPorTelefono).not.toHaveBeenCalled();
    });

    it('explica cuando Saba no le da permiso al agente', async () => {
      const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
      buscarPorTelefono.mockRejectedValue(new SabaSinPermisoException());

      const res = await request(app.getHttpServer())
        .get(`/whatsapp/conversaciones/${id}/cliente-saba`)
        .set('Authorization', 'Bearer t');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('SABA_CLIENTES_SIN_PERMISO');
    });
  });
});
