import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppService, type HealthStatus } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check de la API' })
  @ApiOkResponse({ description: 'La API está operativa' })
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
