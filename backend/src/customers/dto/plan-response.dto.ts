import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ example: 'PRO' })
  code!: string;

  @ApiProperty({ example: 'Pro' })
  name!: string;
}
