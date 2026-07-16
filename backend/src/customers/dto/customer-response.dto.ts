import { ApiProperty } from '@nestjs/swagger';
import { CountryResponseDto } from './country-response.dto';
import { PlanResponseDto } from './plan-response.dto';

export class CustomerResponseDto {
  @ApiProperty({ example: 'cm5xa1b2c3d4e5f6g7h8i9j0k' })
  id!: string;

  @ApiProperty({ example: 'Acme Ibérica SL' })
  companyName!: string;

  @ApiProperty({ example: 'B58818501', description: 'Persistido normalizado' })
  taxId!: string;

  @ApiProperty({ example: 'finanzas@acme.es' })
  email!: string;

  @ApiProperty({ type: CountryResponseDto })
  country!: CountryResponseDto;

  @ApiProperty({ type: PlanResponseDto })
  plan!: PlanResponseDto;

  @ApiProperty({ example: '2026-07-20T10:30:00.000Z', type: String })
  createdAt!: Date;
}
