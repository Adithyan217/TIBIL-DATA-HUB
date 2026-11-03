import { Body, Controller, Get, Post, Res,Patch, Req } from '@nestjs/common';
import { Response } from 'express';
import { Branch } from 'src/branches/interfaces/branch.interface';
import { onboardBranchService } from 'src/branches/services/onboardbranch/onboardbranch.service';
import { message } from 'src/enums/message';
import {commonEnum} from "../../../common/enum/common.enum";
import { CommonService } from 'src/common/service/common.service';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
import {BranchesService} from "../../services/branches/branches.service";

@Controller('registry')
export class BranchController {

    constructor(private obs: onboardBranchService,
                private  commonService: CommonService, protected wl:WinstonLoggerService, protected branchesService: BranchesService
                ){}
    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('branches/ping')
    async ping(@Res() res: Response, @Req() req: any ) {
        this.infoCommonLogger(req);
      res.status(200).send(`Registry is operational. Version: ${process.env.VERSION}`);
    }

    @Post('branches')
    async onboardBranch(@Body() brinfo:Branch,@Req() req: any , @Res() res: Response){
        try {
            this.infoCommonLogger(req);
            const result =  await this.obs.createBranch(brinfo)
            if(typeof result === 'object' && result?.code  === 200){
              res.status(201).send(result)
            }else{
              res.status(400).send(result)
            }
          
          } catch (error) {
            this.errorCommonLogger(req, error)
            return res.status(500).json({
              status: 500,
              message: 'Unable to create a record',
            });
          }
        }

    @Post('/branches/details/get')
    async getEntity( @Body() body, @Res() res: Response,@Req() req:any ){
        try{
            this.infoCommonLogger(req);
            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const exeRes = await  this.commonService.getEntityDetailsQueryExecution(body, 'branch')
            return res.status(exeRes.status).send(exeRes.data);

        }catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

    @Post('/branches/list/get')
    async getBranches(@Body() body: any, @Res() res: Response,@Req() req:any ) {
        try {
            this.infoCommonLogger(req);
            body.pagination.offset = body.pagination.offset || 0;
            body.pagination.limit = body.pagination.limit || 10;
            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const result = await this.commonService.getBranchesExecution( body );
            res.status( result.status ).send( result.data);
        }
        catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }

    }
    @Post('/user/branches/get')
    async getUserByBanks(@Res() res: Response, @Req() req: any,  @Body() body:any ){
        try {
            const result:any = await this.branchesService.getBranchesByUsers(body, req);
            res.status(result.status).send(result.data);
        }
        catch (error) {
            return res.status(error.statusCode || 500).send({message : error.message || 'An unexpected error occurred'} );
        }

    }
  
  }
