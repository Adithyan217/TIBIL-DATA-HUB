import {Body , Controller , Get , Param , Patch , Post , Req , Res} from '@nestjs/common';
import { Response } from 'express';
import { CommonService } from '../service/common.service';
import { Policy} from '../interface/common.interface';
import { Upermission } from '../interface/common.interface';
import { commonEnum } from '../enum/common.enum';
import {WinstonLoggerService} from "../service/winstonlogger/winstonlogger.service";



@Controller('registry')
export class CommonController {

    constructor(private cs: CommonService, protected wl:WinstonLoggerService){}
    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('policies/ping')
    async ping(@Res() res: Response, @Req() req: any ) {
        this.infoCommonLogger(req);
      res.status(200).send(`Registry-ms is operational. Version: ${process.env.VERSION}`);
    }

    @Post('policies')
    async getpolicies(@Body() pinfo:Policy,@Req() req: any, @Res() res: Response){
        try {
            this.infoCommonLogger(req);
            const result =  await this.cs.getPolicy(pinfo)
            res.status(result.status).send(result.data);
           } catch (error) {
                this.errorCommonLogger(req, error)
              return res.status(error.statusCode || 500).send({message: error.message || 'An unexpected error occurred'});
            }
            }

    @Post('status/get')
    async getstatus(@Body() sinfo:any, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.cs.getStatus(sinfo)
            res.status(result.status).send(result.data);

            } catch (error) {
                this.errorCommonLogger(req, error);
                return res.status(error.statusCode || 500).send({message: error.message || 'An unexpected error occurred'});
           }
    }

    @Post('user-permission')
    async addUpermissions(@Body() body:Upermission, @Res() res: Response, @Req() req:any){
      try{
          this.infoCommonLogger(req);
          const result =  await this.cs.addUserPermissions(body)
          return res.status(result.status).send(result.data);

      }
      catch (error) {
          this.errorCommonLogger(req, error)
          return  res.status(error.statusCode || 500).send({message: error.message || 'An unexpected error occurred'});
      }}

    @Post('orgs/get')
    async getOrgRoles(@Res() res: Response , @Req() req: any) {
        try {
            this.infoCommonLogger( req );
            const result = await this.cs.getOrgRoles();
            return res.status( result.status ).send( result.data );
        } catch (error) {
            this.errorCommonLogger( req , error );
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );


        }
    }

    @Post('merchant-types/get')
    async getMerchantTypes(@Res() res: Response , @Req() req: any) {
        try {
            this.infoCommonLogger( req );
            const result = await this.cs.getMerchantTypes();
            return res.status( result.status ).send( result.data );
        } catch (error) {
            this.errorCommonLogger( req , error );
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

    @Post('sim-providers/get')
    async getSimProviders(@Res() res: Response , @Req() req: any) {
        try {
            this.infoCommonLogger( req );
            const result = await this.cs.getSimProviders();
            return res.status( result.status ).send( result.data );
        } catch (error) {
            this.errorCommonLogger( req , error );
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );
        }
    }

    @Post('users/list/get')
    async getUserList(@Body() body,@Res() res: Response , @Req() req: any) {
        try {
            this.infoCommonLogger( req );
            const result = await this.cs.getUserList(body);
            return res.status( result.status ).send( result.data );
        } catch (error) {
            this.errorCommonLogger( req , error );
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );
        }
    }

}
