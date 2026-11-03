import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { MqttSdkService } from '../services/mqtt_sdk.service';
@Controller('ptransit')
export class MqttSdkController {

  constructor(private readonly service: MqttSdkService) {}

  @Get('ping')
  public ping(@Res() res: Response) {
    res.status(200).send(`dlistener operational version is::${process.env.MAJOR_VERSION}.${process.env.MINOR_VERSION}`);
  }

  @Post('publish')
  async publishMessage(@Body() body: { topic: string; message: object }) {
    const { topic, message } = body;

    if (!topic || !message) {
      return { success: false, error: 'Topic and message are required' };
    }

    this.service.publishMessage(topic, message);
    return { success: true, message: 'Message published successfully' };
  }

  @Post('')
  async getResponse(@Body() body: { topic: string; message: object }) {
    return { success: true, message: 'Message published successfully' };
  }
}
