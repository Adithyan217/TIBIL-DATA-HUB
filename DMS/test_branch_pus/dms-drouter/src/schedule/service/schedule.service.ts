import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {PbacklogsService} from '../../backlogs/services/pbacklogs.service'

@Injectable()
export class ScheduleService {

    constructor(private pb: PbacklogsService    ) {
    }

    @Cron('0 */3 * * *') // Runs at minute 0 of every 3rd hour
    handleEvery3Hours() {
       this.pb.reTransactPayment();
        // Your logic here
    }

}
