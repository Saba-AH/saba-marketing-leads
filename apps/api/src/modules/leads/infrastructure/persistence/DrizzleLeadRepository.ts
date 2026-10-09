import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import { isUniqueViolation } from '../../../../infrastructure/database/postgresErrors';
import type { LeadRepositoryPort } from '../../application/ports/out/LeadRepositoryPort';
import { LeadDuplicateEmailException } from '../../domain/exceptions/LeadDuplicateEmailException';
import type { Lead, LeadData } from '../../domain/Lead';
import { toLeadDomain } from './LeadMapper';
import { leads } from './leads.schema';

@Injectable()
export class DrizzleLeadRepository implements LeadRepositoryPort {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  /** Most recent first: that is what people check when opening the list. */
  async findAll(): Promise<Lead[]> {
    const rows = await this.db.query.leads.findMany({
      orderBy: desc(leads.createdAt),
    });
    return rows.map(toLeadDomain);
  }

  async findByEmail(email: string): Promise<Lead | null> {
    const row = await this.db.query.leads.findFirst({
      where: eq(leads.email, email),
    });
    return row ? toLeadDomain(row) : null;
  }

  async create(data: LeadData): Promise<Lead> {
    try {
      const [row] = await this.db
        .insert(leads)
        .values({
          name: data.name,
          email: data.email,
          source: data.source ?? null,
        })
        .returning();
      return toLeadDomain(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new LeadDuplicateEmailException(error);
      }
      throw error;
    }
  }
}
