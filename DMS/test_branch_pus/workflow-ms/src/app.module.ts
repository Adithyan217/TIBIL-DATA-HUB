import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RequestsModule } from "./requests/requests.module";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { LoadSecretsService } from './load-secrets/load-secrets.service';
import { AuthMiddleware } from 'dms-middleware-auth';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
            imports: [
                RequestsModule,
                ConfigModule.forRoot({
                                         isGlobal: true,
                                     }),
                DatabaseModule,
                HttpModule,
                CacheModule.register(),
            ],
            controllers: [AppController],
            providers: [
                AppService,
                LoadSecretsService,

                {
                    provide: 'AUTH_MIDDLEWARE_OPTIONS',
                    useFactory: (configService: ConfigService) => ({
                        publicKey: configService.get<string>('PUBLIC_TOKEN'),
                        keycloakUrl: configService.get<string>('AXIOS_URL'),
                        realm: configService.get<string>('REALMS'),
                        clientId: configService.get<string>('CLIENT_ID'),
                        clientSecret: configService.get<string>('CLIENT_SECRETS'),
                        clientUuid: configService.get<string>('CLIENT_UUID'),
                    }),
                    inject: [ConfigService],
                },
            ],
        })
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .exclude({ path: '/:params/ping', method: RequestMethod.ALL }) // Example of excluding a route from middleware
            .forRoutes('*'); // Apply to all routes
    }
}
