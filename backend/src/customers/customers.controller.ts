import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { SimulationListResponseDto } from '../simulations/dto/simulation-list-response.dto';
import { SimulationsService } from '../simulations/simulations.service';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerListResponseDto } from './dto/customer-list-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { SearchCustomersDto } from './dto/search-customers.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly simulationsService: SimulationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registra un cliente corporativo',
    description:
      'Normaliza el taxId y, si el país es ES, aplica el algoritmo oficial DNI/NIE/CIF.',
  })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'Validación fallida: details[].code ∈ {COMPANY_NAME_LENGTH, EMAIL_INVALID, COUNTRY_UNKNOWN, PLAN_UNKNOWN, TAX_ID_INVALID, TAX_ID_FORMAT, VALIDATION_ERROR}',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'TAX_ID_TAKEN: el identificador fiscal ya está registrado',
  })
  create(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return this.customersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Búsqueda paginada de clientes',
    description:
      'Filtra por subcadena de companyName o taxId, sin distinción de mayúsculas.',
  })
  @ApiOkResponse({ type: CustomerListResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  search(@Query() query: SearchCustomersDto): Promise<CustomerListResponseDto> {
    return this.customersService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un cliente' })
  @ApiParam({ name: 'id', example: 'cm5xa1b2c3d4e5f6g7h8i9j0k' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findById(@Param('id') id: string): Promise<CustomerResponseDto> {
    return this.customersService.findById(id);
  }

  @Get(':id/simulations')
  @ApiOperation({
    summary: 'Histórico de simulaciones de un cliente',
    description:
      'Snapshots inmutables (RN-05) ordenados por createdAt descendente.',
  })
  @ApiParam({ name: 'id', example: 'cm5xa1b2c3d4e5f6g7h8i9j0k' })
  @ApiOkResponse({ type: SimulationListResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findSimulations(@Param('id') id: string): Promise<SimulationListResponseDto> {
    return this.simulationsService.findByCustomer(id);
  }
}
