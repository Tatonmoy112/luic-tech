import { Body, Controller, Get, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { sendCommand } from '@luic/platform';
import type { IdentityVerifier } from '../identity/authentication';
import { IDENTITY_VERIFIER } from '../identity/controller';
import { InventoryService } from './service';

@Controller('api/v1/staff/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService, @Inject(IDENTITY_VERIFIER) private readonly verifier: IdentityVerifier) {}
  @Get('positions') list(@Req() req: Request, @Query() query: unknown) { return this.service.read(this.verifier.verify(req.headers.authorization, 'staff'), undefined, query); }
  @Get('positions/:id') async detail(@Req() req: Request, @Param('id') id: string, @Query() query: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.read(this.verifier.verify(req.headers.authorization, 'staff'), id, query);
    res.setHeader('etag', '"' + String(result.version) + '"'); return result;
  }
  @Get('positions/:id/movements') ledger(@Req() req: Request, @Param('id') id: string, @Query() query: unknown) { return this.service.read(this.verifier.verify(req.headers.authorization, 'staff'), id, query, true); }
  @Post('adjustments') adjust(@Req() req: Request, @Body() body: unknown, @Res() res: Response) {
    return sendCommand(this.service.adjust(this.verifier.verify(req.headers.authorization, 'staff'), body, req.headers['idempotency-key'], req.headers['if-match']), req, res);
  }
}
