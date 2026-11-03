import { Module } from '@nestjs/common';
import {Sym_transformerService} from "./service/sym_transformer/sym_transformer.service";

import { DmsController } from './controller/dms.controller';

// @ts-ignore
@Module({

    controllers: [DmsController],
    providers: [Sym_transformerService]
        })
export class DmsModule {}
