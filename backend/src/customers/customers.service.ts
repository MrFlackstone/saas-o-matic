import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { singleFieldValidationException } from '../common/validation-exception.factory';
import { normalizeTaxId } from '../domain/tax-id/normalize';
import { validateSpanishTaxId } from '../domain/tax-id/validate-spanish-tax-id';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerListResponseDto } from './dto/customer-list-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { SearchCustomersDto } from './dto/search-customers.dto';

const GENERIC_TAX_ID_PATTERN = /^[A-Z0-9]{4,20}$/;

interface CustomerWithRelations {
  id: string;
  companyName: string;
  taxId: string;
  email: string;
  createdAt: Date;
  country: { code: string; name: string; vatRateBps: number };
  plan: { code: string; name: string };
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const taxId = normalizeTaxId(dto.taxId);
    const countryCode = dto.countryCode.trim().toUpperCase();

    const country = await this.prisma.country.findUnique({
      where: { code: countryCode },
    });
    if (!country) {
      throw singleFieldValidationException(
        'countryCode',
        'COUNTRY_UNKNOWN',
        `el país ${countryCode} no está registrado`,
      );
    }

    const plan = await this.prisma.plan.findUnique({
      where: { code: dto.planCode },
    });
    if (!plan) {
      throw singleFieldValidationException(
        'planCode',
        'PLAN_UNKNOWN',
        `el plan ${dto.planCode} no está registrado`,
      );
    }

    assertTaxIdValid(taxId, country.code);

    try {
      const customer = await this.prisma.customer.create({
        data: {
          companyName: dto.companyName,
          taxId,
          email: dto.email,
          countryCode: country.code,
          planId: plan.id,
        },
        include: { country: true, plan: true },
      });
      return toCustomerResponse(customer);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El identificador fiscal ya está registrado',
        );
      }
      throw error;
    }
  }

  async search(query: SearchCustomersDto): Promise<CustomerListResponseDto> {
    const { search, page, limit } = query;
    const where = search
      ? {
          OR: [
            { companyName: { contains: search } },
            { taxId: { contains: normalizeTaxId(search) } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: { country: true, plan: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items: customers.map(toCustomerResponse),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { country: true, plan: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return toCustomerResponse(customer);
  }
}

function assertTaxIdValid(taxId: string, countryCode: string): void {
  if (countryCode === 'ES') {
    const result = validateSpanishTaxId(taxId);
    if (!result.valid) {
      throw singleFieldValidationException(
        'taxId',
        'TAX_ID_INVALID',
        `El identificador fiscal no supera el algoritmo de control (${result.reason ?? 'motivo desconocido'})`,
      );
    }
    return;
  }
  if (!GENERIC_TAX_ID_PATTERN.test(taxId)) {
    throw singleFieldValidationException(
      'taxId',
      'TAX_ID_FORMAT',
      'el identificador fiscal debe tener entre 4 y 20 caracteres alfanuméricos',
    );
  }
}

function toCustomerResponse(
  customer: CustomerWithRelations,
): CustomerResponseDto {
  return {
    id: customer.id,
    companyName: customer.companyName,
    taxId: customer.taxId,
    email: customer.email,
    country: {
      code: customer.country.code,
      name: customer.country.name,
      vatRateBps: customer.country.vatRateBps,
    },
    plan: { code: customer.plan.code, name: customer.plan.name },
    createdAt: customer.createdAt,
  };
}
