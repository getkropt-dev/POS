import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class PgExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Default fallback
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception.message || 'Internal server error';

    // Catch Postgres specific error from PlPgSQL RAISE EXCEPTION (Code P0001)
    if (exception.code === 'P0001') {
      status = HttpStatus.BAD_REQUEST; 
      message = exception.message;
    } 
    // Catch Postgres unique violation
    else if (exception.code === '23505') {
      status = HttpStatus.CONFLICT;
      message = 'Ya existe un registro con esta información (Violación de unicidad).';
    }
    // Catch Postgres foreign key violation
    else if (exception.code === '23503') {
      status = HttpStatus.CONFLICT;
      message = 'No se puede operar sobre este registro porque está vinculado a otra entidad.';
    }

    // Capture standard NestJS HttpExceptions
    if (exception.status) {
      status = exception.status;
      message = exception.response?.message || exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
