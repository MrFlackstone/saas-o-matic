import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

const dbPath = path.join(
  os.tmpdir(),
  `saas-o-matic-e2e-simulations-${process.pid}.db`,
);
const databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`;
process.env.DATABASE_URL = databaseUrl;

jest.setTimeout(60000);

interface TierLineBody {
  tier: number;
  fromUser: number;
  toUser: number;
  users: number;
  unitCents: number;
  amountCents: number;
}

interface SimulationBody {
  id: string;
  activeUsers: number;
  storageGb: number;
  apiCallsMonth: number;
  baseCents: number;
  vatRateBps: number;
  taxCents: number;
  totalCents: number;
  breakdown: TierLineBody[];
  createdAt: string;
}

interface SimulationListBody {
  items: SimulationBody[];
}

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ field: string; code: string; message: string }>;
  timestamp: string;
  path: string;
}

const simulationBody = (response: request.Response): SimulationBody =>
  response.body as SimulationBody;
const listBody = (response: request.Response): SimulationListBody =>
  response.body as SimulationListBody;
const errorBody = (response: request.Response): ErrorBody =>
  response.body as ErrorBody;

const GOLDEN_BREAKDOWN: TierLineBody[] = [
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

describe('Simulations API (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;
  let customerEsId: string;
  let customerUsId: string;
  let customerIdleId: string;

  beforeAll(async () => {
    execSync('pnpm exec prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const prisma = app.get(PrismaService);
    await prisma.country.createMany({
      data: [
        { code: 'ES', name: 'España', vatRateBps: 2100 },
        { code: 'US', name: 'Estados Unidos', vatRateBps: 0 },
      ],
    });
    const plan = await prisma.plan.create({
      data: { code: 'PRO', name: 'Pro' },
    });
    const customerEs = await prisma.customer.create({
      data: {
        companyName: 'Acme Ibérica SL',
        taxId: 'B58818501',
        email: 'finanzas@acme.es',
        countryCode: 'ES',
        planId: plan.id,
      },
    });
    const customerUs = await prisma.customer.create({
      data: {
        companyName: 'Globex Corporation',
        taxId: '981234567',
        email: 'accounts@globex.com',
        countryCode: 'US',
        planId: plan.id,
      },
    });
    const customerIdle = await prisma.customer.create({
      data: {
        companyName: 'Initech GmbH',
        taxId: 'DE811907980',
        email: 'billing@initech.de',
        countryCode: 'US',
        planId: plan.id,
      },
    });
    customerEsId = customerEs.id;
    customerUsId = customerUs.id;
    customerIdleId = customerIdle.id;

    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      fs.rmSync(`${dbPath}${suffix}`, { force: true });
    }
  });

  describe('POST /simulations', () => {
    it('caso dorado: cliente ES + 15 usuarios (201) con el shape del contrato', async () => {
      const response = await request(http)
        .post('/simulations')
        .send({
          customerId: customerEsId,
          activeUsers: 15,
          storageGb: 500,
          apiCallsMonth: 1000000,
        })
        .expect(201);

      const body = simulationBody(response);
      expect(body).toMatchObject({
        activeUsers: 15,
        storageGb: 500,
        apiCallsMonth: 1000000,
        baseCents: 14000,
        vatRateBps: 2100,
        taxCents: 2940,
        totalCents: 16940,
        breakdown: GOLDEN_BREAKDOWN,
      });
      expect(typeof body.id).toBe('string');
      expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
    });

    it('cliente US: impuesto 0 (201)', async () => {
      const response = await request(http)
        .post('/simulations')
        .send({
          customerId: customerUsId,
          activeUsers: 15,
          storageGb: 0,
          apiCallsMonth: 0,
        })
        .expect(201);

      expect(simulationBody(response)).toMatchObject({
        baseCents: 14000,
        vatRateBps: 0,
        taxCents: 0,
        totalCents: 14000,
      });
    });

    it('customerId inexistente: 404', async () => {
      const response = await request(http)
        .post('/simulations')
        .send({
          customerId: 'no-existe',
          activeUsers: 15,
          storageGb: 0,
          apiCallsMonth: 0,
        })
        .expect(404);

      expect(errorBody(response)).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        path: '/simulations',
      });
    });

    it('activeUsers 0: 400 con detail en el campo', async () => {
      const response = await request(http)
        .post('/simulations')
        .send({
          customerId: customerEsId,
          activeUsers: 0,
          storageGb: 0,
          apiCallsMonth: 0,
        })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'activeUsers',
        code: 'VALIDATION_ERROR',
      });
    });

    it('activeUsers no entero: 400', async () => {
      const response = await request(http)
        .post('/simulations')
        .send({
          customerId: customerEsId,
          activeUsers: 1.5,
          storageGb: 0,
          apiCallsMonth: 0,
        })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'activeUsers',
      });
    });

    it('storageGb fuera de rango: 400', async () => {
      await request(http)
        .post('/simulations')
        .send({
          customerId: customerEsId,
          activeUsers: 1,
          storageGb: 1000001,
          apiCallsMonth: 0,
        })
        .expect(400);
    });

    it('activeUsers por encima de la cota superior: 400', async () => {
      const response = await request(http)
        .post('/simulations')
        .send({
          customerId: customerEsId,
          activeUsers: 100001,
          storageGb: 0,
          apiCallsMonth: 0,
        })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'activeUsers',
      });
    });

    it('campo desconocido: se elimina por whitelist y la respuesta expone solo las claves del contrato', async () => {
      const response = await request(http)
        .post('/simulations')
        .send({
          customerId: customerEsId,
          activeUsers: 1,
          storageGb: 0,
          apiCallsMonth: 0,
          hacker: true,
        })
        .expect(201);

      expect(Object.keys(simulationBody(response)).sort()).toEqual([
        'activeUsers',
        'apiCallsMonth',
        'baseCents',
        'breakdown',
        'createdAt',
        'id',
        'storageGb',
        'taxCents',
        'totalCents',
        'vatRateBps',
      ]);
    });
  });

  describe('GET /customers/:id/simulations', () => {
    it('histórico ordenado por createdAt descendente con snapshot completo', async () => {
      await request(http)
        .post('/simulations')
        .send({
          customerId: customerEsId,
          activeUsers: 51,
          storageGb: 10,
          apiCallsMonth: 100,
        })
        .expect(201);

      const response = await request(http)
        .get(`/customers/${customerEsId}/simulations`)
        .expect(200);

      const { items } = listBody(response);
      expect(items.length).toBeGreaterThanOrEqual(2);

      const timestamps = items.map((item) => item.createdAt);
      const sorted = [...timestamps].sort((a, b) => b.localeCompare(a));
      expect(timestamps).toEqual(sorted);

      expect(items[0]).toMatchObject({
        activeUsers: 51,
        baseCents: 42500,
        vatRateBps: 2100,
        taxCents: 8925,
        totalCents: 51425,
      });
      expect(items[0].breakdown).toHaveLength(3);

      const golden = items.find((item) => item.activeUsers === 15);
      expect(golden).toMatchObject({
        baseCents: 14000,
        taxCents: 2940,
        totalCents: 16940,
        breakdown: GOLDEN_BREAKDOWN,
      });
    });

    it('cliente inexistente: 404', async () => {
      const response = await request(http)
        .get('/customers/no-existe/simulations')
        .expect(404);

      expect(errorBody(response)).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        path: '/customers/no-existe/simulations',
      });
    });

    it('cliente sin simulaciones: 200 con items vacío', async () => {
      const response = await request(http)
        .get(`/customers/${customerIdleId}/simulations`)
        .expect(200);

      expect(listBody(response).items).toEqual([]);
    });
  });
});
