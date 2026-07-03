import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class PgExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost): void;
}
