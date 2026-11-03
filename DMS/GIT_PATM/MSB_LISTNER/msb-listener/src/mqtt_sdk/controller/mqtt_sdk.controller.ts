import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { MqttSdkService } from '../services/mqtt_sdk.service';
import { MqttMsgLogService } from '../services/cwd-mqtt/mqtt-listener.service';
import { mListener, txnDetails } from '../services/interfaces/dlistener.interface';
import { broker_device_msg } from '../services/enums/mqtt-msg.enum';
@Controller('mlistener')
export class MqttSdkController {

  constructor(private readonly service: MqttSdkService, 
    private readonly mqttMsgLogService: MqttMsgLogService
  ) {}

  @Get('ping')
  public ping(@Res() res: Response) {
    res.status(200).send(`msb-listener operational version is::${process.env.MAJOR_VERSION}.${process.env.MINOR_VERSION}`);
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

  @Post('subscription')
  async subscribeToTopic(@Body() body: mListener, @Res() res: Response) {
    try {
     
    if (!body?.mfname) {
      return res.status(400).send({ success: false, error: 'Manufacturer name is required' });
    }
    const { mfname , imei } = body;
    const result = await this.mqttMsgLogService.getTopicForManufacturer(mfname, imei);
    res.status(result.status).send(result?.data);
    } catch (e) {
      res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
    }
  }

  
}
