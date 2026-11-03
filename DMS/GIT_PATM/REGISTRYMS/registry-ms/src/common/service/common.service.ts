import {Inject, Injectable} from '@nestjs/common';
import  {commonEnum, CODE, MESSAGE, generateResponse } from '../enum/common.enum'
import {Pool} from 'pg';
import { CommonqueryService } from './commonquery.service';
import { devicesMessage } from '../../enums/devices.enums';
import {WinstonLoggerService} from "./winstonlogger/winstonlogger.service";
/*import { merchantMessage } from 'src/enums/merchant.enums';
import { message } from 'src/enums/message';*/

@Injectable()
export class CommonService {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool, private wl: WinstonLoggerService,
       private qs: CommonqueryService
    ){

    }

    async getEntityDetailsExecution(data, context) {
        try {
            const queryStr = this.qs.entityQuery(data, context, true,data.role, data?.userName);
            const count: any = await this.pool.query(queryStr.query, queryStr.value);
            if (count.rows[0].count > 0) {
                const queryStr = this.qs.entityQuery(data, context, false,data.role, data?.userName);
                const result = await this.pool.query(queryStr.query, queryStr.value);
                return generateResponse(200, CODE.SUCCESS, result.rows, {count: count.rows[0].count});

            }
            else {
                return generateResponse(200, CODE.SUCCESS, []);
            }


        }catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }

    async getEntityDetailsQueryExecution(data,context){
        try {


            const queryStr = this.qs.getEntityDetailsQuery( data , context , data.role , data?.userName )
            const result = await this.pool.query( queryStr.query , queryStr.value );
            if (result.rows.length > 0) {
                return generateResponse( 200 , CODE.SUCCESS , result.rows );
            } else {
                return generateResponse( 200 , CODE.SUCCESS , [] );
            }
        }
        catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }

    async getDevicesExecution(data){
        try {
            const queryStr = this.qs.getFilteredData(data?.filter,data.pagination, true, data.role, data?.userName);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = this.qs.getFilteredData(data.filter,data.pagination, false, data.role, data?.userName);
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return generateResponse(200, CODE.SUCCESS , result.rows, {count: count.rows[0].count});
            }
            else {
                return generateResponse(200, CODE.SUCCESS, [] );

            }


        }catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message );
        }
    }


    async getBanksExecution(data){
        try {
            const queryStr = await this.qs.getBankList(data?.filter,data.pagination, true, data.role, data?.userName);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = await this.qs.getBankList(data?.filter,data.pagination, false,data.role, data?.userName);
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return generateResponse( 200 , CODE.SUCCESS , result.rows, {count: count.rows[0].count} );
            }
            else {
                return generateResponse( 200 , CODE.SUCCESS, [] );

            }
        }catch (e) {
            this.wl.error(e.message);
                return generateResponse(400, CODE.ERROR, e.message );
        }
    }

    async getBranchesExecution(data){
        try {
            const queryStr = await this.qs.getBranchList(data?.filter,data.pagination, true,data.role, data?.userName);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = await this.qs.getBranchList(data?.filter,data.pagination, false,data.role, data?.userName);
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return generateResponse(200, CODE.SUCCESS , result.rows, {count: count.rows[0].count} );
            }
            else {
                return generateResponse(200, CODE.SUCCESS, [] );
            }
        }catch (e) {
            console.error("Error in getBranchesExecution: ", e);
            return generateResponse(400, CODE.ERROR, e.message );

        }
    }



    async getMerchantsExecution(data){
        try{
            const queryStr = await this.qs.getMerchantQuery(data.filter, data.pagination,true,data.role, data?.userName);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = await this.qs.getMerchantQuery(data.filter, data.pagination,false,data.role, data?.userName);
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return generateResponse(200, CODE.SUCCESS , result.rows, {count: count.rows[0].count} );

            }
            else {
                return generateResponse(200, CODE.SUCCESS, [] );
            }
 

        }catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message );
            }
    }

    async getVpasExecution(data){
        try{
            const queryStr = await this.qs.getVpaQuery(data.filter, data.pagination);
            const result = await this.pool.query(queryStr.query, queryStr.values);
            if(result.rowCount > 0){
                return generateResponse(200, CODE.SUCCESS, result.rows);

            }
            else {
                return generateResponse(200, CODE.SUCCESS, [] );
            }

        }catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message );
        }
    }

    async checkcvalues(data){
        try{
            const queryStr = await this.qs.check(data);
            const result = await this.pool.query(queryStr.query, queryStr.values);
            if(result.rowCount > 0){
                if (result.rows[0].results == true)
                    return {
                        code: commonEnum.SUCCESS_CODE,
                        message:'verfication successful'
                    }
                else{
                    return {
                        code: commonEnum.FAILURE_CODE,
                        message:'verfication failed'
                    }
                }
            }
            else {
                return {
                    code: commonEnum.FAILURE_CODE,
                    message:'verfication failed'
                }
            }


        }catch (e) {
            this.wl.error(e.message);
            return {
                code: commonEnum.ERROR_CODE,
                message: e.message
            }

        }
    }

    async getPolicy(data){
        try{
            const queryStr = await this.qs.policy(data);
            const result = await this.pool.query(queryStr.query, queryStr.values);
            if(result.rowCount > 0){
                return generateResponse(200, CODE.SUCCESS, result.rows[0].policy_content );

            }
            else  {
                return generateResponse(200, CODE.SUCCESS, []);
            }

        }catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);

        }
    }

    async getStatus(data){
        try{
            const queryStr = await this.qs.status(data);
            const result = await this.pool.query(queryStr.query, queryStr.values);
            if(result.rowCount > 0){
                return  generateResponse(200, CODE.SUCCESS,   result.rows.map(row => row.status));

            }
            else {
                return  generateResponse(200, CODE.SUCCESS,   []);
            }

        }catch (e) {
            this.wl.error(e.message)
            return  generateResponse(400, CODE.ERROR, e.message);
        }
    }

    async addUserPermissions(body){
        try{
            const queryStr = await this.qs.upermissions(body);
            const result = await this.pool.query(queryStr.query, queryStr.values);
            if(result.rowCount > 0){
                return generateResponse(200, CODE.SUCCESS,   result.rows);

            }
            else {
                return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);

            }

        }catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }

    

    async getOrgRoles(){
        try {
            const queryStr = await this.qs.getorgs();
            const result = await this.pool.query(queryStr);
            if(result.rowCount > 0){
                return generateResponse(200, CODE.SUCCESS,   result.rows);

            }
            else {
                return generateResponse(200, CODE.SUCCESS,   []);
            }

        } catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }

    async getMerchantTypes(){
        try {
            const queryStr = await this.qs.getMerchantTypes();
            const result = await this.pool.query(queryStr);
            if(result.rowCount > 0){
                return generateResponse(200, CODE.SUCCESS,   result.rows);

            }
            else {
                return generateResponse(200, CODE.SUCCESS,   []);
            }

        } catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }

    async getSimProviders(){
        try {
            const queryStr = await this.qs.getSimProviders();
            const result = await this.pool.query(queryStr);
            if(result.rowCount > 0){
                return generateResponse(200, CODE.SUCCESS,   result.rows);

            }
            else {
                return generateResponse(200, CODE.SUCCESS,   []);
            }

        } catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }

    async getUserList(data){
        try {
            const queryStr = await this.qs.getUserList(data,true);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = await this.qs.getUserList(data,false);
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return generateResponse(200, CODE.SUCCESS,   result.rows, {count: count.rows[0].count});
            }
            else {
                return generateResponse(200, CODE.SUCCESS,   []);
            }

        } catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }

    async getSoundboxesExecution(data){
        try {
            const queryStr = await this.qs.getSoundboxesQuery(data?.filter, data.pagination,data.role, data?.userName);
            const result = await this.pool.query(queryStr.query, queryStr.values);
            if (result.rowCount > 0) {
                return generateResponse(200, CODE.SUCCESS, result.rows);
            }
            else {
                return generateResponse(200, CODE.SUCCESS, [] );
            }
        } catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message );
        }
    }

    async getPdExecution(data){
        try {
            const queryStr = await this.qs.getPdQuery(data,true);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = await this.qs.getPdQuery(data,false);
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return generateResponse(200, CODE.SUCCESS,   result.rows, {count: count.rows[0].count});
            }
            else {
                return generateResponse(200, CODE.SUCCESS,   []);
            }

        } catch (e) {
            this.wl.error(e.message);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }
}
