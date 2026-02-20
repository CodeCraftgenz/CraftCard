import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

describe('AppException', () => {
  it('should create a badRequest exception', () => {
    const ex = AppException.badRequest('Invalid input', { field: 'email' });
    expect(ex.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(ex.code).toBe('BAD_REQUEST');
    const response = ex.getResponse() as { message: string; details: unknown };
    expect(response.message).toBe('Invalid input');
    expect(response.details).toEqual({ field: 'email' });
  });

  it('should create an unauthorized exception', () => {
    const ex = AppException.unauthorized();
    expect(ex.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(ex.code).toBe('UNAUTHORIZED');
  });

  it('should create a forbidden exception', () => {
    const ex = AppException.forbidden();
    expect(ex.getStatus()).toBe(HttpStatus.FORBIDDEN);
  });

  it('should create a notFound exception', () => {
    const ex = AppException.notFound('User');
    const response = ex.getResponse() as { message: string };
    expect(response.message).toBe('User nao encontrado');
  });

  it('should create a conflict exception', () => {
    const ex = AppException.conflict('Slug already taken');
    expect(ex.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('should create an internal exception', () => {
    const ex = AppException.internal();
    expect(ex.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
