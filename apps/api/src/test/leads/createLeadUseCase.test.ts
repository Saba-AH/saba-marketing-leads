import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLeadUseCase } from '../../modules/leads/application/use-cases/CreateLeadUseCase';
import { LeadDuplicateEmailException } from '../../modules/leads/domain/exceptions/LeadDuplicateEmailException';
import { FakeLeadRepository } from '../support/fakeLeadRepository';

describe('CreateLeadUseCase', () => {
  let repo: FakeLeadRepository;
  let useCase: CreateLeadUseCase;

  beforeEach(() => {
    repo = new FakeLeadRepository();
    useCase = new CreateLeadUseCase(repo);
  });

  it('creates a new lead', async () => {
    const lead = await useCase.execute({
      name: 'Ana',
      email: 'ana@saba.com',
      source: 'web',
    });

    expect(lead.name).toBe('Ana');
    expect(repo.leads).toHaveLength(1);
  });

  it('rejects an email that already exists', async () => {
    await useCase.execute({ name: 'Ana', email: 'ana@saba.com' });

    await expect(
      useCase.execute({ name: 'Otra Ana', email: 'ana@saba.com' })
    ).rejects.toBeInstanceOf(LeadDuplicateEmailException);
  });
});
