import { ApiProperty } from '@nestjs/swagger';

export class ValidationDetailDto {
  @ApiProperty({ example: 'taxId' })
  field!: string;

  @ApiProperty({ example: 'TAX_ID_INVALID' })
  code!: string;

  @ApiProperty({
    example:
      'El identificador fiscal no supera el algoritmo de control (letra esperada: Z)',
  })
  message!: string;
}
