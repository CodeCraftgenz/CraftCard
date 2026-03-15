import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppException } from './app.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, code, message, details } = this.resolveException(exception);

    if (status >= 500) {
      this.logger.error(`[${code}] ${message}`, exception instanceof Error ? exception.stack : '');
    } else {
      this.logger.warn(`[${code}] ${message}`);
    }

    // Guard against double-response (e.g. when res was already sent manually)
    if (response.headersSent) return;

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    });
  }

  private resolveException(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof AppException) {
      const response = exception.getResponse() as { code: string; message: string; details?: unknown };
      return {
        status: exception.getStatus(),
        code: response.code,
        message: response.message,
        details: response.details,
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: 'TOO_MANY_REQUESTS',
        message: 'Muitas requisicoes. Tente novamente em instantes.',
      };
    }

    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: exception.flatten().fieldErrors,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`Prisma validation error: ${exception.message}`);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Erro de validacao do banco de dados. Tente novamente.',
      };
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(`Prisma initialization error: ${exception.message}`);
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Banco de dados temporariamente indisponivel. Tente novamente em instantes.',
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: string | string[] }).message || 'Erro';
      return {
        status: exception.getStatus(),
        code: 'HTTP_ERROR',
        message: Array.isArray(message) ? message[0] : message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
    };
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'Registro duplicado',
          details: { fields: (error.meta as { target?: string[] })?.target },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Registronão encontrado',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_ERROR',
          message: 'Referencia invalida',
        };
      case 'P2010':
        this.logger.error(`Raw query failed: ${error.message}`);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: 'Erro ao consultar banco de dados. Tente novamente.',
        };
      default:
        this.logger.error(`Prisma error ${error.code}: ${error.message}`);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: 'Erro de banco de dados. Tente novamente.',
        };
    }
  }
}
