import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {WinstonLoggerService} from "../common/winstonlogger/winstonlogger.service";
@Injectable()
export class RequestCounterMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, protected wl:WinstonLoggerService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'POST') {
      try {
        let currentCount = await this.cacheManager.get<number>('rcount');
        currentCount = currentCount || 0; 
        const updatedCount = currentCount + 1;
        await this.cacheManager.set('rcount', updatedCount);
        this.wl.log(`Number of requests for /intel/metrics: ${updatedCount}, ${new Date()}`);
      } catch (err) {
        this.wl.error('Error updating request count:', err);
      }
    }
    next();
  }
}
