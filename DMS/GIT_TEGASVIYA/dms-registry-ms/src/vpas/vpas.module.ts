import {forwardRef , Module} from '@nestjs/common';
import { CommonService } from 'src/common/service/common.service';
import { CommonqueryService} from "../common/service/commonquery.service";
import {DatabaseModule} from "../database/database.module";
import {HttpModule} from "@nestjs/axios";
import {vpaController} from "./controllers/vpa/vpa.controller";
import { onboardVpaService } from './services/onboardvpa/onboardvpa.services';
import { QueryService } from './services/query/query.service';
import {CommonModule} from "../common/common.module";


@Module({
    imports: [DatabaseModule, HttpModule,  forwardRef(() => CommonModule)],
    controllers: [vpaController],
    providers: [onboardVpaService, CommonService, CommonqueryService, QueryService],
})
export class VpasModule {}
