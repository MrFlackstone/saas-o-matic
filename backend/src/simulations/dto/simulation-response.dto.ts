import { ApiProperty } from '@nestjs/swagger';
import { TierLineDto } from './tier-line.dto';

export class SimulationResponseDto {
  @ApiProperty({ example: 'cm5xs1m2u3l4a5c6i7o8n9id0' })
  id!: string;

  @ApiProperty({ example: 15 })
  activeUsers!: number;

  @ApiProperty({ example: 500 })
  storageGb!: number;

  @ApiProperty({ example: 1000000 })
  apiCallsMonth!: number;

  @ApiProperty({ example: 14000, description: 'Céntimos de EUR' })
  baseCents!: number;

  @ApiProperty({
    example: 2100,
    description: 'IVA aplicado, en puntos básicos',
  })
  vatRateBps!: number;

  @ApiProperty({ example: 2940, description: 'Céntimos de EUR' })
  taxCents!: number;

  @ApiProperty({ example: 16940, description: 'Céntimos de EUR' })
  totalCents!: number;

  @ApiProperty({
    type: [TierLineDto],
    example: [
      {
        tier: 1,
        fromUser: 1,
        toUser: 10,
        users: 10,
        unitCents: 1000,
        amountCents: 10000,
      },
      {
        tier: 2,
        fromUser: 11,
        toUser: 15,
        users: 5,
        unitCents: 800,
        amountCents: 4000,
      },
    ],
  })
  breakdown!: TierLineDto[];

  @ApiProperty({ example: '2026-07-20T10:30:00.000Z', type: String })
  createdAt!: Date;
}
