import { Body, Controller, Delete, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { MqttSdkService } from '../services/mqtt_sdk.service';
import { MqttListenerService } from '../services/mqtt-listener/mqtt-listener.service';
@Controller('ptransit')
export class MqttSdkController {

  constructor(private readonly service: MqttSdkService, public cwd_mqtt: MqttListenerService) {}

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

  @Post('devices')
  async getResponse(@Body() body:any, @Res() res: Response) {
    const result = await this.cwd_mqtt.addDeviceRecordsIntoFile(body?.devices)
    if(result){
      res.status(200).send({code: 2000, message: "Devices insertion successful"})
    }else{
      res.status(400).send({code: 2000, message: "Could not add device"})
    }
  }

  @Delete('devices')
  async deleteDevices(@Body() body:any, @Res() res: Response) {
    const result = await this.cwd_mqtt.removeDeviceFromFile(body?.devices)
    if(result){
      res.status(200).send({code: 2000, message: "Devices deletion successful"})
    }else{
      res.status(400).send({code: 2000, message: "Could not add device"})
    }
  }
}
