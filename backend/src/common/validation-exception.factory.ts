import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ValidationDetailDto } from './dto/validation-detail.dto';

export const FALLBACK_VALIDATION_CODE = 'VALIDATION_ERROR';

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const details = errors.flatMap((error) => toDetails(error));
  return new BadRequestException({ message: 'Validación fallida', details });
}

export function singleFieldValidationException(
  field: string,
  code: string,
  message: string,
): BadRequestException {
  const details: ValidationDetailDto[] = [{ field, code, message }];
  return new BadRequestException({ message: 'Validación fallida', details });
}

function toDetails(
  error: ValidationError,
  parentPath = '',
): ValidationDetailDto[] {
  const field = parentPath ? `${parentPath}.${error.property}` : error.property;
  const own = Object.entries(error.constraints ?? {}).map(
    ([constraintKey, message]) => ({
      field,
      code: constraintCode(error, constraintKey),
      message,
    }),
  );
  const nested = (error.children ?? []).flatMap((child) =>
    toDetails(child, field),
  );
  return [...own, ...nested];
}

function constraintCode(error: ValidationError, constraintKey: string): string {
  const context = error.contexts?.[constraintKey] as
    { code?: string } | undefined;
  return context?.code ?? FALLBACK_VALIDATION_CODE;
}
