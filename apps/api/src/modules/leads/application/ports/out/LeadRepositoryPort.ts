import type { Lead, LeadData } from '../../../domain/Lead';

export interface LeadRepositoryPort {
  findAll(): Promise<Lead[]>;
  findByEmail(email: string): Promise<Lead | null>;
  /** Throws `LeadDuplicateEmailException` if the unique index rejects it. */
  create(data: LeadData): Promise<Lead>;
}
