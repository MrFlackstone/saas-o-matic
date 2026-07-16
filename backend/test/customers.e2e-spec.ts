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

const dbPath = path.join(os.tmpdir(), `saas-o-matic-e2e-${process.pid}.db`);
const databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`;
process.env.DATABASE_URL = databaseUrl;

jest.setTimeout(60000);

interface CustomerBody {
  id: string;
  companyName: string;
  taxId: string;
  email: string;
  country: { code: string; name: string; vatRateBps: number };
  plan: { code: string; name: string };
  createdAt: string;
}

interface ListBody {
  items: CustomerBody[];
  total: number;
  page: number;
  limit: number;
}

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ field: string; code: string; message: string }>;
  timestamp: string;
  path: string;
}

const customerBody = (response: request.Response): CustomerBody =>
  response.body as CustomerBody;
const listBody = (response: request.Response): ListBody =>
  response.body as ListBody;
const errorBody = (response: request.Response): ErrorBody =>
  response.body as ErrorBody;

const VALID_CUSTOMER = {
  companyName: 'Acme Ibérica SL',
  taxId: 'B58818501',
  email: 'finanzas@acme.es',
  countryCode: 'ES',
  planCode: 'PRO',
};

describe('Customers API (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

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
    await prisma.plan.createMany({
      data: [
        { code: 'PRO', name: 'Pro' },
        { code: 'STARTER', name: 'Starter' },
      ],
    });

    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      fs.rmSync(`${dbPath}${suffix}`, { force: true });
    }
  });

  describe('POST /customers', () => {
    it('registra un cliente español válido (201) con el shape del contrato', async () => {
      const response = await request(http)
        .post('/customers')
        .send(VALID_CUSTOMER)
        .expect(201);

      const body = customerBody(response);
      expect(body).toMatchObject({
        companyName: 'Acme Ibérica SL',
        taxId: 'B58818501',
        email: 'finanzas@acme.es',
        country: { code: 'ES', name: 'España', vatRateBps: 2100 },
        plan: { code: 'PRO', name: 'Pro' },
      });
      expect(typeof body.id).toBe('string');
      expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
    });

    it('registra un cliente no español con taxId genérico (201)', async () => {
      const response = await request(http)
        .post('/customers')
        .send({
          companyName: 'Globex Corporation',
          taxId: '981234567',
          email: 'accounts@globex.com',
          countryCode: 'US',
          planCode: 'STARTER',
        })
        .expect(201);

      expect(customerBody(response).country).toEqual({
        code: 'US',
        name: 'Estados Unidos',
        vatRateBps: 0,
      });
    });

    it('rechaza taxId español con control incorrecto: 400 TAX_ID_INVALID', async () => {
      const response = await request(http)
        .post('/customers')
        .send({ ...VALID_CUSTOMER, taxId: 'B58818500' })
        .expect(400);

      const body = errorBody(response);
      expect(body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        path: '/customers',
      });
      expect(body.details?.[0]).toMatchObject({
        field: 'taxId',
        code: 'TAX_ID_INVALID',
      });
      expect(typeof body.timestamp).toBe('string');
    });

    it('devuelve 409 en alta duplicada aunque llegue con guiones y minúsculas', async () => {
      const response = await request(http)
        .post('/customers')
        .send({
          ...VALID_CUSTOMER,
          companyName: 'Acme Clon SL',
          email: 'clon@acme.es',
          taxId: ' b-5881850-1 ',
        })
        .expect(409);

      const body = errorBody(response);
      expect(body).toMatchObject({
        statusCode: 409,
        error: 'Conflict',
        path: '/customers',
      });
      expect(body.details).toBeUndefined();
    });

    it('rechaza país desconocido: 400 COUNTRY_UNKNOWN', async () => {
      const response = await request(http)
        .post('/customers')
        .send({ ...VALID_CUSTOMER, taxId: 'B12345674', countryCode: 'XX' })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'countryCode',
        code: 'COUNTRY_UNKNOWN',
      });
    });

    it('rechaza plan desconocido: 400 PLAN_UNKNOWN', async () => {
      const response = await request(http)
        .post('/customers')
        .send({ ...VALID_CUSTOMER, taxId: 'B12345674', planCode: 'NOPE' })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'planCode',
        code: 'PLAN_UNKNOWN',
      });
    });

    it('rechaza taxId no español fuera de formato: 400 TAX_ID_FORMAT', async () => {
      const response = await request(http)
        .post('/customers')
        .send({
          ...VALID_CUSTOMER,
          countryCode: 'US',
          taxId: '!!',
          email: 'x@y.com',
        })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'taxId',
        code: 'TAX_ID_FORMAT',
      });
    });

    it('rechaza companyName corto: 400 COMPANY_NAME_LENGTH', async () => {
      const response = await request(http)
        .post('/customers')
        .send({ ...VALID_CUSTOMER, companyName: 'A', taxId: 'B12345674' })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'companyName',
        code: 'COMPANY_NAME_LENGTH',
      });
    });

    it('rechaza email inválido: 400 EMAIL_INVALID', async () => {
      const response = await request(http)
        .post('/customers')
        .send({
          ...VALID_CUSTOMER,
          email: 'no-es-un-email',
          taxId: 'B12345674',
        })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'email',
        code: 'EMAIL_INVALID',
      });
    });

    it('usa VALIDATION_ERROR para constraints sin código en la spec', async () => {
      const response = await request(http)
        .post('/customers')
        .send({ ...VALID_CUSTOMER, taxId: 12345 })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'taxId',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('GET /customers', () => {
    beforeAll(async () => {
      const extra = [
        {
          companyName: 'Beta Soluciones SL',
          taxId: 'B12345674',
          email: 'admin@beta.es',
          countryCode: 'ES',
          planCode: 'STARTER',
        },
        {
          companyName: 'Gamma Fundación',
          taxId: 'Q2818002D',
          email: 'info@gamma.es',
          countryCode: 'ES',
          planCode: 'PRO',
        },
        {
          companyName: 'Delta Consultores',
          taxId: '12345678Z',
          email: 'delta@delta.es',
          countryCode: 'ES',
          planCode: 'PRO',
        },
      ];
      for (const customer of extra) {
        await request(http).post('/customers').send(customer).expect(201);
      }
    });

    it('sin search lista todos con paginación por defecto', async () => {
      const response = await request(http).get('/customers').expect(200);

      const body = listBody(response);
      expect(body).toMatchObject({ total: 5, page: 1, limit: 10 });
      expect(body.items).toHaveLength(5);
    });

    it('busca por nombre sin distinción de mayúsculas', async () => {
      const response = await request(http)
        .get('/customers')
        .query({ search: 'ACME' })
        .expect(200);

      const body = listBody(response);
      expect(body.total).toBe(1);
      expect(body.items[0].companyName).toBe('Acme Ibérica SL');
    });

    it('busca por taxId con el término normalizado', async () => {
      const response = await request(http)
        .get('/customers')
        .query({ search: 'b-1234' })
        .expect(200);

      const body = listBody(response);
      expect(body.total).toBe(1);
      expect(body.items[0].taxId).toBe('B12345674');
    });

    it('pagina con page y limit', async () => {
      const response = await request(http)
        .get('/customers')
        .query({ page: 2, limit: 2 })
        .expect(200);

      const body = listBody(response);
      expect(body).toMatchObject({ total: 5, page: 2, limit: 2 });
      expect(body.items).toHaveLength(2);
    });

    it('sin coincidencias devuelve lista vacía con total 0', async () => {
      const response = await request(http)
        .get('/customers')
        .query({ search: 'zzz-no-existe' })
        .expect(200);

      expect(listBody(response)).toMatchObject({ total: 0, items: [] });
    });

    it('rechaza limit fuera de rango: 400 VALIDATION_ERROR', async () => {
      const response = await request(http)
        .get('/customers')
        .query({ limit: 100 })
        .expect(400);

      expect(errorBody(response).details?.[0]).toMatchObject({
        field: 'limit',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('GET /customers/:id', () => {
    it('devuelve el detalle con el mismo shape que la lista', async () => {
      const list = await request(http)
        .get('/customers')
        .query({ search: 'acme' })
        .expect(200);
      const id = listBody(list).items[0].id;

      const response = await request(http).get(`/customers/${id}`).expect(200);

      expect(customerBody(response)).toMatchObject({
        id,
        companyName: 'Acme Ibérica SL',
        taxId: 'B58818501',
        country: { code: 'ES', name: 'España', vatRateBps: 2100 },
        plan: { code: 'PRO', name: 'Pro' },
      });
    });

    it('devuelve 404 con el contrato de error si no existe', async () => {
      const response = await request(http)
        .get('/customers/no-existe')
        .expect(404);

      const body = errorBody(response);
      expect(body).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        path: '/customers/no-existe',
      });
      expect(body.details).toBeUndefined();
    });
  });
});
