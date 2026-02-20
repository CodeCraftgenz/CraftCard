import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: HttpStatus, code: string, message: string, details?: unknown) {
    super({ code, message, details }, status);
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new AppException(HttpStatus.BAD_REQUEST, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Nao autorizado') {
    return new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Acesso negado') {
    return new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Recurso') {
    return new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', `${resource} nao encontrado`);
  }

  static conflict(message: string) {
    return new AppException(HttpStatus.CONFLICT, 'CONFLICT', message);
  }

  static tooManyRequests(message = 'Muitas requisicoes, tente novamente mais tarde') {
    return new AppException(HttpStatus.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Erro interno do servidor') {
    return new AppException(HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', message);
  }

  static payloadTooLarge(message = 'Arquivo muito grande') {
    return new AppException(HttpStatus.PAYLOAD_TOO_LARGE, 'PAYLOAD_TOO_LARGE', message);
  }
}
