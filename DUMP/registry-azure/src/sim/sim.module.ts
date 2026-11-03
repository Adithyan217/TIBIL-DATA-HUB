import {forwardRef , Module} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { simRequestsController } from './controllers/sim.controller';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.services';
import { createSimRequests } from './services/createsimrequests/createsimrequests.services';
import {CommonModule} from "../common/common.module";


@Module({
    imports: [DatabaseModule, HttpModule,  forwardRef(() => CommonModule)],
    controllers: [simRequestsController],
    providers: [createSimRequests, QueryService],
})
export class simRequestsModule {}
