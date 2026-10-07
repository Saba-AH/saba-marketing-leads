/**
 * Agregador de handlers de MSW.
 *
 * Todo el consumo de datos del panel ocurre en el navegador contra la API de
 * NestJS, así que interceptar HTTP con MSW es la forma natural de probarlo: los
 * tests ejercen el mismo camino que producción, sin doblar el cliente HTTP.
 *
 * Un handler puntual se sobreescribe en el test con `server.use(...)`.
 */

import { healthHandlers } from './handlers/health.mock';
import { leadsHandlers } from './handlers/leads.mock';
import { sessionHandlers } from './handlers/session.mock';

export const handlers = [
  ...healthHandlers,
  ...leadsHandlers,
  ...sessionHandlers,
];
