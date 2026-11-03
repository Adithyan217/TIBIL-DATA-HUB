import {Body, Controller, Get, Param, Patch, Post, Res} from '@nestjs/common';
import { Response } from 'express';
import { CommonService } from '../service/common.service';
import { Policy} from '../interface/common.interface';


@Controller('registry')
export class CommonController {

    constructor(private cs: CommonService,
          
                ){

    }
    
    @Get('policies/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('policies')
    async getpolicies(@Body() pinfo:Policy, @Res() res: Response){
        try {
            const result =  await this.cs.getPolicy(pinfo)
            if(typeof result === 'object' && result?.code  === 200){
            res.status(200).send(result)
                    }else{
                      res.status(400).send(result)
                    }
    
                  } catch (error) {
                    return res.status(500).json({
                      status: 500,
                      message: 'Unable to get the policy',
                    });
                  }
                }  
}


