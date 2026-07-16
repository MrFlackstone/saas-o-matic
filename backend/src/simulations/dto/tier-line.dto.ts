import { ApiProperty } from '@nestjs/swagger';

export class TierLineDto {
  @ApiProperty({ example: 1 })
  tier!: number;

  @ApiProperty({ example: 1 })
  fromUser!: number;

  @ApiProperty({ example: 10 })
  toUser!: number;

  @ApiProperty({ example: 10 })
  users!: number;

  @ApiProperty({ example: 1000 })
  unitCents!: number;

  @ApiProperty({ example: 10000 })
  amountCents!: number;
}
