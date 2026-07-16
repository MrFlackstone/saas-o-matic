import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { FALLBACK_VALIDATION_CODE } from '../../common/validation-exception.factory';

export class CreateSimulationDto {
  @ApiProperty({
    example: 'cm5xa1b2c3d4e5f6g7h8i9j0k',
    description: 'Debe existir en customers; si no, 404',
  })
  @IsString({ context: { code: FALLBACK_VALIDATION_CODE } })
  @IsNotEmpty({ context: { code: FALLBACK_VALIDATION_CODE } })
  customerId!: string;

  @ApiProperty({ example: 15, minimum: 1, maximum: 100000 })
  @IsInt({ context: { code: FALLBACK_VALIDATION_CODE } })
  @Min(1, { context: { code: FALLBACK_VALIDATION_CODE } })
  @Max(100000, { context: { code: FALLBACK_VALIDATION_CODE } })
  activeUsers!: number;

  @ApiProperty({ example: 500, minimum: 0, maximum: 1000000 })
  @IsInt({ context: { code: FALLBACK_VALIDATION_CODE } })
  @Min(0, { context: { code: FALLBACK_VALIDATION_CODE } })
  @Max(1000000, { context: { code: FALLBACK_VALIDATION_CODE } })
  storageGb!: number;

  @ApiProperty({ example: 1000000, minimum: 0, maximum: 1000000000 })
  @IsInt({ context: { code: FALLBACK_VALIDATION_CODE } })
  @Min(0, { context: { code: FALLBACK_VALIDATION_CODE } })
  @Max(1000000000, { context: { code: FALLBACK_VALIDATION_CODE } })
  apiCallsMonth!: number;
}
