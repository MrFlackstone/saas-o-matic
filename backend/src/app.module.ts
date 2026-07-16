import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomersModule } from './customers/customers.module';
import { PrismaModule } from './prisma/prisma.module';
import { SimulationsModule } from './simulations/simulations.module';

@Module({
  imports: [PrismaModule, CustomersModule, SimulationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
