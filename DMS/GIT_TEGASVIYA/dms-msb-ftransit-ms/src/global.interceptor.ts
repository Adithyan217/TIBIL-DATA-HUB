import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
// import {WinstonLoggerService} from '../intel/services/winstonlogger/winstonlogger.service'

@Injectable()
export class GlobalInterceptor implements NestInterceptor {
    private readonly logger = new Logger(GlobalInterceptor.name);
    // private logger = new WinstonLoggerService();

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;

        this.logger.log(`Request: ${method} ${url}`);

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;
                const delay = Date.now() - now;
                this.logger.log(`Response: ${statusCode} for ${method} ${url} - ${delay}ms`);
            }),
        );
    }
}