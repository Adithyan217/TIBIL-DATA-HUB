import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { CommonService } from './service/common.service';
import { CommonqueryService } from './service/commonquery.service';
import { CommonController } from './controller/common.controller';

@Module({
    imports: [DatabaseModule, HttpModule],
    controllers: [CommonController],
    providers: [ CommonqueryService, CommonService],
    exports:[CommonqueryService, CommonService]
})
export class commonModule {}
