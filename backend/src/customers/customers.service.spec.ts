import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from './customers.service';

interface PrismaMock {
  country: { findUnique: jest.Mock };
  plan: { findUnique: jest.Mock };
  customer: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
}

const COUNTRY_ES = { code: 'ES', name: 'España', vatRateBps: 2100 };
const COUNTRY_US = { code: 'US', name: 'Estados Unidos', vatRateBps: 0 };
const PLAN_PRO = { id: 'plan-pro', code: 'PRO', name: 'Pro' };

const CREATE_DTO = {
  companyName: 'Acme Ibérica SL',
  taxId: 'B58818501',
  email: 'finanzas@acme.es',
  countryCode: 'ES',
  planCode: 'PRO',
};

const STORED_CUSTOMER = {
  id: 'cust-1',
  companyName: 'Acme Ibérica SL',
  taxId: 'B58818501',
  email: 'finanzas@acme.es',
  countryCode: 'ES',
  planId: 'plan-pro',
  createdAt: new Date('2026-07-20T10:30:00.000Z'),
  country: COUNTRY_ES,
  plan: PLAN_PRO,
};

const EXPECTED_RESPONSE = {
  id: 'cust-1',
  companyName: 'Acme Ibérica SL',
  taxId: 'B58818501',
  email: 'finanzas@acme.es',
  country: COUNTRY_ES,
  plan: { code: 'PRO', name: 'Pro' },
  createdAt: new Date('2026-07-20T10:30:00.000Z'),
};

function buildPrismaMock(): PrismaMock {
  return {
    country: { findUnique: jest.fn() },
    plan: { findUnique: jest.fn() },
    customer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
}

function buildService(prisma: PrismaMock): CustomersService {
  return new CustomersService(prisma as unknown as PrismaService);
}

function detailsOf(
  exception: BadRequestException,
): Array<{ field: string; code: string; message: string }> {
  const payload = exception.getResponse() as {
    details: Array<{ field: string; code: string; message: string }>;
  };
  return payload.details;
}

async function captureBadRequest(
  operation: Promise<unknown>,
): Promise<BadRequestException> {
  try {
    await operation;
  } catch (error) {
    if (error instanceof BadRequestException) {
      return error;
    }
    throw error;
  }
  throw new Error('se esperaba BadRequestException');
}

describe('CustomersService.create', () => {
  let prisma: PrismaMock;
  let service: CustomersService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = buildService(prisma);
    prisma.country.findUnique.mockResolvedValue(COUNTRY_ES);
    prisma.plan.findUnique.mockResolvedValue(PLAN_PRO);
    prisma.customer.create.mockResolvedValue(STORED_CUSTOMER);
  });

  it('crea el cliente y devuelve el shape del contrato', async () => {
    const result = await service.create(CREATE_DTO);

    expect(result).toEqual(EXPECTED_RESPONSE);
  });

  it('normaliza el countryCode antes de consultar countries', async () => {
    await service.create({ ...CREATE_DTO, countryCode: ' es ' });

    expect(prisma.country.findUnique).toHaveBeenCalledWith({
      where: { code: 'ES' },
    });
  });

  it('normaliza el taxId antes de persistir', async () => {
    await service.create({ ...CREATE_DTO, taxId: ' b-5881850-1 ' });

    expect(prisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ taxId: 'B58818501' }) as unknown,
      }),
    );
  });

  it('rechaza país desconocido con COUNTRY_UNKNOWN', async () => {
    prisma.country.findUnique.mockResolvedValue(null);

    const exception = await captureBadRequest(
      service.create({ ...CREATE_DTO, countryCode: 'XX' }),
    );

    expect(detailsOf(exception)[0]).toMatchObject({
      field: 'countryCode',
      code: 'COUNTRY_UNKNOWN',
    });
    expect(prisma.customer.create).not.toHaveBeenCalled();
  });

  it('rechaza plan desconocido con PLAN_UNKNOWN', async () => {
    prisma.plan.findUnique.mockResolvedValue(null);

    const exception = await captureBadRequest(
      service.create({ ...CREATE_DTO, planCode: 'NOPE' }),
    );

    expect(detailsOf(exception)[0]).toMatchObject({
      field: 'planCode',
      code: 'PLAN_UNKNOWN',
    });
  });

  it('rechaza taxId español inválido con TAX_ID_INVALID y el reason del dominio', async () => {
    const exception = await captureBadRequest(
      service.create({ ...CREATE_DTO, taxId: 'B58818500' }),
    );

    const detail = detailsOf(exception)[0];
    expect(detail).toMatchObject({ field: 'taxId', code: 'TAX_ID_INVALID' });
    expect(detail.message).toContain('control del CIF');
    expect(prisma.customer.create).not.toHaveBeenCalled();
  });

  it('rechaza taxId no español fuera de formato con TAX_ID_FORMAT', async () => {
    prisma.country.findUnique.mockResolvedValue(COUNTRY_US);

    const exception = await captureBadRequest(
      service.create({ ...CREATE_DTO, countryCode: 'US', taxId: '!!' }),
    );

    expect(detailsOf(exception)[0]).toMatchObject({
      field: 'taxId',
      code: 'TAX_ID_FORMAT',
    });
  });

  it('acepta taxId no español alfanumérico de 4-20 caracteres', async () => {
    prisma.country.findUnique.mockResolvedValue(COUNTRY_US);
    prisma.customer.create.mockResolvedValue({
      ...STORED_CUSTOMER,
      taxId: '981234567',
      country: COUNTRY_US,
    });

    const result = await service.create({
      ...CREATE_DTO,
      countryCode: 'US',
      taxId: '981234567',
    });

    expect(result.taxId).toBe('981234567');
  });

  it('traduce P2002 de Prisma a 409 Conflict', async () => {
    prisma.customer.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.create(CREATE_DTO)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('propaga errores de Prisma que no son P2002', async () => {
    const unexpected = new Error('boom');
    prisma.customer.create.mockRejectedValue(unexpected);

    await expect(service.create(CREATE_DTO)).rejects.toBe(unexpected);
  });
});

describe('CustomersService.search', () => {
  let prisma: PrismaMock;
  let service: CustomersService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = buildService(prisma);
    prisma.customer.findMany.mockResolvedValue([STORED_CUSTOMER]);
    prisma.customer.count.mockResolvedValue(1);
  });

  it('busca por companyName y por taxId normalizado', async () => {
    await service.search({ search: ' b-588 ', page: 1, limit: 10 });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { companyName: { contains: ' b-588 ' } },
            { taxId: { contains: 'B588' } },
          ],
        },
        skip: 0,
        take: 10,
      }),
    );
  });

  it('sin término de búsqueda lista todos', async () => {
    await service.search({ page: 1, limit: 10 });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('pagina con skip/take y devuelve total, page y limit', async () => {
    prisma.customer.count.mockResolvedValue(42);

    const result = await service.search({ page: 3, limit: 5 });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
    expect(result).toMatchObject({ total: 42, page: 3, limit: 5 });
    expect(result.items).toEqual([EXPECTED_RESPONSE]);
  });
});

describe('CustomersService.findById', () => {
  let prisma: PrismaMock;
  let service: CustomersService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = buildService(prisma);
  });

  it('devuelve el cliente con el shape del contrato', async () => {
    prisma.customer.findUnique.mockResolvedValue(STORED_CUSTOMER);

    const result = await service.findById('cust-1');

    expect(result).toEqual(EXPECTED_RESPONSE);
  });

  it('lanza 404 si el cliente no existe', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
