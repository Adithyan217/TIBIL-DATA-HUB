import { Module } from '@nestjs/common';
import {Sym_transformerService} from "./service/sym_transformer/sym_transformer.service";

import { LoadSecretsService } from 'src/loadSecrets/loadSecrets.service';
import { DmsController } from './controller/dms.controller';

// @ts-ignore
@Module({

    controllers: [DmsController],
    providers: [Sym_transformerService,  LoadSecretsService]
        })
export class DmsModule {}
