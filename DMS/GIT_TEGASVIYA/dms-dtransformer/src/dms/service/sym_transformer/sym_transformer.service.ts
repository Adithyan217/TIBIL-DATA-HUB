import {HttpStatus , Injectable} from '@nestjs/common';
import {symEncryptor } from '../../utils/encryptionUtils';
import {symDecryptor} from '../../utils/decryptionUtils';
import {transform, replacePlaceholder} from '../../utils/transformer';
import transformer from '../../utils/transformer';


@Injectable()
export class Sym_transformerService {

    constructor() {}



     public transformations = async (body, config) => {
         try {
             if (!config?.topic?.replacer) {
                 return {
                     code: 400,
                     message: 'Missing necessary configuration parameters',
                 };
             }
             if (!body?.data?.payload) {
                 return {
                     code: 400,
                     message: 'Invalid payload data',
                 };
             }

             let decryption = await symDecryptor(body.data.payload, config.security);
             if (decryption.code == 200) {


                if(config?.dTransform_config?.moneyFormat == "paisa"){
                    decryption.data.txnAmt = String(decryption.data.txnAmt * 100)
                    console.log('paisa :: ', decryption.data.txnAmt);
                }
                 const sTransformation = await transform(decryption.data, config.sTransform_config);
                 const sEncrypted = await symEncryptor(JSON.stringify(sTransformation.data), config.security);
                 decryption.data.cache_pid = `${body.data.cache_pid}`
                 
                 const dTransformation = await transform(decryption.data, config.dTransform_config);
                 const topic = await replacePlaceholder(config?.topic?.url,config.topic.replacer,  body.data.did)


                 return {
                     code: 200,
                     data: {
                         decrypted_request: decryption.data,
                         encrypted_response: {data: sEncrypted.data},
                         mqtt_request: dTransformation.data,
                         mqtt_topic: topic.data,
                     }
                 }
             }
             else{
                 return {
                     code: 400,
                     message: decryption.message,
                 }
             }
         }
         catch (e) {
             return {
                 code: 400,
                 message: e.message,
             }
         }
     }

    transformation = async (body, config) => {
       try{
           const data = {};

           for (const flow of config[body.contextFlow]) {
               const result = await this[flow.fn](body, config);
               data[flow.rKey] = result;
           }

           return { code: HttpStatus.OK, data };
       }
       catch (e) {
           return {
               code: HttpStatus.INTERNAL_SERVER_ERROR, message: e.message
           }
       }

    };


    async languageTransform(body, config) {
        try{
           const trans  =  await transform(body.data, config.language);
           return trans.data;
        }
        catch (e) {

        }
    }
   languageTopicReplacer = async (body, config) => {
        try{
            const topic = await replacePlaceholder(config?.language?.topic?.url,config?.language.topic.replacer,  body?.data?.imei);
            return topic.data;
        }
        catch (e) {
        }
    }

    dPayloadTransformer = async (body, config) => {
        const transformation = await transform(body.data, config.dTransform_config);
        return transformation.data;
    }
    payloadTopicReplacer = async (body, config) => {
        const topic = await replacePlaceholder(config?.topic?.url,config.topic.replacer,  body.data.deviceId);
        return topic.data;
    }

    encryptionTransformer = async (body, config) => {
        try{
            const sEncrypted = await symEncryptor(JSON.stringify(body.data), config.security);
            return {data: sEncrypted.data};
        }
        catch (e) {
            return {code: HttpStatus.INTERNAL_SERVER_ERROR, message: e.message};
        }
    }
}
