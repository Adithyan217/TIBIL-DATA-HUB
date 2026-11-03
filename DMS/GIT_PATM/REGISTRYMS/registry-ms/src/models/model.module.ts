import {forwardRef , Module} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { modelController } from './controllers/model/model.controller';
import { onboardModelService } from './services/onboardmodel/onboardmodel.services';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.service';
import { CommonModule } from 'src/common/common.module';

@Module({
    imports: [DatabaseModule, HttpModule, forwardRef(() => CommonModule)],
    controllers: [modelController],
    providers: [onboardModelService, QueryService ],
})
export class ModelsModule {}
