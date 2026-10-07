import type { DomainException } from '../../../infrastructure/errors/DomainException';
import type { ErrorEnvioMeta } from './Chats';
import {
  DemasiadosEnviosException,
  DestinatarioNoPermitidoException,
  EnvioRechazadoException,
  NoEntregableException,
  TokenWhatsAppInvalidoException,
  VentanaCerradaException,
} from './exceptions/whatsappExceptions';

/** Códigos de https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes */
export function excepcionDeEnvio(error: ErrorEnvioMeta): DomainException {
  switch (error.codigo) {
    case 131047:
      return new VentanaCerradaException(error);
    case 131030:
      return new DestinatarioNoPermitidoException(error);
    case 131026:
      return new NoEntregableException(error);
    case 190:
      return new TokenWhatsAppInvalidoException(error);
    case 131056:
    case 130429:
    case 80007:
      return new DemasiadosEnviosException(error);
    default:
      return new EnvioRechazadoException(error);
  }
}
