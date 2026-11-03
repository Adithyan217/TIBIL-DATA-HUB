import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { commonEnum } from '../../common/enum/common.enum';

@Injectable()
export class DcacheService {
    private dcache: Map<number, any> = new Map();

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private http: HttpService
    ) {}

    async setCacheData(key: number, data: any) {
        this.dcache.set(key, data);
    }
    

    async getCacheData(key: number){
        try {
            // const result  = this.dcache.get(key)
            // if (result) {
            //     console.log(`Cache hit for key: ${key}`);
            //     return result;
            // }else{
                // this.dcache.set(key, '')
                const rdata  = await this.getDRoutesAssoc(key)
                if(rdata){
                // this.dcache.set(key, rdata?.data[0]?.rid)
                return rdata?.data[0]?.rid
                }else{
                    return null
                }
            // }
            
        } catch (error) {
            console.error(`Error in getCacheData for key ${key}:`, error);
            return null;
        }
    }
   
    
    
    async resetCache(): Promise<void> {
        this.dcache.clear();
    }

    async getDRoutesAssoc(did: number): Promise<any> {
        try {
            const url = `${process.env.AXIOS_URL}/registry/droutes/get`;
            const body = { did };

            const response = await lastValueFrom(this.http.post(url, body));
            console.log('API response for DID:', response?.data);

            if (response.status === 200 && response?.data?.data) {
                return response.data;
            } else {
                console.warn(`Unexpected API response for DID ${did}:`, response);
                return null;
            }
        } catch (error) {
            throw new Error(`Error during /droutes API call for DID ${did}`);
        }
    }

    // Add routes data into the local cache
    async addDRoutesIntoDCache(response: any): Promise<void> {
        if (response.code === commonEnum.SUCCESS_CODE && response.data !== undefined) {
            for (const element of response.data) {
                this.setCacheData(element.did, element.rid);
            }
        } else {
            console.warn('Invalid response format while adding to cache:', response);
        }
    }
}
