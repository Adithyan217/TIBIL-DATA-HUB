import {HttpStatus , Inject , Injectable} from '@nestjs/common';
import { aggregatorProcessor,getConfigQry, paymentInsertQuery, getPaymentMetricsQuery, getBankMetricsQuery, getBranchMetricsQuery, getMerchantMetricsQuery, getIssues, getDeviceRequestMetrics, getDeviceMetricsQuery} from './../query/aggregator';
import {Pool} from 'pg';
import {CODE , generateResponse , MESSAGE} from "../../intel/enums/response.enum";
@Injectable()
export class AggregatorService {

    constructor( @Inject('DATABASE_POOL') private pool: Pool,) {}

    async postAggregateProcess(data) {
        try {
          const { query: configQuery } = await getConfigQry();
          const configResult = await this.pool.query(configQuery, [data.event]);
      
          if (configResult.rowCount === 0) {
            return {
              code: 200,
              message: "Configuration not found",
              edata: { headers: [], values: [], status: [0, 0, 0] },
            };
          }
      
          const config = configResult.rows[0].config;
          const headers = data.rdetails.headers;
          const allRows = data.rdetails.values || [];
          const statusIndex = headers.indexOf("status");
      
          const schemaKeys = [
            ...new Set(config.iterators?.flatMap(iter => iter.schema || [])),
          ];
          const missingHeaders = schemaKeys.filter(key => !headers.includes(key));
      
          if (missingHeaders.length > 0) {
            // Mark all rows as failed due to missing headers
            const failedRows = allRows.map(row => {
              const rowIdIndex = headers.indexOf("row_id");
              const rowId = rowIdIndex !== -1 ? row[rowIdIndex] : null;
              return {
                row_id: rowId,
                msg: `missing header(s): ${missingHeaders.join(", ")}`,
                status: 0,
              };
            });
      
            return {
              code: 200,
              message: "Header validation failed",
              edata: {
                headers: ["row_id", "msg", "status"],
                values: failedRows.map(r => [r.row_id, r.msg, r.status]),
                status: [failedRows.length, 0, failedRows.length],
              },
            };
          }
      
          const validRows = [];
          const failedRows = [];
      
          for (const row of allRows) {
            const status = statusIndex !== -1 ? row[statusIndex] : null;
            const rowIdIndex = headers.indexOf("row_id");
            const rowId = rowIdIndex !== -1 ? row[rowIdIndex] : null;
      
            if (status !== 1) {
              failedRows.push({
                row_id: rowId,
                msg: "insertion failed row",
                status: 0,
              });
              continue;
            }
      
            const transformed = {};
            headers.forEach((key, idx) => {
              transformed[key] = row[idx];
            });
      
            validRows.push(transformed);
          }
      
          const iteratorResults = [];
      
          for (const iter of config.iterators || []) {
            const { iterator: funcName, schema: keys } = iter;
            const payloadArray = [];
      
            for (const row of validRows) {
              const rowData = {};
              for (const key of keys) {
                rowData[key] = row[key];
              }
              payloadArray.push(JSON.stringify(rowData));
            }
      
            const result = await this.pool.query(
              `SELECT * FROM ${funcName}($1::json[])`,
              [payloadArray]
            );
      
            iteratorResults.push(...(result.rows || []));
          }
      
          const combinedResults = [...iteratorResults, ...failedRows];
      
          if (combinedResults.length > 0) {
            const resultHeaders = Object.keys(combinedResults[0]);
            const resultValues = combinedResults.map(row =>
              resultHeaders.map(h => row[h])
            );
            const totalProcessed = combinedResults.length;
            const successfullyInserted = combinedResults.filter(r => r.status === 1).length;
            const failedInserted = combinedResults.filter(r => r.status === 0).length;
      
            return {
              code: 200,
              message: `${data.event} Processed`,
              edata: {
                headers: resultHeaders,
                values: resultValues,
                status: [totalProcessed, successfullyInserted, failedInserted],
              },
            };
          } else {
            return {
              code: 200,
              message: "No data to process",
              edata: { headers: [], values: [], status: [0, 0, 0] },
            };
          }
        } catch (e) {
          return {
            code: 400,
            message: e.message || "Internal Server Error",
            edata: { headers: [], values: [], status: [0, 0, 0] },
          };
        }
      }
      
      
    
    



     postPaymentAggregateProcess = async (data ) => {
        try{

            const {values, query}  = await paymentInsertQuery(data.bid, data.brid, data.imei, data.amt);
            const result = await this.pool.query(query, values);

            return generateResponse(HttpStatus.OK, CODE.SUCCESS, [], {message: "Metrics Updated successfully."} );
        }
        catch (e) {
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.ERROR, e.message );
        }
    }


     processMetrics = async (data, queryFunction, functionName = 'processMetrics') => {
        try {
            // Validate input data
            if (!data || !data.filter) {
                throw new Error('Invalid data structure: filter property is required');
            }

            const filterData = data.filter;

            // Validate required fields based on query function
            // const requiredFields = ['dFrom', 'dTo'];
            // // if (queryFunction.name.includes('Payment') ||
            // //     queryFunction.name.includes('Branch') ||
            // //     queryFunction.name.includes('Merchant')) {
            // //     requiredFields.push('brid');
            // // }

            // for (const field of requiredFields) {
            //     if (!filterData[field]) {
            //         throw new Error(`Missing required field: ${field}`);
            //     }
            // }


            // Get query and values from the appropriate query function
            const { values, query } = await queryFunction(
                filterData
            );

            if (!query || !Array.isArray(values)) {
                throw new Error('Invalid query or values returned from query function');
            }

            // Execute the database query
            const result = await this.pool.query(query, values);

            // Return successful response with data or empty array
            const responseData = result.rowCount > 0 ? result.rows : [];
            return generateResponse(HttpStatus.OK, CODE.SUCCESS, responseData);

        } catch (error) {

            return generateResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                CODE.ERROR,
                error.message
            );
        }
    };

     getMetricsProcess = async (data, type) => {
        const queryFunctions = {
            'payments': getPaymentMetricsQuery,
            'banks': getBankMetricsQuery,
            'branches': getBranchMetricsQuery,
            'merchants': getMerchantMetricsQuery,
            'device_issues': getIssues,
            'device_requests': getDeviceRequestMetrics,
            'devices': getDeviceMetricsQuery
        };

        const queryFunction = queryFunctions[type];
        if (!queryFunction) {
            return generateResponse(
                HttpStatus.BAD_REQUEST,
                CODE.ERROR,
                `Invalid metrics type: ${type}`
            );
        }

        return await this.processMetrics(data, queryFunction, `getMetricsProcess-${type}`);
    };

/*
    getPaymentsMetricsProcess = async (data ) => {
        try{
            data = data.filter;
                const {value, query}  = await getPaymentMetricsQuery(data.bid, data.brid, data.dFrom, data.dTo);
                const result = await this.pool.query(query, value);
                if(result.rowCount > 0){
                    return generateResponse(HttpStatus.OK, CODE.SUCCESS, result.rows );
                }
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, [] );
        }catch (e) {
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.ERROR, e.message );
        }
    }

    getBanksMetricsProcess = async (data ) => {
        try{
            data = data.filter;
            const {value, query}  = await getBankMetricsQuery(data.bid, data.dFrom, data.dTo);
            const result = await this.pool.query(query, value);
            if(result.rowCount > 0){
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, result.rows );
            }
            return generateResponse(HttpStatus.OK, CODE.SUCCESS, [] );

        }
        catch (e) {
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.ERROR, e.message );
        }
    }

    getBranchesMetricsProcess = async (data ) => {
        try{
            data = data.filter;
            const {value, query}  = await getBranchMetricsQuery(data.bid, data.brid,  data.dFrom, data.dTo);
            const result = await this.pool.query(query, value);
            if(result.rowCount > 0){
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, result.rows );
            }
            return generateResponse(HttpStatus.OK, CODE.SUCCESS, [] );
        }
        catch (e) {
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.ERROR, e.message );
        }
    }

    getMerchantsMetricsProcess = async (data ) => {
        try{
            data = data.filter;
            const {value, query}  = await getMerchantMetricsQuery(data.bid, data.brid,  data.dFrom, data.dTo);
            const result = await this.pool.query(query, value);
            if(result.rowCount > 0){
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, result.rows );
            }
            return generateResponse(HttpStatus.OK, CODE.SUCCESS, [] );
        }
        catch (e) {
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.ERROR, e.message );
        }
    }*/
}
