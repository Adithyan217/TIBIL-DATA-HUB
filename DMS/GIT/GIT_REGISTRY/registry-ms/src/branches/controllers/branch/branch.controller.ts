import { Body, Controller, Get, Post, Res,Patch } from '@nestjs/common';
import { Response } from 'express';
import { Branch } from 'src/branches/interfaces/branch.interface';
import { onboardBranchService } from 'src/branches/services/onboardbranch/onboardbranch.service';
import { message } from 'src/enums/message';
import {commonEnum} from "../../../common/enum/common.enum";
import { CommonService } from 'src/common/service/common.service';

@Controller('registry')
export class BranchController {

    constructor(private obs: onboardBranchService,
                private  commonService: CommonService
                ){

    }

    @Get('branches/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('branches')
    async onboardBranch(@Body() brinfo:Branch, @Res() res: Response){
        try {
            const result =  await this.obs.createBranch(brinfo)
            if(typeof result === 'object' && result?.code  === 200){
              res.status(201).send(result)
            }else{
              res.status(400).send(result)
            }
          
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: 'Unable to create a record',
            });
          }
        }

    @Post('/branches/details/get')
    async getEntity( @Body() body, @Res() res: Response){
        try{
            body.offset = body.offset || 0;
            body.limit = body.limit || 10;
            const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'branch')
            res.status(exeRes.code == commonEnum.ERROR_CODE ? 400: 200).send(exeRes);

        }catch (e) {
            res.status(500).json({
                status: commonEnum.ERROR_CODE,
                message: e.message
            })
        }
    }

    @Post('/branches/list/get')
    async getBranches(@Body() body: any, @Res() res: Response ) {
        body.pagination.offset = body.pagination.offset || 0;
        body.pagination.limit = body.pagination.limit || 10;
        const result = await this.commonService.getBranchesExecution(body);
        res.status(result.code == commonEnum.ERROR_CODE? 400 : 200).send(result);

  

    }
  
  }
