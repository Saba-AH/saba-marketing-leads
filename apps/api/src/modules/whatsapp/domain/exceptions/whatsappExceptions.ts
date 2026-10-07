import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class ConversacionNoEncontradaException extends DomainException {
  constructor() {
    super('WHATSAPP_CONVERSACION_NO_ENCONTRADA');
  }
}

export class VentanaCerradaException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_VENTANA_CERRADA', cause);
  }
}

export class ContactoSinTelefonoException extends DomainException {
  constructor() {
    super('WHATSAPP_CONTACTO_SIN_TELEFONO');
  }
}

export class WhatsAppNoConfiguradoException extends DomainException {
  constructor() {
    super('WHATSAPP_NO_CONFIGURADO');
  }
}

export class DestinatarioNoPermitidoException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_DESTINATARIO_NO_PERMITIDO', cause);
  }
}

export class NoEntregableException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_NO_ENTREGABLE', cause);
  }
}

export class TokenWhatsAppInvalidoException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_TOKEN_INVALIDO', cause);
  }
}

export class DemasiadosEnviosException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_DEMASIADOS_ENVIOS', cause);
  }
}

export class EnvioRechazadoException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_ENVIO_RECHAZADO', cause);
  }
}
