import { Module } from '@nestjs/common';
import {UserController} from "./controller/user.controller";
import {UserService} from "./services/user.service";
import {  HttpModule} from '@nestjs/axios'
import { OnboarduserService } from './services/onboarduser/onboarduser.service';
import { KeycloakService } from './services/keycloak/keycloak.service';
import {LoadSecretsService} from "../loadSecrets/loadSecrets.service";
import {WinstonLoggerService} from "./services/winstonlogger/winstonlogger.service";


@Module({
    imports: [HttpModule] ,
    controllers: [UserController],
    providers: [UserService,LoadSecretsService, OnboarduserService, KeycloakService, WinstonLoggerService],

})export class UserModule {}
