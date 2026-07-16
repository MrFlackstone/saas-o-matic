import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { FALLBACK_VALIDATION_CODE } from '../../common/validation-exception.factory';

export class SearchCustomersDto {
  @ApiPropertyOptional({
    example: 'acme',
    description:
      'Subcadena sobre companyName o taxId, sin distinción de mayúsculas',
  })
  @IsOptional()
  @IsString({ context: { code: FALLBACK_VALIDATION_CODE } })
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ context: { code: FALLBACK_VALIDATION_CODE } })
  @Min(1, { context: { code: FALLBACK_VALIDATION_CODE } })
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ context: { code: FALLBACK_VALIDATION_CODE } })
  @Min(1, { context: { code: FALLBACK_VALIDATION_CODE } })
  @Max(50, { context: { code: FALLBACK_VALIDATION_CODE } })
  limit: number = 10;
}
