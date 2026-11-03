import {Inject, Injectable} from '@nestjs/common';
import  {commonEnum} from '../enum/common.enum'
import {Pool} from 'pg';
import { CommonqueryService } from './commonquery.service';
import { devicesMessage } from 'src/enums/devices.enums';
import { merchantMessage } from 'src/enums/merchant.enums';
import { message } from 'src/enums/message';
@Injectable()
export class CommonService {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
       private qs: CommonqueryService
    ){

    }

    async getEntityDetailsExecution(data, context) {
        try {
            const queryStr = this.qs.entityQuery(data, context, true);
            const count: any = await this.pool.query(queryStr.query, queryStr.value);
            if (count.rows[0].count > 0) {
                const queryStr = this.qs.entityQuery(data, context, false);
                const result = await this.pool.query(queryStr.query, queryStr.value);
                return {
                    code: commonEnum.SUCCESS_CODE,
                    count: count.rows[0].count,
                    data: result.rows
                }
            }
            else {
                return {
                    code: commonEnum.FAILURE_CODE,
                    message: commonEnum.NO_RECORDS
                }
            }


        }catch (e) {
            return {
                code: commonEnum.ERROR_CODE,
                message: e.message
            }
        }
    }

    async getDevicesExecution(data){
        try {
            const queryStr = this.qs.getFilteredData(data.filter,data.pagination, true);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = this.qs.getFilteredData(data.filter,data.pagination, false);
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return {
                    code: devicesMessage.SUCCESS_CODE,
                    count: count.rows[0].count,
                    data: result.rows
                }
            }
            else {
                return {
                    code: devicesMessage.FAILURE_CODE,
                    message: devicesMessage.NO_RECORDS
                }
            }


        }catch (e) {
            return {
                code: devicesMessage.ERROR_CODE,
                message: e.message
            }

        }
    }


    async getBanksExecution(data){
        try {
            const queryStr = this.qs.getBankList(data.filter,data.pagination, true);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = this.qs.getBankList(data.filter,data.pagination, false);
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return {
                    code: commonEnum.SUCCESS_CODE,
                    count: count.rows[0].count,
                    data: result.rows
                }
            }
            else {
                return {
                    code: commonEnum.FAILURE_CODE,
                    message: commonEnum.NO_RECORDS
                }
            }
        }catch (e) {
                return { 
                    code: commonEnum.ERROR_CODE,
                    message: e.message
                }
        }
    }  

    async getBranchesExecution(data){
        try {
            const queryStr = this.qs.getBranchList(data.filter,data.pagination, true);
            const count: any = await this.pool.query(queryStr.query, queryStr.values);
            if (count.rows[0].count > 0) {
                const queryStr = this.qs.getBranchList(data.filter,data.pagination, false);
                console.log(queryStr)
                const result = await this.pool.query(queryStr.query, queryStr.values);
                return {
                    code: commonEnum.SUCCESS_CODE,
                    count: count.rows[0].count,
                    data: result.rows
                }
            }
            else {
                return {
                    code: commonEnum.FAILURE_CODE,
                    message: commonEnum.NO_RECORDS
                }
            }
        }catch (e) {
                return {
                    code: commonEnum.ERROR_CODE,
                    message: e.message
                }
        }
    }
        


    async getMerchantsExecution(data){
        try{



            const queryStr = await this.qs.getMerchantQuery(data.filter, data.pagination);
            const result = await this.pool.query(queryStr.query, queryStr.values);
            if(result.rowCount > 0){
                return {
                    code: commonEnum.SUCCESS_CODE,
                    data: result.rows
                }
            }
            else {
                return {
                    code: commonEnum.FAILURE_CODE,
                    message: commonEnum.NO_RECORDS
                }
            }


        }catch (e) {
            return {
                code: commonEnum.ERROR_CODE,
                message: e.message
            }

        }
    }



    async getVpasExecution(data){
        try{



            const queryStr = await this.qs.getVpaQuery(data.filter, data.pagination);
            const result = await this.pool.query(queryStr.query, queryStr.values);
            if(result.rowCount > 0){
                return {
                    code: commonEnum.SUCCESS_CODE,
                    data: result.rows
                }
            }
            else {
                return {
                    code: commonEnum.FAILURE_CODE,
                    message: commonEnum.NO_RECORDS
                }
            }


        }catch (e) {
            return {
                code: commonEnum.ERROR_CODE,
                message: e.message
            }

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
                return {
                    code: commonEnum.SUCCESS_CODE,
                    data: result.rows[0].policy_content 
                }
            }
            else {
                return {
                    code: commonEnum.FAILURE_CODE,
                    message: commonEnum.NO_RECORDS
                }
            }

        }catch (e) {
            return {
                code: commonEnum.ERROR_CODE,
                message: e.message
            }

        }
    }

}
