import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { FALLBACK_VALIDATION_CODE } from '../../common/validation-exception.factory';

const trimIfString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : (value as unknown);

export class CreateCustomerDto {
  @ApiProperty({ example: 'Acme Ibérica SL', minLength: 2, maxLength: 120 })
  @Transform(trimIfString)
  @IsString({ context: { code: FALLBACK_VALIDATION_CODE } })
  @Length(2, 120, { context: { code: 'COMPANY_NAME_LENGTH' } })
  companyName!: string;

  @ApiProperty({
    example: 'B58818501',
    description:
      'Se normaliza (mayúsculas, sin espacios/guiones). ES: algoritmo DNI/NIE/CIF; resto: 4-20 alfanuméricos',
  })
  @IsString({ context: { code: FALLBACK_VALIDATION_CODE } })
  @IsNotEmpty({ context: { code: FALLBACK_VALIDATION_CODE } })
  taxId!: string;

  @ApiProperty({ example: 'finanzas@acme.es', maxLength: 254 })
  @IsEmail({}, { context: { code: 'EMAIL_INVALID' } })
  @MaxLength(254, { context: { code: 'EMAIL_INVALID' } })
  email!: string;

  @ApiProperty({ example: 'ES', description: 'Debe existir en countries' })
  @IsString({ context: { code: FALLBACK_VALIDATION_CODE } })
  @IsNotEmpty({ context: { code: FALLBACK_VALIDATION_CODE } })
  countryCode!: string;

  @ApiProperty({ example: 'PRO', description: 'Debe existir en plans' })
  @IsString({ context: { code: FALLBACK_VALIDATION_CODE } })
  @IsNotEmpty({ context: { code: FALLBACK_VALIDATION_CODE } })
  planCode!: string;
}
