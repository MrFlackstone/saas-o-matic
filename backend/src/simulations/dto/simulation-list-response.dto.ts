import { ApiProperty } from '@nestjs/swagger';
import { SimulationResponseDto } from './simulation-response.dto';

export class SimulationListResponseDto {
  @ApiProperty({ type: [SimulationResponseDto] })
  items!: SimulationResponseDto[];
}
