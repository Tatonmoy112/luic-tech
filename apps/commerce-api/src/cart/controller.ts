import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { IdentityVerifier } from '../identity/authentication';
import { IDENTITY_VERIFIER } from '../identity/controller';
import { fail, object } from '../identity/validation';
import { sendCommand } from '@luic/platform';
import { CartOwner, CartService, guestHash } from './service';
import { stockCartOpenApi } from './openapi';

@Controller('api/v1')
export class CartController {
  @Get('openapi-stock-cart.json') openapi() { return stockCartOpenApi; }
  constructor(private readonly service: CartService, @Inject(IDENTITY_VERIFIER) private readonly verifier: IdentityVerifier) {}
  private owner(req: Request): CartOwner {
    if (req.headers.authorization && req.headers['x-guest-cart-token']) return fail('BAD_REQUEST');
    return req.headers.authorization ? { identity: this.verifier.verify(req.headers.authorization, 'customer') } : { guestHash: guestHash(req.headers['x-guest-cart-token']) };
  }
  @Post('guest/carts') guest(@Req() req: Request, @Body() body: unknown, @Res() res: Response) {
    if (req.headers.authorization || req.headers['x-guest-cart-token']) return fail('BAD_REQUEST');
    return sendCommand(this.service.guestCreate(body), req, res);
  }
  @Post('customer/cart') create(@Req() req: Request, @Body() body: unknown, @Res() res: Response) { return sendCommand(this.service.get(this.owner(req), true, body), req, res); }
  @Get('customer/cart') get(@Req() req: Request, @Query() query: unknown, @Res() res: Response) { object(query, []); return sendCommand(this.service.get(this.owner(req)), req, res); }
  @Post('customer/cart/items') add(@Req() req: Request, @Body() body: unknown, @Res() res: Response) { return sendCommand(this.service.mutate(this.owner(req), 'add', body, req.headers['idempotency-key'], req.headers['if-match']), req, res); }
  @Patch('customer/cart/items/:variantId') change(@Req() req: Request, @Param('variantId') id: string, @Body() body: unknown, @Res() res: Response) { return sendCommand(this.service.mutate(this.owner(req), 'change', body, req.headers['idempotency-key'], req.headers['if-match'], id), req, res); }
  @Delete('customer/cart/items/:variantId') remove(@Req() req: Request, @Param('variantId') id: string, @Body() body: unknown, @Res() res: Response) { return sendCommand(this.service.mutate(this.owner(req), 'remove', body, req.headers['idempotency-key'], req.headers['if-match'], id), req, res); }
  @Delete('customer/cart/items') clear(@Req() req: Request, @Body() body: unknown, @Res() res: Response) { return sendCommand(this.service.mutate(this.owner(req), 'clear', body, req.headers['idempotency-key'], req.headers['if-match']), req, res); }
  @Post('customer/cart/merge') merge(@Req() req: Request, @Body() body: unknown, @Res() res: Response) {
    const identity = this.verifier.verify(req.headers.authorization, 'customer'), token = req.headers['x-guest-cart-token'];
    if (typeof token !== 'string') return fail('UNAUTHORIZED');
    return sendCommand(this.service.merge(identity, token, body, req.headers['idempotency-key'], req.headers['if-match']), req, res);
  }
}
