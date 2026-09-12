import { Body, Controller, Get, Headers, Inject, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response, Request } from 'express';
import { Req } from '@nestjs/common';
import { problem, SafeCode } from '@luic/platform';
import { IdentityVerifier } from '../identity/authentication';
import { IDENTITY_VERIFIER } from '../identity/controller';
import { CatalogService } from './service';
import { CommandResult } from './commands';
import { catalogOpenApi } from './openapi';

@Controller('api/v1')
export class CatalogController {
  constructor(private readonly service:CatalogService,@Inject(IDENTITY_VERIFIER) private readonly verifier:IdentityVerifier) {}
  private identity(req:Request) {return this.verifier.verify(req.headers.authorization,'staff');}
  private async send(result:Promise<CommandResult>,req:Request,res:Response):Promise<void> {
    const value=await result;
    if(value.replayed)res.setHeader('idempotency-replayed','true');
    if(value.status>=400){problem(req,res,value.status,value.body.code as SafeCode);return;}
    const version=value.body.productVersion??value.body.version;
    if(version)res.setHeader('etag','"'+String(version)+'"');
    if(value.location)res.setHeader('location',value.location);
    res.status(value.status).json(value.body);
  }
  @Get('openapi.json') openapi() {return catalogOpenApi;}
  @Get('store/products/:slug') published(@Param('slug') slug:string) {return this.service.published(slug);}
  @Get('staff/catalog/products') list(@Req() req:Request,@Query() query:unknown) {return this.service.list(this.identity(req),query);}
  @Get('staff/catalog/products/:id') async detail(@Req() req:Request,@Param('id') id:string,@Res({passthrough:true}) res:Response) {
    const result=await this.service.detail(this.identity(req),id);res.setHeader('etag','"'+String(result.version)+'"');return result;
  }
  @Post('staff/catalog/products') create(@Req() req:Request,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.create(this.identity(req),body,req.headers['idempotency-key']),req,res);
  }
  @Patch('staff/catalog/products/:id') edit(@Req() req:Request,@Param('id') id:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.edit(this.identity(req),id,body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
  @Post('staff/catalog/products/:id/variants') variantCreate(@Req() req:Request,@Param('id') id:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.variant(this.identity(req),id,undefined,'create',body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
  @Patch('staff/catalog/products/:id/variants/:variantId') variantEdit(@Req() req:Request,@Param('id') id:string,@Param('variantId') variant:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.variant(this.identity(req),id,variant,'edit',body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
  @Post('staff/catalog/products/:id/variants/:variantId/archive') variantArchive(@Req() req:Request,@Param('id') id:string,@Param('variantId') variant:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.variant(this.identity(req),id,variant,'archive',body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
  @Post('staff/catalog/products/:id/variants/:variantId/prices') price(@Req() req:Request,@Param('id') id:string,@Param('variantId') variant:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.price(this.identity(req),id,variant,body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
  @Post('staff/catalog/products/:id/variants/:variantId/prices/:priceId/closure') closePrice(@Req() req:Request,@Param('id') id:string,@Param('variantId') variant:string,@Param('priceId') price:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.price(this.identity(req),id,variant,body,req.headers['idempotency-key'],req.headers['if-match'],price),req,res);
  }
  @Post('staff/catalog/products/:id/media') media(@Req() req:Request,@Param('id') id:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.media(this.identity(req),id,body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
  @Post('staff/catalog/products/:id/publication') publish(@Req() req:Request,@Param('id') id:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.transition(this.identity(req),id,'publish',body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
  @Post('staff/catalog/products/:id/unpublication') unpublish(@Req() req:Request,@Param('id') id:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.transition(this.identity(req),id,'unpublish',body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
  @Post('staff/catalog/products/:id/archive') archive(@Req() req:Request,@Param('id') id:string,@Body() body:unknown,@Res() res:Response) {
    return this.send(this.service.transition(this.identity(req),id,'archive',body,req.headers['idempotency-key'],req.headers['if-match']),req,res);
  }
}
