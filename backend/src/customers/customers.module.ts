import { Module } from '@nestjs/common';
import { SimulationsModule } from '../simulations/simulations.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [SimulationsModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
