import { Injectable, NotFoundException } from '@nestjs/common';
import { calculateSimulationCost } from '../domain/pricing/pricing-engine';
import type { TierLine } from '../domain/pricing/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { SimulationListResponseDto } from './dto/simulation-list-response.dto';
import { SimulationResponseDto } from './dto/simulation-response.dto';

interface StoredSimulation {
  id: string;
  activeUsers: number;
  storageGb: number;
  apiCallsMonth: number;
  baseCents: number;
  vatRateBps: number;
  taxCents: number;
  totalCents: number;
  breakdown: string;
  createdAt: Date;
}

@Injectable()
export class SimulationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSimulationDto): Promise<SimulationResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: { country: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const result = calculateSimulationCost(
      { activeUsers: dto.activeUsers },
      customer.country.vatRateBps,
    );

    const simulation = await this.prisma.simulation.create({
      data: {
        customerId: customer.id,
        activeUsers: dto.activeUsers,
        storageGb: dto.storageGb,
        apiCallsMonth: dto.apiCallsMonth,
        baseCents: result.baseCents,
        vatRateBps: result.vatRateBps,
        taxCents: result.taxCents,
        totalCents: result.totalCents,
        breakdown: JSON.stringify(result.lines),
      },
    });

    return toSimulationResponse(simulation);
  }

  async findByCustomer(customerId: string): Promise<SimulationListResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const simulations = await this.prisma.simulation.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return { items: simulations.map(toSimulationResponse) };
  }
}

function toSimulationResponse(
  simulation: StoredSimulation,
): SimulationResponseDto {
  return {
    id: simulation.id,
    activeUsers: simulation.activeUsers,
    storageGb: simulation.storageGb,
    apiCallsMonth: simulation.apiCallsMonth,
    baseCents: simulation.baseCents,
    vatRateBps: simulation.vatRateBps,
    taxCents: simulation.taxCents,
    totalCents: simulation.totalCents,
    breakdown: JSON.parse(simulation.breakdown) as TierLine[],
    createdAt: simulation.createdAt,
  };
}
