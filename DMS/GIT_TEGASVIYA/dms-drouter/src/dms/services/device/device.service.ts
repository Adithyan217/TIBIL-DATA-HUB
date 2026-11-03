import {Inject , Injectable} from '@nestjs/common';
import {DeviceQueryService} from "../queries/device-query";
import { Pool } from 'pg';

@Injectable()
export class DeviceService {
    constructor( private readonly dQuery: DeviceQueryService,  @Inject('DATABASE_POOL') private readonly pool: Pool,) {}
/*
    deviceDeactivations =async (body:any)  => {
        try{


            let success = 0;

            const headers = ["row_id", "status", "msgs"];
            const edetails = body.edetails;
            // Use map to handle async operations properly
            const results = await Promise.all(
                edetails.map(async (el) => {
                    try {
                        const queryStr = await this.dQuery.deviceDeactivationQuery(el.device_id);
                        const result = await this.pool.query(queryStr.query, queryStr.values);

                        if (result.rowCount > 0) {
                            success += 1;
                            return [el.row_id, 1, "Successfully Deactivated"];
                        } else {
                            return [el.row_id, 0, "Failed to deactivate"];
                        }
                    } catch (error) {
                        return [el.row_id, 0, `Error: ${error.message}`];
                    }
                })
            );

            return {
                status: 200,
                data: {
                    code: 2000,
                    message: "Operation successfully executed.",
                    edata: {
                        headers,
                        values: results,
                        status: [edetails.length, success, edetails.length - success], // [total, success, failure]
                    },
                },
            };


        }catch (e) {
            return {
                status: 500,
                data:{
                    message: e.message,
                    code: 5000
                }
            }
        }
    }
    */

  /*  insertIntoSoundbox = async (body: any) => {
        try {
            const edetails: any[] = body.edetails;
            const values: any[] = [];
            let success = 0;

            const headers = ["row_id", "status", "msgs"];

            // Use map to handle async operations properly
            const results = await Promise.all(
                edetails.map(async (el) => {
                    try {
                        const queryStr = await this.dQuery.insertIntoSoundBox(el.dname, el.imei, el.rcontext);
                        const result = await this.pool.query(queryStr.query, queryStr.values);

                        if (result.rowCount > 0) {
                            success += 1;
                            return [el.row_id, 1, "Successfully inserted"];
                        } else {
                            return [el.row_id, 0, "Failed"];
                        }
                    } catch (error) {
                        return [el.row_id, 0, `Error: ${error.message}`];
                    }
                })
            );

            return {
                status: 200,
                data: {
                    code: 2000,
                    message: "Operation successfully executed.",
                    edata: {
                        headers,
                        values: results,
                        status: [edetails.length, success, edetails.length - success], // [total, success, failure]
                    },
                },
            };
        } catch (e) {
            return {
                status: 500,
                data: {
                    message: e.message,
                    code: 5000,
                },
            };
        }
    };
*/

    deviceDeactivations = async (body: any) => {
        return await this.executeBatchOperation(
            body.edetails,
            async (el) => this.dQuery.deviceDeactivationQuery(el.device_id), // 🔹 Query generator
            "Successfully Deactivated", // ✅ Success message
            "Failed to deactivate" // ❌ Failure message
        );
    };

    insertIntoSoundbox = async (body: any) => {
        return await this.executeBatchOperation(
            body.edetails,
            async (el) => this.dQuery.insertIntoSoundBox(el.dname, el.imei, el.rcontext), // 🔹 Query generator
            "Successfully inserted", // ✅ Success message
            "Failed to insert" // ❌ Failure message
        );
    };


    // 🔹 Generic function for handling database operations
    async executeBatchOperation(
        edetails: any[],
        queryFunction: (el: any) => Promise<{ query: string; values: any[] }>,
        successMessage: string,
        failureMessage: string
    ) {
        try {
            let success = 0;
            const headers = ["row_id", "status", "msg"];

            // Execute all queries in parallel using Promise.all
            const results = await Promise.all(
                edetails.map(async (el) => {
                    try {
                        const queryStr = await queryFunction(el);
                        const result = await this.pool.query(queryStr.query, queryStr.values);

                        if (result.rowCount > 0) {
                            success += 1;
                            return [el.row_id, 1, successMessage]; // ✅ Success case
                        } else {
                            return [el.row_id, 0, failureMessage]; // ❌ Failure case
                        }
                    } catch (error) {
                        return [el.row_id, 0, `Error: ${error.message}`]; // 🔴 Catch DB errors
                    }
                })
            );

            return {
                status: 200,
                data: {
                    code: 2000,
                    message: "Operation successfully executed.",
                    edata: {
                        headers,
                        values: results,
                        status: [edetails.length, success, edetails.length - success], // [total, success, failure]
                    },
                },
            };
        } catch (e) {
            return {
                status: 500,
                data: {
                    message: e.message,
                    code: 5000,
                },
            };
        }
    }

}
