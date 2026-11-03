import { Module } from '@nestjs/common';
import {RoutesController} from "./controller/routes.controller";
import {RoutesService} from "./services/routes.service";
import {RoutesQueryService} from "./services/routes-query/routes-query.service";
import {DatabaseModule} from "../database/database.module";
import {HttpModule} from "@nestjs/axios";

@Module({
    imports: [DatabaseModule, HttpModule],
    controllers: [RoutesController],
    providers: [RoutesService, RoutesQueryService],
})
export class RouteModule {

}
