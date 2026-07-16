import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SimulationsService } from './simulations.service';

interface PrismaMock {
  customer: { findUnique: jest.Mock };
  simulation: { create: jest.Mock; findMany: jest.Mock };
}

const COUNTRY_ES = { code: 'ES', name: 'España', vatRateBps: 2100 };
const COUNTRY_US = { code: 'US', name: 'Estados Unidos', vatRateBps: 0 };

const CUSTOMER_ES = { id: 'cust-es', countryCode: 'ES', country: COUNTRY_ES };
const CUSTOMER_US = { id: 'cust-us', countryCode: 'US', country: COUNTRY_US };

const CREATE_DTO = {
  customerId: 'cust-es',
  activeUsers: 15,
  storageGb: 500,
  apiCallsMonth: 1000000,
};

const GOLDEN_BREAKDOWN = [
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
];

const STORED_SIMULATION = {
  id: 'sim-1',
  customerId: 'cust-es',
  activeUsers: 15,
  storageGb: 500,
  apiCallsMonth: 1000000,
  baseCents: 14000,
  vatRateBps: 2100,
  taxCents: 2940,
  totalCents: 16940,
  breakdown: JSON.stringify(GOLDEN_BREAKDOWN),
  createdAt: new Date('2026-07-20T10:30:00.000Z'),
};

function buildPrismaMock(): PrismaMock {
  return {
    customer: { findUnique: jest.fn() },
    simulation: { create: jest.fn(), findMany: jest.fn() },
  };
}

function buildService(prisma: PrismaMock): SimulationsService {
  return new SimulationsService(prisma as unknown as PrismaService);
}

describe('SimulationsService.create', () => {
  let prisma: PrismaMock;
  let service: SimulationsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = buildService(prisma);
    prisma.customer.findUnique.mockResolvedValue(CUSTOMER_ES);
    prisma.simulation.create.mockResolvedValue(STORED_SIMULATION);
  });

  it('caso dorado ES 15 usuarios: persiste el snapshot que produce el motor', async () => {
    await service.create(CREATE_DTO);

    expect(prisma.simulation.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-es',
        activeUsers: 15,
        storageGb: 500,
        apiCallsMonth: 1000000,
        baseCents: 14000,
        vatRateBps: 2100,
        taxCents: 2940,
        totalCents: 16940,
        breakdown: JSON.stringify(GOLDEN_BREAKDOWN),
      },
    });
  });

  it('devuelve el shape del contrato con breakdown parseado', async () => {
    const result = await service.create(CREATE_DTO);

    expect(result).toEqual({
      id: 'sim-1',
      activeUsers: 15,
      storageGb: 500,
      apiCallsMonth: 1000000,
      baseCents: 14000,
      vatRateBps: 2100,
      taxCents: 2940,
      totalCents: 16940,
      breakdown: GOLDEN_BREAKDOWN,
      createdAt: new Date('2026-07-20T10:30:00.000Z'),
    });
  });

  it('aplica el vatRateBps del país del cliente (US → 0)', async () => {
    prisma.customer.findUnique.mockResolvedValue(CUSTOMER_US);
    prisma.simulation.create.mockResolvedValue({
      ...STORED_SIMULATION,
      customerId: 'cust-us',
      vatRateBps: 0,
      taxCents: 0,
      totalCents: 14000,
    });

    await service.create({ ...CREATE_DTO, customerId: 'cust-us' });

    expect(prisma.simulation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vatRateBps: 0,
        taxCents: 0,
        totalCents: 14000,
      }) as unknown,
    });
  });

  it('cliente inexistente: 404 sin persistir nada', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ ...CREATE_DTO, customerId: 'nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.simulation.create).not.toHaveBeenCalled();
  });
});

describe('SimulationsService.findByCustomer', () => {
  let prisma: PrismaMock;
  let service: SimulationsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = buildService(prisma);
    prisma.customer.findUnique.mockResolvedValue(CUSTOMER_ES);
    prisma.simulation.findMany.mockResolvedValue([STORED_SIMULATION]);
  });

  it('devuelve el histórico ordenado por createdAt descendente', async () => {
    const result = await service.findByCustomer('cust-es');

    expect(prisma.simulation.findMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-es' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'sim-1',
      breakdown: GOLDEN_BREAKDOWN,
    });
  });

  it('cliente inexistente: 404 sin consultar simulaciones', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(service.findByCustomer('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.simulation.findMany).not.toHaveBeenCalled();
  });
});
