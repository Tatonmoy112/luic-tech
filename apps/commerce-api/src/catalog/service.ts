import { Database, TransactionContext } from '@luic/platform';
import { VerifiedIdentity } from '../identity/authentication';
import { authorizeStaff } from '../identity/service';
import { CatalogCommands, catalogEvidence, CommandResult } from './commands';
import { fail, hash, Input, instant, mediaInput, object, pageInput, priceInput, productInput, reasonInput, slug, string, uuid, variantInput, version } from './validation';

interface Product {id:string;slug:string;title:string;shortDescription:string|null;description:string|null;status:string;version:string;brandId:string|null;publishedAt:Date|null;createdAt:Date}
const productColumns='id,slug,title,short_description AS "shortDescription",description,status,version,brand_id AS "brandId",published_at AS "publishedAt",created_at AS "createdAt"';
const variantColumns='id,product_id AS "productId",sku,title,barcode,status,version,max_order_quantity AS "maxOrderQuantity",weight_grams AS "weightGrams"';
export class CatalogService {
  private readonly commands:CatalogCommands;
  constructor(private readonly db:Database) {this.commands=new CatalogCommands(db);}
  private async product(tx:TransactionContext,id:string,lock=true):Promise<Product> {
    const row=(await tx.query<Product>(`SELECT ${productColumns} FROM catalog.products WHERE id=$1${lock?' FOR UPDATE':''}`,[id])).rows[0];
    if(!row) return fail('NOT_FOUND'); return row;
  }
  private draft(p:Product,expected:string):void {if(p.version!==expected)fail('PRECONDITION_FAILED');if(p.status!=='draft')fail('CONFLICT');}
  private async categories(tx:TransactionContext,ids:unknown):Promise<void> {
    if(ids===undefined) return;
    const rows=(await tx.query('SELECT id FROM catalog.categories WHERE id=ANY($1::uuid[]) AND status<>$2',[ids,'archived'])).rows;
    if(rows.length!==(ids as string[]).length) fail('UNPROCESSABLE');
  }
  private async brand(tx:TransactionContext,id:unknown):Promise<void> {
    if(id!==undefined && id!==null && !(await tx.query("SELECT 1 FROM catalog.brands WHERE id=$1 AND status='active'",[id])).rowCount)fail('UNPROCESSABLE');
  }
  private async assignCategories(tx:TransactionContext,id:string,ids:unknown):Promise<void> {
    if(ids===undefined)return;
    await tx.query('DELETE FROM catalog.product_categories WHERE product_id=$1',[id]);
    for(const [i,category] of (ids as string[]).entries()) await tx.query('INSERT INTO catalog.product_categories(product_id,category_id,is_primary,sort_order) VALUES($1,$2,$3,$4)',[id,category,i===0,i]);
  }
  private async bump(tx:TransactionContext,id:string):Promise<Product> {return (await tx.query<Product>(`UPDATE catalog.products SET version=version+1,updated_at=now() WHERE id=$1 RETURNING ${productColumns}`,[id])).rows[0]!;}
  async create(identity:VerifiedIdentity,body:unknown,key:unknown):Promise<CommandResult> {
    const input=productInput(body,true);
    return this.commands.run(identity,'catalog.edit','product.create',key,input,async(tx,actor)=>{
      await this.categories(tx,input.categoryIds);await this.brand(tx,input.brandId);
      const p=(await tx.query<Product>(`INSERT INTO catalog.products(slug,title,short_description,description,brand_id) VALUES($1,$2,$3,$4,$5) RETURNING ${productColumns}`,
        [input.slug,input.title,input.shortDescription??null,input.description??null,input.brandId??null])).rows[0]!;
      await this.assignCategories(tx,p.id,input.categoryIds);
      await catalogEvidence(tx,actor,p,'product.created','draft_create');
      return {status:201,body:{id:p.id,slug:p.slug,status:p.status,version:p.version,createdAt:p.createdAt},location:'/api/v1/staff/catalog/products/'+p.id};
    });
  }
  async edit(identity:VerifiedIdentity,idValue:unknown,body:unknown,key:unknown,match:unknown):Promise<CommandResult> {
    const id=uuid(idValue),input=productInput(body,false),expected=version(match);
    return this.commands.run(identity,'catalog.edit','product.edit:'+id,key,{input,expected},async(tx,actor)=>{
      const p=await this.product(tx,id);this.draft(p,expected);
      if(p.publishedAt && input.slug!==undefined && input.slug!==p.slug)fail('CONFLICT');
      await this.categories(tx,input.categoryIds);await this.brand(tx,input.brandId);
      const value=(key:string,current:unknown)=>input[key]===undefined?current:input[key];
      await tx.query('UPDATE catalog.products SET slug=$2,title=$3,short_description=$4,description=$5,brand_id=$6 WHERE id=$1',
        [id,value('slug',p.slug),value('title',p.title),value('shortDescription',p.shortDescription),value('description',p.description),value('brandId',p.brandId)]);
      await this.assignCategories(tx,id,input.categoryIds);
      const updated=await this.bump(tx,id);await catalogEvidence(tx,actor,updated,'product.changed','draft_edit');
      return {status:200,body:{id,slug:updated.slug,status:updated.status,version:updated.version}};
    });
  }
  async list(identity:VerifiedIdentity,query:unknown):Promise<Record<string,unknown>> {
    const page=pageInput(query);
    return this.db.transaction(async tx=>{
      await authorizeStaff(tx,identity,'catalog.edit');
      const rows=(await tx.query(`SELECT id,slug,title,status,version FROM catalog.products WHERE ($1::text IS NULL OR status=$1)
        AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT $3`,[page.status,page.after,page.limit+1])).rows;
      const more=rows.length>page.limit; if(more)rows.pop();
      return {items:rows,nextCursor:more?Buffer.from(JSON.stringify({v:1,after:rows.at(-1)!.id,filter:hash({status:page.status,limit:page.limit})})).toString('base64url'):null};
    });
  }
  async detail(identity:VerifiedIdentity,idValue:unknown):Promise<Record<string,unknown>> {
    const id=uuid(idValue);
    return this.db.transaction(async tx=>{
      await authorizeStaff(tx,identity,'catalog.edit');const p=await this.product(tx,id);
      const variants=(await tx.query(`SELECT ${variantColumns} FROM catalog.product_variants WHERE product_id=$1 ORDER BY id LIMIT 50`,[id])).rows;
      const prices=(await tx.query(`SELECT pr.id,pr.variant_id AS "variantId",pr.unit_price_minor AS "unitPriceMinor",pr.compare_at_minor AS "compareAtMinor",pr.currency,pr.valid_from AS "validFrom",pr.valid_to AS "validTo",pr.version
        FROM catalog.price_records pr JOIN catalog.product_variants v ON v.id=pr.variant_id WHERE v.product_id=$1 ORDER BY pr.valid_from DESC,pr.id LIMIT 100`,[id])).rows;
      const media=(await tx.query(`SELECT pm.id,pm.media_asset_id AS "mediaAssetId",pm.variant_id AS "variantId",pm.role,pm.alt_text AS "altText",pm.is_primary AS "isPrimary",pm.sort_order AS "sortOrder",ma.state
        FROM catalog.product_media pm JOIN catalog.media_assets ma ON ma.id=pm.media_asset_id WHERE pm.product_id=$1 ORDER BY pm.sort_order,pm.id LIMIT 20`,[id])).rows;
      const categoryIds=(await tx.query('SELECT category_id FROM catalog.product_categories WHERE product_id=$1 ORDER BY sort_order,category_id',[id])).rows.map(r=>r.category_id);
      return {...p,categoryIds,variants,prices,media};
    });
  }
  private async attributes(tx:TransactionContext,id:string,values:unknown):Promise<void> {
    if(values===undefined)return;
    for(const item of values as Input[]) {
      if(!(await tx.query(`SELECT 1 FROM catalog.attribute_values v JOIN catalog.attributes a ON a.id=v.attribute_id
        WHERE v.id=$1 AND a.id=$2 AND v.status='active' AND a.status='active'`,[item.valueId,item.attributeId])).rowCount)fail('UNPROCESSABLE');
    }
    await tx.query('DELETE FROM catalog.variant_attribute_values WHERE variant_id=$1',[id]);
    for(const item of values as Input[])await tx.query('INSERT INTO catalog.variant_attribute_values(variant_id,attribute_id,attribute_value_id) VALUES($1,$2,$3)',[id,item.attributeId,item.valueId]);
  }
  async variant(identity:VerifiedIdentity,productValue:unknown,variantValue:unknown,action:'create'|'edit'|'archive',body:unknown,key:unknown,match:unknown):Promise<CommandResult> {
    const productId=uuid(productValue),id=action==='create'?null:uuid(variantValue),expected=version(match);
    const input=action==='archive'?reasonInput(body):variantInput(body,action==='create');
    return this.commands.run(identity,'catalog.edit','variant.'+action+':'+productId+(id?':'+id:''),key,{input,expected},async(tx,actor)=>{
      const p=await this.product(tx,productId);this.draft(p,expected);let variant;
      if(action==='create') {
        if(Number((await tx.query('SELECT count(*) FROM catalog.product_variants WHERE product_id=$1',[productId])).rows[0]!.count)>=50)fail('CONFLICT');
        variant=(await tx.query(`INSERT INTO catalog.product_variants(product_id,sku,title,barcode,max_order_quantity,weight_grams)
          VALUES($1,$2,$3,$4,$5,$6) RETURNING ${variantColumns}`,[productId,input.sku,input.title,input.barcode??null,input.maxOrderQuantity??null,input.weightGrams??null])).rows[0]!;
        await this.attributes(tx,variant.id,input.attributeValues);
      } else {
        const old=(await tx.query(`SELECT ${variantColumns} FROM catalog.product_variants WHERE id=$1 AND product_id=$2 FOR UPDATE`,[id,productId])).rows[0];
        if(!old)fail('NOT_FOUND');if(old.status==='archived')fail('CONFLICT');
        if(action==='archive') variant=(await tx.query(`UPDATE catalog.product_variants SET status='archived',archived_at=now(),version=version+1,updated_at=now() WHERE id=$1 RETURNING ${variantColumns}`,[id])).rows[0]!;
        else {
          if(input.sku!==undefined && input.sku!==old.sku)fail('CONFLICT');
          const val=(k:string)=>input[k]===undefined?old[k]:input[k];
          variant=(await tx.query(`UPDATE catalog.product_variants SET title=$2,barcode=$3,max_order_quantity=$4,weight_grams=$5,version=version+1,updated_at=now() WHERE id=$1 RETURNING ${variantColumns}`,
            [id,val('title'),val('barcode'),val('maxOrderQuantity'),val('weightGrams')])).rows[0]!;
          await this.attributes(tx,id!,input.attributeValues);
        }
      }
      const updated=await this.bump(tx,productId);await catalogEvidence(tx,actor,updated,'product.changed','variant_'+action,{variantId:variant.id});
      return {status:action==='create'?201:200,body:{...variant,productVersion:updated.version}};
    });
  }
  async price(identity:VerifiedIdentity,productValue:unknown,variantValue:unknown,body:unknown,key:unknown,match:unknown,priceValue?:unknown):Promise<CommandResult> {
    const productId=uuid(productValue),variantId=uuid(variantValue),expected=version(match),priceId=priceValue===undefined?null:uuid(priceValue);
    const input=priceId?object(body,['validTo','reason']):priceInput(body);
    if(priceId){instant(input.validTo);string(input.reason,200);}
    return this.commands.run(identity,'catalog.edit','price.'+(priceId?'close':'create')+':'+productId+':'+variantId+(priceId?':'+priceId:''),key,{input,expected},async(tx,actor)=>{
      const p=await this.product(tx,productId);if(p.version!==expected)fail('PRECONDITION_FAILED');if(p.status==='archived')fail('CONFLICT');
      const variant=(await tx.query('SELECT id FROM catalog.product_variants WHERE id=$1 AND product_id=$2 AND status<>$3 FOR UPDATE',[variantId,productId,'archived'])).rows[0];
      if(!variant)fail('NOT_FOUND');
      let price;
      if(priceId) {
        price=(await tx.query(`UPDATE catalog.price_records SET valid_to=$3,version=version+1,updated_at=now() WHERE id=$1 AND variant_id=$2
          RETURNING id,unit_price_minor AS "unitPriceMinor",valid_from AS "validFrom",valid_to AS "validTo",version`,[priceId,variantId,input.validTo])).rows[0];if(!price)fail('NOT_FOUND');
      } else price=(await tx.query(`INSERT INTO catalog.price_records(variant_id,currency,unit_price_minor,compare_at_minor,valid_from,valid_to,reason,created_by_staff_id)
        VALUES($1,'BDT',$2,$3,$4,$5,$6,$7) RETURNING id,unit_price_minor AS "unitPriceMinor",valid_from AS "validFrom",valid_to AS "validTo",version`,
        [variantId,input.unitPriceMinor,input.compareAtMinor??null,input.validFrom,input.validTo??null,input.reason,actor])).rows[0]!;
      const updated=await this.bump(tx,productId);await catalogEvidence(tx,actor,updated,'product.price_changed',input.reason as string,{priceId:price.id,variantId});
      return {status:priceId?200:201,body:{...price,currency:'BDT',productVersion:updated.version}};
    });
  }
  async media(identity:VerifiedIdentity,productValue:unknown,body:unknown,key:unknown,match:unknown):Promise<CommandResult> {
    const id=uuid(productValue),input=mediaInput(body),expected=version(match);
    return this.commands.run(identity,'catalog.edit','product.media:'+id,key,{input,expected},async(tx,actor)=>{
      const p=await this.product(tx,id);this.draft(p,expected);
      if(!(await tx.query("SELECT 1 FROM catalog.media_assets WHERE id=$1 AND state='approved'",[input.mediaAssetId])).rowCount)fail('UNPROCESSABLE');
      if(input.variantId && !(await tx.query("SELECT 1 FROM catalog.product_variants WHERE id=$1 AND product_id=$2 AND status<>'archived'",[input.variantId,id])).rowCount)fail('UNPROCESSABLE');
      if(Number((await tx.query('SELECT count(*) FROM catalog.product_media WHERE product_id=$1',[id])).rows[0]!.count)>=20)fail('CONFLICT');
      const role=input.role??'gallery';
      if(input.isPrimary===true)await tx.query(`UPDATE catalog.product_media SET is_primary=false,version=version+1,updated_at=now() WHERE product_id=$1 AND variant_id IS NOT DISTINCT FROM $2::uuid AND role=$3 AND is_primary`,[id,input.variantId??null,role]);
      const media=(await tx.query(`INSERT INTO catalog.product_media(product_id,variant_id,media_asset_id,role,alt_text,sort_order,is_primary)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[id,input.variantId??null,input.mediaAssetId,role,input.altText??null,input.sortOrder??0,input.isPrimary??false])).rows[0]!;
      const updated=await this.bump(tx,id);await catalogEvidence(tx,actor,updated,'product.changed','media_attach',{mediaLinkId:media.id});
      return {status:201,body:{id:media.id,productId:id,productVersion:updated.version}};
    });
  }
  private async eligible(tx:TransactionContext,p:Product,at:Date):Promise<boolean> {
    if(!p.description?.trim())return false;
    const categories=(await tx.query(`WITH RECURSIVE ancestors AS (
      SELECT c.id,c.parent_id,c.status FROM catalog.categories c JOIN catalog.product_categories pc ON pc.category_id=c.id WHERE pc.product_id=$1
      UNION SELECT c.id,c.parent_id,c.status FROM catalog.categories c JOIN ancestors a ON c.id=a.parent_id)
      SELECT count(*) AS count, bool_and(status='published') AS published FROM ancestors`,[p.id])).rows[0]!;
    if(categories.count==='0' || !categories.published)return false;
    if(p.brandId && !(await tx.query("SELECT 1 FROM catalog.brands WHERE id=$1 AND status='active'",[p.brandId])).rowCount)return false;
    const media=await tx.query(`SELECT 1 FROM catalog.product_media pm JOIN catalog.media_assets m ON m.id=pm.media_asset_id
      WHERE pm.product_id=$1 AND pm.variant_id IS NULL AND pm.is_primary AND m.state='approved' AND length(btrim(coalesce(pm.alt_text,m.default_alt_text,'')))>0 LIMIT 1`,[p.id]);
    if(!media.rowCount)return false;
    const variants=(await tx.query(`SELECT count(*) AS count,bool_and(EXISTS(SELECT 1 FROM catalog.price_records pr WHERE pr.variant_id=v.id AND pr.valid_from<=$2 AND (pr.valid_to IS NULL OR pr.valid_to>$2))) AS priced
      FROM catalog.product_variants v WHERE v.product_id=$1 AND v.status<>'archived'`,[p.id,at])).rows[0]!;
    const invalidAttributes=await tx.query(`SELECT 1 FROM catalog.variant_attribute_values va JOIN catalog.product_variants v ON v.id=va.variant_id
      JOIN catalog.attributes a ON a.id=va.attribute_id JOIN catalog.attribute_values av ON av.id=va.attribute_value_id
      WHERE v.product_id=$1 AND v.status<>'archived' AND (a.status<>'active' OR av.status<>'active') LIMIT 1`,[p.id]);
    return variants.count!=='0' && variants.priced===true && !invalidAttributes.rowCount;
  }
  async transition(identity:VerifiedIdentity,idValue:unknown,action:'publish'|'unpublish'|'archive',body:unknown,key:unknown,match:unknown):Promise<CommandResult> {
    const id=uuid(idValue),input=reasonInput(body),expected=version(match);
    return this.commands.run(identity,'catalog.publish','product.'+action+':'+id,key,{input,expected},async(tx,actor)=>{
      const p=await this.product(tx,id);if(p.version!==expected)fail('PRECONDITION_FAILED');
      if(p.status==='archived' || (action==='publish' && p.status!=='draft') || (action==='unpublish' && p.status!=='published'))fail('CONFLICT');
      await tx.query('SELECT id FROM catalog.product_variants WHERE product_id=$1 ORDER BY id FOR UPDATE',[id]);
      const at=(await tx.query('SELECT clock_timestamp() AS at')).rows[0]!.at as Date;
      if(action==='publish' && !await this.eligible(tx,p,at))fail('UNPROCESSABLE');
      const status=action==='publish'?'published':action==='archive'?'archived':'draft';
      await tx.query(`UPDATE catalog.product_variants SET status=$2,version=version+1,updated_at=now(),
        published_at=CASE WHEN $2='published' THEN coalesce(published_at,now()) ELSE published_at END,
        archived_at=CASE WHEN $2='archived' THEN now() ELSE archived_at END WHERE product_id=$1 AND status<>'archived'`,[id,status]);
      const updated=(await tx.query<Product>(`UPDATE catalog.products SET status=$2,version=version+1,updated_at=now(),
        published_at=CASE WHEN $2='published' THEN coalesce(published_at,now()) ELSE published_at END,
        archived_at=CASE WHEN $2='archived' THEN now() ELSE archived_at END WHERE id=$1 RETURNING ${productColumns}`,[id,status])).rows[0]!;
      await catalogEvidence(tx,actor,updated,'product.'+(action==='publish'?'published':action==='archive'?'archived':'unpublished'),input.reasonCode as string);
      return {status:200,body:{id,slug:updated.slug,status,version:updated.version}};
    });
  }
  // Transaction-sharing read port: cart intent observes source eligibility, never a checkout quote.
  async observe(tx:TransactionContext,ids:string[]):Promise<Map<string,import('./observation').VariantObservation>> {
    const at=(await tx.query('SELECT clock_timestamp() AS at')).rows[0]!.at as Date;
    const rows=(await tx.query(`SELECT v.id,v.product_id,v.title,v.sku,v.status,coalesce(v.max_order_quantity,20) AS cap,
      pr.unit_price_minor FROM catalog.product_variants v LEFT JOIN catalog.price_records pr ON pr.variant_id=v.id
      AND pr.valid_from<=$2 AND (pr.valid_to IS NULL OR pr.valid_to>$2) WHERE v.id=ANY($1::uuid[])`,[ids,at])).rows;
    const eligibility=new Map<string,boolean>();
    for(const productId of [...new Set(rows.map(r=>r.product_id as string))].sort()) {
      const p=(await tx.query<Product>(`SELECT ${productColumns} FROM catalog.products WHERE id=$1`,[productId])).rows[0];
      eligibility.set(productId,!!p && p.status==='published' && await this.eligible(tx,p,at));
    }
    return new Map(rows.map(r=>[r.id as string,{id:r.id,title:r.title,sku:r.sku,maxQuantity:r.cap,
      unitPriceMinor:r.unit_price_minor??null,eligible:r.status==='published' && eligibility.get(r.product_id)===true && r.unit_price_minor!==null}]));
  }
  async published(slugValue:unknown):Promise<Record<string,unknown>> {
    const value=slug(slugValue);
    return this.db.transaction(async tx=>{
      await tx.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const p=(await tx.query<Product>(`SELECT ${productColumns} FROM catalog.products WHERE slug=$1 AND status='published'`,[value])).rows[0];
      if(!p)fail('NOT_FOUND');const at=(await tx.query('SELECT transaction_timestamp() AS at')).rows[0]!.at as Date;
      if(!await this.eligible(tx,p,at))fail('NOT_FOUND');
      const variants=(await tx.query(`SELECT v.id,v.sku,v.title,pr.unit_price_minor AS "unitPriceMinor",pr.currency,'unknown' AS "indicativeAvailability"
        FROM catalog.product_variants v JOIN catalog.price_records pr ON pr.variant_id=v.id AND pr.valid_from<=$2 AND (pr.valid_to IS NULL OR pr.valid_to>$2)
        WHERE v.product_id=$1 AND v.status='published' ORDER BY v.id LIMIT 50`,[p.id,at])).rows;
      if(!variants.length)fail('NOT_FOUND');
      const media=(await tx.query(`SELECT m.public_versioned_path AS path,coalesce(pm.alt_text,m.default_alt_text) AS "altText",m.width_px AS width,m.height_px AS height
        FROM catalog.product_media pm JOIN catalog.media_assets m ON m.id=pm.media_asset_id
        LEFT JOIN catalog.product_variants v ON v.id=pm.variant_id WHERE pm.product_id=$1 AND m.state='approved'
        AND (pm.variant_id IS NULL OR v.status='published') ORDER BY pm.sort_order,pm.id LIMIT 20`,[p.id])).rows;
      const attributes=(await tx.query(`SELECT va.variant_id,a.code,av.display_value AS value FROM catalog.variant_attribute_values va
        JOIN catalog.product_variants v ON v.id=va.variant_id JOIN catalog.attributes a ON a.id=va.attribute_id JOIN catalog.attribute_values av ON av.id=va.attribute_value_id
        WHERE v.product_id=$1 AND v.status='published' ORDER BY a.code LIMIT 1000`,[p.id])).rows;
      return {id:p.id,slug:p.slug,title:p.title,description:p.description,shortDescription:p.shortDescription,media,
        variants:variants.map(v=>({...v,attributes:attributes.filter(a=>a.variant_id===v.id).map(a=>({code:a.code,value:a.value}))}))};
    });
  }
}
