import {Controller , Post , Req , Res} from '@nestjs/common';
import {Response} from "express";
import {AggregatorService} from "../service/aggregator.service";

@Controller('intel')
export class AggregatorController {
    constructor(private readonly agService: AggregatorService) {}

    @Post('aggregate')
    async postAggregateEntity(@Res() res: Response, @Req() req){
        try {
            const result = await this.agService.postAggregateProcess(req.body);
            if(typeof result === 'object' && result?.code  === 200){
                res.status(201).send(result)
              }else{
                res.status(400).send(result)
              }        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message);
        }
    }

    @Post('payments/aggregate')
    async postPaymentAggregate(@Res() res: Response, @Req() req){
        try {
            const result = await this.agService.postAggregateProcess(req.body);
            if(typeof result === 'object' && result?.code  === 200){
                res.status(201).send(result)
              }else{
                res.status(400).send(result)
              }        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message); 
        }
    }

    @Post('payments/metrics/get')
    async getPaymentMetrics(@Res() res: Response, @Req() req){
        try{
            req.body.filter["role"] = req?.user.role;
            req.body.filter["username"] = req?.user.userName;
            const result = await this.agService.getMetricsProcess(req.body,'payments');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message);
        }
    } 

    @Post('banks/metrics/get')
    async getBankMetrics(@Res() res: Response, @Req() req){
        try{
            req.body.filter["role"] = req?.user.role;
            req.body.filter["username"] = req?.user.userName;            
            const result = await this.agService.getMetricsProcess(req.body,'banks');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message);
        }
    }

    @Post('branches/metrics/get')
    async getBranchMetrics(@Res() res: Response, @Req() req){
        try{
            req.body.filter["role"] = req?.user.role;
            req.body.filter["username"] = req?.user.userName;            
            const result = await this.agService.getMetricsProcess(req.body,'branches');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message);
        }
    }
    @Post('merchants/metrics/get')
    async getMerchantMetrics(@Res() res: Response, @Req() req){
        try{
            req.body.filter["role"] = req?.user.role;
            req.body.filter["username"] = req?.user.userName;            
            const result = await this.agService.getMetricsProcess(req.body,'merchants');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message);
        }
    }

    @Post('device-issues/metrics/get')
    async getDeviceIssuesMetrics(@Res() res: Response, @Req() req){
        try{
            req.body.filter["role"] = req?.user.role;
            req.body.filter["username"] = req?.user.userName;            
            const result = await this.agService.getMetricsProcess(req.body,'device_issues');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message);
        }
    }

    @Post('device-requests/metrics/get')
    async getDeviceRequestsMetrics(@Res() res: Response, @Req() req){
        try{
            req.body.filter["role"] = req?.user.role;
            req.body.filter["username"] = req?.user.userName;            
            const result = await this.agService.getMetricsProcess(req.body,'device_requests');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message);
        }
    }

    @Post('devices/metrics/get')
    async getDeviceMetrics(@Res() res: Response, @Req() req){
        try{
            req.body.filter["role"] = req?.user.role;
            req.body.filter["username"] = req?.user.userName;            
            const result = await this.agService.getMetricsProcess(req.body,'devices');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e?.satusCode || 500 ).send(e.message);
        }
    }

}
