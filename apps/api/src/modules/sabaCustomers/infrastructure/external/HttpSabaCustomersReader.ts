import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  INVALID_SERVICE_KEY_CODE,
  SABA_TIMEOUT_MS,
  type SabaApiConfig,
  sabaErrorCode,
  sabaHeaders,
  sabaUrl,
} from '../../../../infrastructure/saba/sabaApi';
import type { SabaCustomersReaderPort } from '../../application/ports/SabaCustomersReaderPort';
import {
  SabaForbiddenException,
  SabaSessionNotRecognizedException,
  SabaUnavailableException,
} from '../../domain/exceptions/sabaCustomersExceptions';
import type { SabaCustomer } from '../../domain/SabaCustomer';
import { SABA_CUSTOMERS_TOKENS } from '../../tokens';

// Postgres `numeric` may arrive as text depending on Saba's client.
const number = z.coerce.number().nullable().catch(null);

// Saba server contract (in English): mapped here to this repo's domain.
const responseSchema = z.object({
  ok: z.literal(true),
  customers: z.array(
    z.object({
      id: z.string(),
      fullName: z.string(),
      idNumber: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      city: z.string().nullable(),
      source: z.string().nullable(),
      customerSince: z.string().nullable(),
      applications: z.array(
        z.object({
          id: z.string(),
          status: z.string(),
          statusLabel: z.string(),
          active: z.boolean(),
          createdAt: z.string(),
          product: z.string().nullable(),
          financedAmount: number,
          installmentAmount: number,
          frequency: z.string().nullable(),
        })
      ),
    })
  ),
});

type SabaApiCustomer = z.infer<typeof responseSchema>['customers'][number];

function toSabaCustomer(c: SabaApiCustomer): SabaCustomer {
  return {
    id: c.id,
    name: c.fullName,
    idNumber: c.idNumber,
    email: c.email,
    phone: c.phone,
    city: c.city,
    source: c.source,
    customerSince: c.customerSince,
    applications: c.applications.map((a) => ({
      id: a.id,
      status: a.status,
      statusLabel: a.statusLabel,
      active: a.active,
      createdAt: a.createdAt,
      product: a.product,
      financedAmount: a.financedAmount,
      installmentAmount: a.installmentAmount,
      frequency: a.frequency,
    })),
  };
}

@Injectable()
export class HttpSabaCustomersReader implements SabaCustomersReaderPort {
  constructor(
    @Inject(SABA_CUSTOMERS_TOKENS.Config) private readonly config: SabaApiConfig
  ) {}

  async findByPhone(
    phone: string,
    credential: string
  ): Promise<SabaCustomer[]> {
    const url = sabaUrl(this.config, '/customers/by-phone');
    url.searchParams.set('phone', phone);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: sabaHeaders(this.config, { accessToken: credential }),
        signal: AbortSignal.timeout(SABA_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      throw new SabaUnavailableException(error);
    }

    if (response.status === 401) {
      if ((await sabaErrorCode(response)) === INVALID_SERVICE_KEY_CODE) {
        throw new SabaUnavailableException('Saba rechazó la service key');
      }
      throw new SabaSessionNotRecognizedException('HTTP 401');
    }
    if (response.status === 403) {
      throw new SabaForbiddenException('HTTP 403');
    }
    if (!response.ok) {
      throw new SabaUnavailableException(`HTTP ${response.status}`);
    }
    const body = responseSchema.safeParse(
      await response.json().catch(() => null)
    );
    if (!body.success) {
      throw new SabaUnavailableException('respuesta de Saba con otra forma');
    }
    return body.data.customers.map(toSabaCustomer);
  }
}
