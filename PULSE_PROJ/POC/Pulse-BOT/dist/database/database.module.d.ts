import { OnModuleDestroy } from '@nestjs/common';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';
export declare class DatabaseModule implements OnModuleDestroy {
    private readonly wl;
    private readonly logger;
    constructor(wl: WinstonLoggerService);
    onModuleDestroy(): Promise<void>;
}
