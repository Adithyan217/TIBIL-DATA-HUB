import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Sym_transformerService } from '../service/sym_transformer/sym_transformer.service';

@Controller('transformer')
export class DmsController {
  private readonly secrets: Record<string, any>;

  constructor(
    private readonly sym_transformer: Sym_transformerService,
    private readonly configService: ConfigService,
  ) {
    const env = this.configService.get<string>('ENVIRONMENT');
    const rawSecret = this.configService.get<string>(`${env}-apprunner-dsconfigms`);

    if (!rawSecret) {
      throw new Error(`Secret ${env}-apprunner-dsconfigms not found in environment variables`);
    }

    try {
      const parsedOuter = JSON.parse(rawSecret);
      this.secrets = {};

      // Parse each context string into an object
      for (const key in parsedOuter) {
        try {
          this.secrets[key] = JSON.parse(parsedOuter[key]);
        } catch (innerErr) {
          throw new Error(`Failed to parse inner secret for key ${key}: ${innerErr.message}`);
        }
      }

    } catch (e) {
      throw new Error(`Failed to parse secret ${env}-apprunner-dsconfigms: ${e.message}`);
    }
  }

  @Get('ping')
  ping(@Req() req: any, @Res() res: Response) {
    res
      .status(200)
      .send(`dTransformer is operational. Version: ${process.env.VERSION}`);
  }

  @Post('/serialize')
  async transformation(@Body() body, @Res() res: Response) {
  console.log('Incoming request context:', body.context);

    try {

      const config = this.secrets[body.context];

      if (!config) {
        throw new Error(`No configuration found for context: ${body.context}`);
      }

      const result = await this.sym_transformer.transformations(body, config);

      res.status(result.code).send(result);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  }

  @Post('/serialization')
  async transformations(@Body() body, @Res() res: Response) {
    try {

      const config = this.secrets[body.context];

      if (!config) {
        throw new Error(`No configuration found for context: ${body.context}`);
      }

      const result = await this.sym_transformer.transformation(body, config);

      res.status(result.code).send(result);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  }
}
