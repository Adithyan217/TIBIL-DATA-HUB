import {forwardRef , Module} from '@nestjs/common';
import {AggregatorService} from "./service/aggregator.service";
import {AggregatorController} from "./controller/aggregator.controller";
import {DatabaseModule} from "../database/database.module";

@Module({
    imports: [forwardRef(() =>DatabaseModule ) ],
    providers: [AggregatorService],
    controllers: [AggregatorController],
    })
export class AggregatorModule {

}
