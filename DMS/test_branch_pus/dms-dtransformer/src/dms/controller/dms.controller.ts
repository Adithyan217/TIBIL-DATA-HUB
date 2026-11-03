import {Body, Controller, Get, Post, Req, Res} from '@nestjs/common';
import {Response} from 'express';
import {Sym_transformerService} from '../service/sym_transformer/sym_transformer.service'
import {LoadSecretsService} from "../../loadSecrets/loadSecrets.service";
@Controller('transformer')
export class DmsController {
private readonly secrets;
constructor(private sym_transformer: Sym_transformerService,  private readonly  ls: LoadSecretsService) {
    this.secrets = this.ls.sbConfig;
}
    @Get('ping')
    ping(@Req() req: any, @Res() res) {
    res.status(200).send(`dTransformer is operational. Version: ${process.env.VERSION}`);
    }

    @Post("/serialize")
    async transformation(@Body() body, @Res() res) {
    try {
        const config = this.secrets[body.context];
            const result = await this[config.sTransformer].transformations(body, config);
            res.status(result.code).send(result);
        }
        catch(err){
            console.error(err);
            res.status(400).send({message: err.message});
        }
    }
    @Post("/serialization")
    async transformations(@Body() body, @Res() res) {
        try {
            const config = this.secrets[body.context];
            const result = await this[config.sTransformer].transformation(body, config);
            res.status(result.code).send(result);
        }
        catch(err){
            console.error(err);
            res.status(400).send({message: err.message});
        }
    }
}

