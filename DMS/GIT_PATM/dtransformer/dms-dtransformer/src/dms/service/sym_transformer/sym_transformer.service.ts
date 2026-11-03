import { Injectable } from '@nestjs/common';
import {symEncryptor } from '../../utils/encryptionUtils';
import {symDecryptor} from '../../utils/decryptionUtils';
import {transform, replacePlaceholder} from '../../utils/transformer';


@Injectable()
export class Sym_transformerService {

    constructor() {}



     public transformations = async (body, config) => {
         try {

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


}
