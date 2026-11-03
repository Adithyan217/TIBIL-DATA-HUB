import {Inject , Injectable} from '@nestjs/common';
// import * as AWS from 'aws-sdk';
import {S3Client, PutObjectCommand, GetObjectCommand} from '@aws-sdk/client-s3';
import {IoTClient, DescribeThingCommand, CreateThingCommand, AddThingToThingGroupCommand, UpdateThingCommand, CreateKeysAndCertificateCommand, AttachPolicyCommand, AttachThingPrincipalCommand, ResourceNotFoundException } from '@aws-sdk/client-iot';
import {getAvailableCertificateCountAndMaxLimit, checkCertExists, addDeviceCertificateReq, updateGeneratedCount} from '../queries/queries';
import {Pool} from 'pg'
 import  {WinstonLoggerService} from '../../../common/service/winstonlogger/winstonlogger.service'
import {CODE} from "../../../common/enum/common.enum";
import { createHash, createCipheriv, createDecipheriv } from 'crypto';
import {query} from "express";
import { Readable } from 'stream';

@Injectable()
export class CertificatesService {
    // private iotClient: AWS.Iot;
    // private s3Client: AWS.S3;
    private readonly s3Client: S3Client;
    private readonly iotClient: IoTClient;

    // private readonly BUCKET_NAME = 'production-dms-awsiot-certs';
    // private readonly PREFIX = process.env.env +  'PREFIX';
    constructor(private readonly wl: WinstonLoggerService,  @Inject('DATABASE_POOL') private readonly pool: Pool) {
       /* AWS.config.update({ region: 'ap-south-1' });
        this.iotClient = new AWS.Iot();
        this.s3Client = new AWS.S3();*/
        this.s3Client = new S3Client({ region: 'ap-south-1' });
        this.iotClient = new IoTClient({ region: 'ap-south-1' });
    }


   /* async getDeviceCertificate(deviceId: string) {
        this.wl.log(`Processing certificate for deviceId: ${deviceId}`);

        const certKeyPath = `${this.PREFIX}/${deviceId}/certificate.pem`;
        const keyKeyPath = `${this.PREFIX}/${deviceId}/private.key`;

        let certificatePem: string;
        let privateKey: string;

        // Check if certs exist in S3
        const certExists = await this.objectExists(this.BUCKET_NAME, certKeyPath);
        const keyExists = await this.objectExists(this.BUCKET_NAME, keyKeyPath);

        if (certExists && keyExists) {
            this.wl.log(`Certificates found in S3 for ${deviceId}, fetching...`);
            const certObj = await this.s3Client.getObject({ Bucket: this.BUCKET_NAME, Key: certKeyPath }).promise();
            certificatePem = certObj.Body.toString('utf-8');

            const keyObj = await this.s3Client.getObject({ Bucket: this.BUCKET_NAME, Key: keyKeyPath }).promise();
            privateKey = keyObj.Body.toString('utf-8');
        } else {
            this.wl.log( `Certificates not found. Creating new ones for ${deviceId}` );

            // Check if Thing exists
            try {
                await this.iotClient.describeThing( {thingName : deviceId} ).promise();
            } catch (err: any) {
                if (err.code === 'ResourceNotFoundException') {
                    await this.iotClient.createThing( {thingName : deviceId}).promise();
                    await this.iotClient.addThingToThingGroup({
                                                                   thingGroupName : 'PROD-DMS' ,
                                                                   thingName : deviceId
                                                               }).promise();
                    await this.iotClient.updateThing({
                                                          thingName : deviceId ,
                                                          attributePayload : {attributes : {manufacturer : 'demo'}} ,
                                                      }).promise();
                }else{
                    throw err;
                }
            }

            const certResponse = await this.iotClient.createKeysAndCertificate({ setAsActive: true }).promise();
            certificatePem = certResponse.certificatePem;
            privateKey = certResponse.keyPair.PrivateKey;
            const certificateArn = certResponse.certificateArn;

            await this.iotClient.attachPolicy({ policyName: 'PROD-DMS-POLICY', target: certificateArn }).promise();
            await this.iotClient.attachThingPrincipal({ thingName: deviceId, principal: certificateArn }).promise();

            // Upload certs to S3
            await this.s3Client.putObject({
                                              Bucket: this.BUCKET_NAME,
                                              Key: certKeyPath,
                                              Body: certificatePem,
                                          }).promise();
            await this.s3Client.putObject({
                                              Bucket: this.BUCKET_NAME,
                                              Key: keyKeyPath,
                                              Body: privateKey,
                                          }).promise();

            this.wl.log(`Stored certificates in S3 for ${deviceId}`);
        }

        // AES Key derived from MD5 hash of deviceId
        const aesKey = crypto.createHash('md5').update(deviceId).digest();

        const encryptedCert = this.encryptData(certificatePem, aesKey);
        const encryptedKey = this.encryptData(privateKey, aesKey);

        return {
            certificate: encryptedCert,
            privateKey: encryptedKey,
        };
    }
*/


    async checkTheLimit(mfname) {
        try{
            const limitStr = await getAvailableCertificateCountAndMaxLimit(mfname);
            const limitResult =await this.pool.query(limitStr.queryStr, limitStr.values);

            return {status: limitResult.rows[0].generated_cert_count <= limitResult.rows[0].max_cert_limit ? true : false, bucketName: limitResult.rows[0].s3bkt, mfid:  limitResult.rows[0].mfid}

        }catch(error){
            this.wl.log(`checkTheLimit() ->  ${error.message}`);
            return {status: false};
        }
    }
    async checkDeviceCertExists(mfname, deviceId){
      try{
            const deviceCertExistsStr = await  checkCertExists( mfname, deviceId );
            const deviceCertExistsResult  = await this.pool.query(deviceCertExistsStr.queryStr, deviceCertExistsStr.values);
            if (deviceCertExistsResult.rows.length > 0){

                return {
                    status: CODE.SUCCESS,
                    device: deviceCertExistsResult.rows
                };
            }
            return {
                status: CODE.INVALID,
                device: []
            }
      }
        catch (e) {
          this.wl.log(`checkDeviceCertExists() ->  ${e.message}`);
            return {
                status: CODE.ERROR,
                device: []
            }
        }
    }
    
    async addDeviceCertificateReq(mfid, did) {
        try{
            const addCertStr = await addDeviceCertificateReq(mfid, did);
            const addCertResult = await this.pool.query(addCertStr.queryStr, addCertStr.values);
            if(addCertResult.rows.length > 0){
                return true;
            }
            else return  false;
        }catch (e) {
            this.wl.log(`addDeviceCertificate() ->  ${e.message}`);
            return false;
        }
    }

    async createThingAndAttach(deviceId: string, mf: string) {
        let certificatePem: string;
        let privateKey: string;

        try {
            await this.iotClient.send(new DescribeThingCommand({ thingName: deviceId }));
        } catch (err: any) {
            if (err.name === 'ResourceNotFoundException') {
                await this.iotClient.send(new CreateThingCommand({ thingName: deviceId }));

                await this.iotClient.send(
                    new AddThingToThingGroupCommand({
                                                        thingGroupName: process.env.THING_GROUP_NAME!,
                                                        thingName: deviceId,
                                                    })
                );

                await this.iotClient.send(
                    new UpdateThingCommand({
                                               thingName: deviceId,
                                               attributePayload: { attributes: { manufacturer: mf } },
                                           })
                );
            } else {
                this.wl.error(err.message);
                throw err;
            }
        }

        const certResponse = await this.iotClient.send(
            new CreateKeysAndCertificateCommand({ setAsActive: true })
        );

        certificatePem = certResponse.certificatePem!;
        privateKey = certResponse.keyPair!.PrivateKey!;
        const certificateArn = certResponse.certificateArn!;

        await this.iotClient.send(
            new AttachPolicyCommand({
                                        policyName: process.env.IOT_POLICY!,
                                        target: certificateArn,
                                    })
        );

        await this.iotClient.send(
            new AttachThingPrincipalCommand({
                                                thingName: deviceId,
                                                principal: certificateArn,
                                            })
        );

        return { certificatePem, privateKey };
    }

    async uploadCertToS3(
        certificatePem: string,
        privateKey: string,
        certKeyPath: string,
        keyKeyPath: string,
        bucketName: string
    ): Promise<boolean> {
        try {
            await this.s3Client.send(
                new PutObjectCommand({
                                         Bucket: bucketName,
                                         Key: certKeyPath,
                                         Body: certificatePem,
                                     })
            );

            await this.s3Client.send(
                new PutObjectCommand({
                                         Bucket: bucketName,
                                         Key: keyKeyPath,
                                         Body: privateKey,
                                     })
            );

            return true;
        } catch (e: any) {
            this.wl.error(`uploadCertToS3() -> ${e.message}`);
            return false;
        }
    }


    async getCertFromS3(
        certKeyPath: string,
        keyKeyPath: string,
        bucketName: string
    ): Promise<{ status: number; certificatePem?: string; privateKey?: string }> {
        try {
            const certObj = await this.s3Client.send(
                new GetObjectCommand({
                                         Bucket: bucketName,
                                         Key: certKeyPath,
                                     })
            );
            const certificatePem = await this.streamToString(certObj.Body as Readable);

            const keyObj = await this.s3Client.send(
                new GetObjectCommand({
                                         Bucket: bucketName,
                                         Key: keyKeyPath,
                                     })
            );
            const privateKey = await this.streamToString(keyObj.Body as Readable);

            return { status: CODE.SUCCESS, certificatePem, privateKey };
        } catch (e: any) {
            this.wl.error(`getCertFromS3() -> ${e.message}`);
            return { status: CODE.ERROR };
        }
    }
    streamToString(stream: Readable): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        });
    }

    async getDeviceCertificates( deviceId) {
        try {
            const mf = 'walnut'
            // return this.decryptPayload(deviceId, mf);
            const deviceDetails = await this.checkDeviceCertExists( mf , deviceId );
            if (deviceDetails.status === CODE.SUCCESS) {
                this.addDeviceCertificateReq( deviceDetails.device[0].mfid , deviceId);
                const bucketName = deviceDetails.device[0].s3bkt;
                const prefix = process.env.ENVIRONMENT + '-' +  mf + '-certs';
                const certKeyPath = `${prefix}/${deviceId}/certificate.pem`;
                const keyKeyPath = `${prefix}/${deviceId}/private.key`;
                const cert = await this.getCertFromS3( certKeyPath , keyKeyPath , bucketName );
                if (cert.status == CODE.SUCCESS) {
                    return await this.generatePayloadAndEncrypt( cert , deviceId, bucketName, mf );
                }

            } else {
                return await this.requestNewDeviceCertificate( mf , deviceId );

            }
        }
        catch (e) {
            this.wl.error(`getDeviceCertificates() ->  ${e.message}`);
            return false;
        }
    }
   async updaterGeneratedCertCount (mfid){

        try{
           const updateStr = await updateGeneratedCount(mfid);
           await this.pool.query(updateStr.queryStr, updateStr.values);

        }
        catch (e) {
            this.wl.error(`updaterGeneratedCertCount() -> ${e.message}`);
        }
    }

    async requestNewDeviceCertificate(mf, deviceId) {
       try {
           const limitData = await this.checkTheLimit(mf);
           if (limitData.status){
                this.addDeviceCertificateReq(limitData.mfid, deviceId);
                const cert = await this.createThingAndAttach(deviceId, mf);
               const bucketName = limitData.bucketName;
               const prefix = process.env.ENVIRONMENT + '-' +  mf + '-certs';
               const certKeyPath = `${prefix}/${deviceId}/certificate.pem`;
               const keyKeyPath = `${prefix}/${deviceId}/private.key`;
                await this.uploadCertToS3(cert.certificatePem, cert.privateKey, certKeyPath, keyKeyPath, bucketName );
                this.updaterGeneratedCertCount(limitData.mfid);
                return await this.generatePayloadAndEncrypt(cert, deviceId, bucketName, mf);
           }
           else {
               return  'max limit certificate generate exceeded';
           }
       }
       catch (e) {
            this.wl.error(`requestNewDeviceCertificate() ->  ${e.message}`);
            return false;
       }
    }


    async generatePayloadAndEncrypt(cert, deviceId, bucketName, mf) {
        try {
            const rootCA = await this.getRootCAFromS3( bucketName );
            const payload = {
                "status" : "Success" ,
                "imei" : deviceId ,
                "rootCA" : rootCA.rootCaPem ,
                "clientCert" : cert.certificatePem ,
                "clientKey" : cert.privateKey
            }
            return this.encryptPayload( deviceId , JSON.stringify( payload ) , mf );
        }
        catch (e){
            this.wl.error(`generatePayloadAndEncrypt() ->  ${e.message}`);
        }
    }
    async getRootCAFromS3(bucketName: string): Promise<{ status: number; rootCaPem?: string }> {
        try {
            const rootCaObj = await this.s3Client.send(
                new GetObjectCommand({
                                         Bucket: bucketName,
                                         Key: process.env.CA_ROOT_PATH!,
                                     })
            );

            const rootCaPem = await this.streamToString(rootCaObj.Body as Readable);

            return { status: CODE.SUCCESS, rootCaPem };
        } catch (e: any) {
            this.wl.error(`getRootCAFromS3() -> ${e.message}`);
            return { status: CODE.ERROR };
        }
    }
    async pkcs7Pad(buffer: Buffer) {
        const blockSize = 16;
        const padLen = blockSize - (buffer.length % blockSize);
        const pad = Buffer.alloc(padLen, padLen);
        return Buffer.concat([buffer, pad]);
    }

    async encryptPayload(deviceId: string, plaintext: string, mf) {
        // Sanitize and validate hash algorithm
        const hashAlgo = (process.env[`HASH_${mf}`]).toLowerCase().replace(/['"]/g, '');
        this.wl.log(`hashAlgo -> ${hashAlgo}`);

        let key: Buffer;
        try {
            key = createHash(hashAlgo).update(deviceId).digest();
        } catch (err) {
            this.wl.error(`Invalid hash algorithm: ${hashAlgo} - ${err.message}`);
            throw new Error(`Unsupported digest algorithm: ${hashAlgo}`);
        }

        const plaintextBuffer = Buffer.from(plaintext, 'utf-8');
        const paddedPlaintext = await this.pkcs7Pad(plaintextBuffer);

        const algo = (process.env[`ALGO_${mf}`]).toLowerCase().replace(/['"]/g, '');
        const cipher = createCipheriv(algo, key, null);
        cipher.setAutoPadding(false);

        const encrypted = Buffer.concat([cipher.update(paddedPlaintext), cipher.final()]);
        return encrypted.toString('base64');
    }

    async decryptPayload(deviceId: string = '123412341234124', mf: string = 'walnut'): Promise<string> {
       const encryptedBase64: string = "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";

        // 1. Sanitize and validate the hash algorithm
        const hashAlgo = (process.env[`HASH_${mf}`]).toLowerCase().replace(/['"]/g, '');
        this.wl.log(`hashAlgo -> ${hashAlgo}`);

        let key: Buffer;
        try {
            key = createHash(hashAlgo).update(deviceId).digest();
        } catch (err) {
            this.wl.error(`Invalid hash algorithm: ${hashAlgo} - ${err.message}`);
            throw new Error(`Unsupported digest algorithm: ${hashAlgo}`);
        }

        // 2. Sanitize encryption algorithm
        const algo = (process.env[`ALGO_${mf}`]).toLowerCase().replace(/['"]/g, '');

        // 3. Decode base64 and decrypt
        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');

        let decrypted: Buffer;
        try {
            const decipher = createDecipheriv(algo, key, null);
            decipher.setAutoPadding(false); // Manual unpadding
            decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
        } catch (err) {
            this.wl.error(`Decryption failed: ${err.message}`);
            throw new Error('Decryption error');
        }

        // 4. Unpad using PKCS7
        const unpadded = this.pkcs7Unpad(decrypted);

        return unpadded.toString('utf-8');
    }
    pkcs7Unpad(buffer: Buffer): Buffer {
        const padLen = buffer[buffer.length - 1];
        if (padLen < 1 || padLen > 16) {
            throw new Error('Invalid padding');
        }
        return buffer.slice(0, buffer.length - padLen);
    }


}
