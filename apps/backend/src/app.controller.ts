import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('health')
  async health() {
    const health = await this.appService.getHealthCheck();

    if (health.status === 'error') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }
}
