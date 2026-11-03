import { Injectable } from '@nestjs/common';

@Injectable()
export class RoutesQueryService {

    getRoutesDeviceAssociation(did) {
        let query = `SELECT rid, did
                     FROM registry.sbroutes
                     WHERE isd = false`;
        const values = [];
        
        if (did) {
            query += ` AND did = $1`;
            values.push(did);
        }
        
        return { query, values };
    }

    getRoutesConfig() {
        const query = `SELECT
                           rid,
                           rname,
                           json_build_object(
                                   'notifier', notifier,
                                   'dconfig', dconfig,
                                   'sconfig', sconfig,
                                   'security', security
                               ) AS details
                       FROM
                           registry.routes
                       WHERE
                           isd = false;`;
        const values = [];
        return {query, values};
    }

    getRoutes(data){
        const query = `SELECT rid,json_build_object(
                                   'rname', rname,
                                   'notifier', notifier,
                                   'dconfig', dconfig,
                                   'sconfig', sconfig,
                                   'security', security
                               ) AS details FROM registry.routes WHERE rid = (SELECT rid FROM registry.sbroutes WHERE did = $1)`
        const values = [data.did]
        return {query, values}
        
    }
}

