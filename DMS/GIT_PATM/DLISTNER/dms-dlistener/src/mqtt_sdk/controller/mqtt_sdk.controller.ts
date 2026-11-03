import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { MqttSdkService } from '../services/mqtt_sdk.service';
import { MqttMsgLogService } from '../services/cwd-mqtt/mqtt-listener.service';
import { txnDetails } from '../services/interfaces/dlistener.interface';
import { broker_device_msg } from '../services/enums/mqtt-msg.enum';
@Controller('dlistener')
export class MqttSdkController {

  constructor(private readonly service: MqttSdkService, 
    private readonly mqttMsgLogService: MqttMsgLogService
  ) {}

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

  @Post('blog')
  async logBroadcastMsg(@Body() body: txnDetails, @Res() res: Response) {
    try {
      const { rrn, money, imei } = body;

    if (!rrn || !money) {
      return { success: false, error: 'Topic and message are required' };
    }
    const result = await this.mqttMsgLogService.logMsgIntoBlog(rrn, money, imei, broker_device_msg.PUSHED_NOTIF_TO_FB );
     return res.status(result.status).send(result?.data);
    } catch (error) {
      res.status(500).send({ message: error.message || 'An unexpected error occurred' })
    }
    
    
  }
}
