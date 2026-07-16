import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { SimulationResponseDto } from './dto/simulation-response.dto';
import { SimulationsService } from './simulations.service';

@ApiTags('simulations')
@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Calcula y persiste una simulación de coste mensual',
    description:
      'Cálculo autoritativo en servidor con el motor de tramos (RN-01) y el IVA del país del cliente (RN-02). Persiste snapshot completo del desglose (RN-05).',
  })
  @ApiCreatedResponse({ type: SimulationResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Validación fallida (rangos o tipos de los campos)',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El customerId no existe',
  })
  create(@Body() dto: CreateSimulationDto): Promise<SimulationResponseDto> {
    return this.simulationsService.create(dto);
  }
}
