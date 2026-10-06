import { HealthService } from './components/health';
import { LeadsService } from './components/leads';
import type { HttpClient, TokenProvider } from './http';
import { SafeFetchClient } from './http';
import { getAccessToken } from './lib/token';

/**
 * API configuration
 */
export interface APIConfig {
  baseURL: string;
  token?: TokenProvider;
  /** Optional: provide a custom HttpClient implementation (for testing or alternative transports) */
  httpClient?: HttpClient;
}

/**
 * Versioned API service interface
 */
export interface APIService {
  health: HealthService;
  leads: LeadsService;
}

export class API {
  public readonly v1: APIService;

  /** Exposed for advanced use cases (e.g., making raw requests) */
  public readonly httpClient: HttpClient;

  constructor(config: APIConfig) {
    // Use provided HttpClient or create SafeFetchHttpClient
    this.httpClient =
      config.httpClient ??
      new SafeFetchClient({
        baseUrl: config.baseURL,
        // La referencia, no el resultado: `TokenProvider` acepta una función y
        // `SafeFetchClient` la resuelve en cada request. Invocarla acá
        // congelaría el token del momento en que se construyó el singleton, y
        // quien inicie sesión después seguiría mandando peticiones sin él.
        token: config.token ?? getAccessToken,
      });

    // Wire services with dependencies
    this.v1 = Object.freeze({
      health: new HealthService(this.httpClient),
      leads: new LeadsService(this.httpClient),
    });
  }
}
