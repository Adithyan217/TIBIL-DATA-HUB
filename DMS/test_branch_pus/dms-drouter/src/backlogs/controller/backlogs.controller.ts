import {Controller , HttpStatus , Post , Req , Res} from '@nestjs/common';
import {PbacklogsService} from '../services/pbacklogs.service';
@Controller('drouter')
export class BacklogsController {

    constructor(private pB: PbacklogsService) {
    }

    @Post('backlogs')
    async pBacklogs(@Res() res: any, @Req() req:any){
        try{
            const result:any = await this.pB.reTransactPayment();
            res.status(result.status).send(result.data);

        }catch (e) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({error: e});
        }
    }
}
