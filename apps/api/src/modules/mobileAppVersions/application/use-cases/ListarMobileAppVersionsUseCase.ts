import { Inject, Injectable } from '@nestjs/common';
import type {
  FiltroMobileAppVersions,
  MobileAppVersion,
} from '../../domain/MobileAppVersion';
import { MOBILE_APP_VERSIONS_TOKENS } from '../../tokens';
import type { ListarMobileAppVersionsPort } from '../ports/in/ListarMobileAppVersionsPort';
import type { MobileAppVersionRepositoryPort } from '../ports/out/MobileAppVersionRepositoryPort';

@Injectable()
export class ListarMobileAppVersionsUseCase
  implements ListarMobileAppVersionsPort
{
  constructor(
    @Inject(MOBILE_APP_VERSIONS_TOKENS.MobileAppVersionRepository)
    private readonly versiones: MobileAppVersionRepositoryPort
  ) {}

  async execute(filtro: FiltroMobileAppVersions): Promise<MobileAppVersion[]> {
    return await this.versiones.findAll(filtro);
  }
}
