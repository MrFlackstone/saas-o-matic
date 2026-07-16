import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ErrorResponseDto } from './dto/error-response.dto';
import { HttpExceptionFilter } from './http-exception.filter';

interface CapturedResponse {
  statusCode?: number;
  body?: ErrorResponseDto;
}

function buildHost(url: string, captured: CapturedResponse): ArgumentsHost {
  const response = {
    status: (statusCode: number) => {
      captured.statusCode = statusCode;
      return {
        json: (body: ErrorResponseDto) => {
          captured.body = body;
        },
      };
    },
  };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let captured: CapturedResponse;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    captured = {};
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('produce el contrato completo para payload objeto con details', () => {
    const exception = new BadRequestException({
      message: 'Validación fallida',
      details: [{ field: 'taxId', code: 'TAX_ID_INVALID', message: 'x' }],
    });

    filter.catch(exception, buildHost('/customers', captured));

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validación fallida',
      details: [{ field: 'taxId', code: 'TAX_ID_INVALID', message: 'x' }],
      path: '/customers',
    });
    expect(typeof captured.body?.timestamp).toBe('string');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('acepta payload string y mapea estados sin nombre conocido a "Error"', () => {
    filter.catch(
      new HttpException('texto plano', 418),
      buildHost('/x', captured),
    );

    expect(captured.body).toMatchObject({
      statusCode: 418,
      error: 'Error',
      message: 'texto plano',
    });
    expect(captured.body?.details).toBeUndefined();
  });

  it('une message array con "; "', () => {
    filter.catch(
      new BadRequestException({ message: ['a', 'b'] }),
      buildHost('/x', captured),
    );

    expect(captured.body?.message).toBe('a; b');
  });

  it('convierte errores no-HTTP en 500 con el contrato y los loguea', () => {
    const unexpected = new Error('boom');

    filter.catch(unexpected, buildHost('/customers', captured));

    expect(captured.statusCode).toBe(500);
    expect(captured.body).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Error interno',
      path: '/customers',
    });
    expect(captured.body?.details).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
