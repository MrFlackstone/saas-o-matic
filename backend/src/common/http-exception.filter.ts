import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from './dto/error-response.dto';
import { ValidationDetailDto } from './dto/validation-detail.dto';

const ERROR_NAMES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

interface ExceptionPayload {
  message?: string | string[];
  details?: ValidationDetailDto[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
    }

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const { message, details } = extractPayload(exception);

    const body: ErrorResponseDto = {
      statusCode,
      error: ERROR_NAMES[statusCode] ?? 'Error',
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    response.status(statusCode).json(body);
  }
}

function extractPayload(exception: unknown): {
  message: string;
  details?: ValidationDetailDto[];
} {
  if (!(exception instanceof HttpException)) {
    return { message: 'Error interno' };
  }
  const payload = exception.getResponse();
  if (typeof payload === 'string') {
    return { message: payload };
  }
  const { message, details } = payload as ExceptionPayload;
  return {
    message: Array.isArray(message)
      ? message.join('; ')
      : (message ?? exception.message),
    details,
  };
}
