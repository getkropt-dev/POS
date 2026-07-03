"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let PgExceptionFilter = class PgExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = exception.message || 'Internal server error';
        if (exception.code === 'P0001') {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = exception.message;
        }
        else if (exception.code === '23505') {
            status = common_1.HttpStatus.CONFLICT;
            message = 'Ya existe un registro con esta información (Violación de unicidad).';
        }
        else if (exception.code === '23503') {
            status = common_1.HttpStatus.CONFLICT;
            message = 'No se puede operar sobre este registro porque está vinculado a otra entidad.';
        }
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
};
exports.PgExceptionFilter = PgExceptionFilter;
exports.PgExceptionFilter = PgExceptionFilter = __decorate([
    (0, common_1.Catch)()
], PgExceptionFilter);
//# sourceMappingURL=pg-exception.filter.js.map