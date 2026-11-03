import {HttpStatus , Inject , Injectable} from '@nestjs/common';
import {AwsmqttService} from "../../../common/service/mqtt/awsmqtt.service";
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
import {updateGeneratedCount} from "../../../certificates/services/queries/queries";
import {QueryService} from '../query/query.services';
import {HttpService} from "@nestjs/axios";
import {lastValueFrom} from "rxjs";
import {Pool} from 'pg'
import { CODE, generateResponse, MESSAGE } from '../../../common/enum/common.enum';

@Injectable()
export class PatchdeviceService {


    constructor( @Inject('DATABASE_POOL') private readonly pool: Pool, private readonly AWS_IOT_CORE: AwsmqttService, private readonly wl: WinstonLoggerService, private https: HttpService, private readonly qs: QueryService ) { }


    async updateDevice(data){
        try{
            const queryStr = await this.qs.updateDevice(data);
            const result = await this.pool.query(queryStr.query, queryStr.values);

            if(result.rowCount > 0){
                if(data?.edetails[0]?.lang){
                    await this.updateLanguage(data);
                }

                const headers = Object.keys(result.rows[0]);
                const values = result.rows.map(row => headers.map(header => row[header]));
                const totalRows = result.rows.length;
                const successfullyInserted = result.rows.filter(row => row.status === 1).length;
                const failedInserted = result.rows.filter(row => row.status === 0).length;
                const status = [totalRows, successfullyInserted, failedInserted];

                return generateResponse(200, CODE.SUCCESS, result.rows,
                    {
                        message: "Updated Successfully",
                        edata: {
                                headers,
                                values,
                                status
                                }
                       }
                );
            }
            else {
                return generateResponse(200, CODE.ERROR, MESSAGE.INVALID);
            }
        }
        catch (e) {
            this.wl.error(e.message);
            return generateResponse(500, CODE.ERROR, e.message);
        }
    }

    unixTimestamp = (date = Date.now()) =>  {
        return Math.floor(date / 1000)
    }
    async updateLanguage(data) {


        try {
            const {query , values} = await this.qs.getDeviceRoutes( data?.edetails[0]?.device_id );
            const deviceRes = await this.pool.query( query , values );
            if (deviceRes.rows.length > 0) {

            const body = {
                context : deviceRes.rows[0].rcontext ,
                data : {"trans_id" : data.eid , "ln" : data?.edetails[0]?.lang , "imei" : deviceRes.rows[0].imei, time_stamp:  this.unixTimestamp()} ,
                contextFlow : "language_flow"
            }
            const url = `${process.env['AXIOS-URL']}/transformer/serialization`;

            const result = await lastValueFrom( this.https.post( url , body ) )
            if (result.status === HttpStatus.OK) {
                await this.mqttWorkflowHandler( result.data?.data?.language_request , result.data?.data?.mqtt_topic );
            }
            return {status: true}
        }
        }
        catch (error) {
            return {status: false}
            this.wl.error(`updateLanguage() - ${error.message}`);
        }
    }

    async mqttWorkflowHandler(mqtt_payload: any, topic: any) {
        try {
            return await this[process.env['MQTT-BROKER']].publishMessage(topic, mqtt_payload);

        } catch (error) {
            this.wl.error("Error in MQTT Handler is:::", error);
        }
    }



    async simulatePayments(data) {
        try {
            const {query , values} = await this.qs.getDeviceRoutes( data?.edetails[0]?.device_id );
            const deviceRes = await this.pool.query( query , values );
            if (deviceRes.rows.length > 0) {

            const body = {
                context : deviceRes.rows[0].rcontext ,
                data : {"cache_pid" : 'Simulate'+data.eid , "deviceId" : deviceRes.rows[0].imei, "txnAmt": data?.edetails[0]?.txt_amt } ,
                contextFlow : "simulate_payment_flow"
            }
            const url = `${process.env['AXIOS-URL']}/transformer/serialization`;

            const result = await (await lastValueFrom( this.https.post( url , body ))).data
            if (result.code === HttpStatus.OK) {
                const success:any = await this.mqttWorkflowHandler( result?.data?.payload_request , result?.data?.mqtt_topic );
                if( success ){
                    return generateResponse(HttpStatus.OK, CODE.SUCCESS, [], {
                        message: 'Simulated payment successfully',
                        edata: {
                            headers:["device_id" , "announcement_message", "status" ],
                            values:[[deviceRes.rows[0].dname,`Test message. Test transaction amount is ${data?.edetails[0]?.txt_amt} rupees`, "Success"]],
                            status:[1,1,0]
                        }
                    }); 
                }
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, [], {
                    message: 'Simulated payment successfully',
                    edata: {
                        headers:["device_id" , "announcement_message", "status" ],
                        values:[[deviceRes.rows[0].device_id,`Test message. Test transaction amount is ${data?.edetails[0]?.txt_amt} rupees`, "Failure"]],
                        status:[1,0,1]
                    }
                });
            }

        }
        }
        catch (error) {
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.ERROR, error.messsage);
            this.wl.error(`testpayments() - ${error.message}`);
        }
    }
}
