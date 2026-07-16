import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationDetailDto } from './validation-detail.dto';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({ example: 'Validación fallida' })
  message!: string;

  @ApiPropertyOptional({
    type: [ValidationDetailDto],
    description: 'Solo presente en errores de validación (400)',
  })
  details?: ValidationDetailDto[];

  @ApiProperty({ example: '2026-07-20T10:30:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/customers' })
  path!: string;
}
