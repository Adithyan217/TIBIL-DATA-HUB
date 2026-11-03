import {Inject, Injectable} from '@nestjs/common';
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import {Cache} from "cache-manager";
import axios from 'axios';
import {commonEnum} from '../../common/enum/common.enum';
@Injectable()
export class RcacheService {
    private rcache: Map<number, any> = new Map();

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async setCacheData(key: number, data: any) {
        this.rcache.set(key, data)
    }

    async getCacheData(key) {
        return this.rcache.get(key) || null;
          
    }

    async deleteCacheData(key) {
        // await this.cacheManager.del(key);
        this.rcache.delete(key)
    }
    async updateCacheData(key: string, data: any) {
        await this.cacheManager.set(key, data);
    }

    async resetCache() {
        // await this.cacheManager.reset();
        this.rcache.clear()
    }

    getRouteConfig = async () => {
        try {
            const url = process.env.AXIOS_URL + '/registry/routes/config/get';
            let response = await axios.post(url);
            return  response.data;  
        } catch (error) {
            throw new Error("Error during cache /routes API call")
        }
    }

    addRouteConfigIntoRCache = async (response) => {
        if (response.code === commonEnum.SUCCESS_CODE && response.data !== undefined) {            
            for (const element of response.data) {
                this.setCacheData(element.rname, element.details);
            }
        }
    }

}
