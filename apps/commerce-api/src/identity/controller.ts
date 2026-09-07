import { Body, Controller, Delete, Get, Headers, Inject, Param, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { IdentityVerifier } from './authentication';
import { IdentityService } from './service';

export const IDENTITY_VERIFIER = Symbol('IDENTITY_VERIFIER');
@Controller('api/v1')
export class IdentityController {
  constructor(private readonly service: IdentityService, @Inject(IDENTITY_VERIFIER) private readonly verifier: IdentityVerifier) {}
  private async tagged(result: Promise<any>, response: Response): Promise<any> {
    const data = await result;
    if (data.version) response.setHeader('etag', '"' + data.version + '"');
    return data;
  }
  @Get('customer/profile') profile(@Headers('authorization') auth: string | undefined, @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.profile(this.verifier.verify(auth, 'customer')), res);
  }
  @Patch('customer/profile') editProfile(@Headers('authorization') auth: string | undefined, @Headers('if-match') match: string | undefined,
    @Body() body: unknown, @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.profile(this.verifier.verify(auth, 'customer'), body ?? null, match), res);
  }
  @Get('customer/addresses') addresses(@Headers('authorization') auth: string | undefined): Promise<any> {
    return this.service.addresses(this.verifier.verify(auth, 'customer'), 'list');
  }
  @Post('customer/addresses') createAddress(@Headers('authorization') auth: string | undefined, @Body() body: unknown,
    @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.addresses(this.verifier.verify(auth, 'customer'), 'create', body), res);
  }
  @Patch('customer/addresses/:id') editAddress(@Headers('authorization') auth: string | undefined, @Headers('if-match') match: string | undefined,
    @Param('id') id: string, @Body() body: unknown, @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.addresses(this.verifier.verify(auth, 'customer'), 'patch', body, id, match), res);
  }
  @Delete('customer/addresses/:id') deleteAddress(@Headers('authorization') auth: string | undefined, @Headers('if-match') match: string | undefined,
    @Param('id') id: string, @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.addresses(this.verifier.verify(auth, 'customer'), 'delete', undefined, id, match), res);
  }
  @Get('staff/me') me(@Headers('authorization') auth: string | undefined): Promise<any> { return this.service.me(this.verifier.verify(auth, 'staff')); }
  @Get('staff/access/roles') roles(@Headers('authorization') auth: string | undefined): Promise<any> { return this.service.access(this.verifier.verify(auth, 'staff'), 'roles'); }
  @Post('staff/access/accounts') createStaff(@Headers('authorization') auth: string | undefined, @Body() body: unknown,
    @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.access(this.verifier.verify(auth, 'staff'), 'create', body), res);
  }
  @Get('staff/access/accounts/:id') staff(@Headers('authorization') auth: string | undefined, @Param('id') id: string,
    @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.access(this.verifier.verify(auth, 'staff'), 'detail', undefined, id), res);
  }
  @Post('staff/access/accounts/:id/grants') grant(@Headers('authorization') auth: string | undefined, @Headers('if-match') match: string | undefined,
    @Param('id') id: string, @Body() body: unknown, @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.access(this.verifier.verify(auth, 'staff'), 'grant', body, id, undefined, match), res);
  }
  @Post('staff/access/accounts/:id/grants/:assignmentId/revocation') revoke(@Headers('authorization') auth: string | undefined,
    @Headers('if-match') match: string | undefined, @Param('id') id: string, @Param('assignmentId') assignmentId: string,
    @Body() body: unknown, @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.access(this.verifier.verify(auth, 'staff'), 'revoke', body, id, assignmentId, match), res);
  }
  @Patch('staff/access/accounts/:id') status(@Headers('authorization') auth: string | undefined, @Headers('if-match') match: string | undefined,
    @Param('id') id: string, @Body() body: unknown, @Res({ passthrough: true }) res: Response): Promise<any> {
    return this.tagged(this.service.access(this.verifier.verify(auth, 'staff'), 'status', body, id, undefined, match), res);
  }
}
