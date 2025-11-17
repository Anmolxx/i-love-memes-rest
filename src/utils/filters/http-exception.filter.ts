import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errors: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = responseObj.message || exception.message;
        errors = responseObj.errors;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      // Log unexpected errors for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      message = exception.message || 'Internal server error';
    } else {
      // Log unknown exception types
      this.logger.error('Unknown exception type', exception);
    }

    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // Only include errors field if it exists
    if (errors !== undefined) {
      errorResponse.errors = errors;
    }

    response.status(status).json(errorResponse);
  }
}
