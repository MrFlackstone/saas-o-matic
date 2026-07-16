import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { TierLine } from '../src/domain/pricing/types';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' }),
});

const countries = [
  { code: 'ES', name: 'España', vatRateBps: 2100 },
  { code: 'PT', name: 'Portugal', vatRateBps: 2300 },
  { code: 'FR', name: 'Francia', vatRateBps: 2000 },
  { code: 'DE', name: 'Alemania', vatRateBps: 1900 },
  { code: 'IT', name: 'Italia', vatRateBps: 2200 },
  { code: 'NL', name: 'Países Bajos', vatRateBps: 2100 },
  { code: 'BE', name: 'Bélgica', vatRateBps: 2100 },
  { code: 'IE', name: 'Irlanda', vatRateBps: 2300 },
  { code: 'GB', name: 'Reino Unido', vatRateBps: 2000 },
  { code: 'US', name: 'Estados Unidos', vatRateBps: 0 },
];

const plans = [
  { code: 'STARTER', name: 'Starter' },
  { code: 'PRO', name: 'Pro' },
  { code: 'ENTERPRISE', name: 'Enterprise' },
];

const customers = [
  {
    companyName: 'Acme Iberia SL',
    taxId: 'B58818501',
    email: 'facturacion@acme-iberia.es',
    countryCode: 'ES',
    planCode: 'PRO',
  },
  {
    companyName: 'Lusitania Software LDA',
    taxId: 'PT509442013',
    email: 'billing@lusitaniasoftware.pt',
    countryCode: 'PT',
    planCode: 'STARTER',
  },
  {
    companyName: 'Globex Corporation',
    taxId: '981234567',
    email: 'accounts@globex.com',
    countryCode: 'US',
    planCode: 'ENTERPRISE',
  },
];

const simulations: Array<{
  id: string;
  customerTaxId: string;
  activeUsers: number;
  storageGb: number;
  apiCallsMonth: number;
  baseCents: number;
  vatRateBps: number;
  taxCents: number;
  totalCents: number;
  breakdown: TierLine[];
}> = [
  {
    // Caso dorado RN-01: 15 usuarios → 140 € base
    id: 'sim-demo-es-15',
    customerTaxId: 'B58818501',
    activeUsers: 15,
    storageGb: 50,
    apiCallsMonth: 120000,
    baseCents: 14000,
    vatRateBps: 2100,
    taxCents: 2940,
    totalCents: 16940,
    breakdown: [
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
  },
  {
    // Caso dorado RN-01: 100 usuarios → 670 € base
    id: 'sim-demo-es-100',
    customerTaxId: 'B58818501',
    activeUsers: 100,
    storageGb: 250,
    apiCallsMonth: 900000,
    baseCents: 67000,
    vatRateBps: 2100,
    taxCents: 14070,
    totalCents: 81070,
    breakdown: [
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
        toUser: 50,
        users: 40,
        unitCents: 800,
        amountCents: 32000,
      },
      {
        tier: 3,
        fromUser: 51,
        toUser: 100,
        users: 50,
        unitCents: 500,
        amountCents: 25000,
      },
    ],
  },
  {
    id: 'sim-demo-pt-8',
    customerTaxId: 'PT509442013',
    activeUsers: 8,
    storageGb: 20,
    apiCallsMonth: 45000,
    baseCents: 8000,
    vatRateBps: 2300,
    taxCents: 1840,
    totalCents: 9840,
    breakdown: [
      {
        tier: 1,
        fromUser: 1,
        toUser: 8,
        users: 8,
        unitCents: 1000,
        amountCents: 8000,
      },
    ],
  },
  {
    // Caso dorado RN-01: 200 usuarios → 1.170 € base (US: IVA 0 %)
    id: 'sim-demo-us-200',
    customerTaxId: '981234567',
    activeUsers: 200,
    storageGb: 1000,
    apiCallsMonth: 5000000,
    baseCents: 117000,
    vatRateBps: 0,
    taxCents: 0,
    totalCents: 117000,
    breakdown: [
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
        toUser: 50,
        users: 40,
        unitCents: 800,
        amountCents: 32000,
      },
      {
        tier: 3,
        fromUser: 51,
        toUser: 200,
        users: 150,
        unitCents: 500,
        amountCents: 75000,
      },
    ],
  },
];

async function main(): Promise<void> {
  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name, vatRateBps: country.vatRateBps },
      create: country,
    });
  }

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: { name: plan.name },
      create: plan,
    });
  }

  for (const { planCode, countryCode, ...customer } of customers) {
    await prisma.customer.upsert({
      where: { taxId: customer.taxId },
      update: {
        companyName: customer.companyName,
        email: customer.email,
        country: { connect: { code: countryCode } },
        plan: { connect: { code: planCode } },
      },
      create: {
        ...customer,
        country: { connect: { code: countryCode } },
        plan: { connect: { code: planCode } },
      },
    });
  }

  for (const { id, customerTaxId, breakdown, ...simulation } of simulations) {
    const data = {
      ...simulation,
      breakdown: JSON.stringify(breakdown),
      customer: { connect: { taxId: customerTaxId } },
    };
    await prisma.simulation.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
