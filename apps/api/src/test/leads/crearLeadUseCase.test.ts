import { beforeEach, describe, expect, it } from 'vitest';
import { CrearLeadUseCase } from '../../modules/leads/application/use-cases/CrearLeadUseCase';
import { LeadCorreoDuplicadoException } from '../../modules/leads/domain/exceptions/LeadCorreoDuplicadoException';
import { FakeLeadRepository } from '../support/fakeLeadRepository';

describe('CrearLeadUseCase', () => {
  let repo: FakeLeadRepository;
  let useCase: CrearLeadUseCase;

  beforeEach(() => {
    repo = new FakeLeadRepository();
    useCase = new CrearLeadUseCase(repo);
  });

  it('crea un lead nuevo', async () => {
    const lead = await useCase.execute({
      nombre: 'Ana',
      correo: 'ana@saba.com',
      origen: 'web',
    });

    expect(lead.nombre).toBe('Ana');
    expect(repo.leads).toHaveLength(1);
  });

  it('rechaza un correo que ya existe', async () => {
    await useCase.execute({ nombre: 'Ana', correo: 'ana@saba.com' });

    await expect(
      useCase.execute({ nombre: 'Otra Ana', correo: 'ana@saba.com' })
    ).rejects.toBeInstanceOf(LeadCorreoDuplicadoException);
  });
});
