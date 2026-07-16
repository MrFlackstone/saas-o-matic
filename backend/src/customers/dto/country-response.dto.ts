import { ApiProperty } from '@nestjs/swagger';

export class CountryResponseDto {
  @ApiProperty({ example: 'ES' })
  code!: string;

  @ApiProperty({ example: 'España' })
  name!: string;

  @ApiProperty({ example: 2100, description: 'Tipo de IVA en puntos básicos' })
  vatRateBps!: number;
}
