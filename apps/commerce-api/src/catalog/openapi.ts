// Initial local catalog contract. Kept as an executable object; export script writes the reviewable JSON.
type Schema = Record<string,unknown>;
const text=(maxLength:number):Schema=>({type:'string',minLength:1,maxLength});
const id:Schema={type:'string',format:'uuid'};
const decimal:Schema={type:'string',pattern:'^[1-9][0-9]{0,18}$',description:'Exact positive signed-bigint decimal string, maximum 9223372036854775807.'};
const time:Schema={type:'string',format:'date-time',pattern:'^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$'};
const nullable=(schema:Schema):Schema=>({...schema,nullable:true});
const obj=(properties:Record<string,Schema>,required:string[]=[]):Schema=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const ref=(name:string):Schema=>({$ref:'#/components/schemas/'+name});
const arr=(items:Schema,maxItems:number):Schema=>({type:'array',items,maxItems});
const productFields={title:text(200),slug:{...text(160),pattern:'^[a-z0-9]+(-[a-z0-9]+)*$'},shortDescription:nullable(text(1000)),description:nullable(text(20000)),brandId:nullable(id),categoryIds:{...arr(id,20),uniqueItems:true}};
const variantFields={sku:{...text(64),pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$'},title:text(200),barcode:nullable(text(64)),maxOrderQuantity:nullable({type:'integer',minimum:1,maximum:20}),weightGrams:nullable({type:'integer',minimum:1,maximum:2147483647}),attributeValues:arr(obj({attributeId:id,valueId:id},['attributeId','valueId']),20)};
const reason={reasonCode:{...text(64),pattern:'^[a-z][a-z0-9_]*$'},reason:text(200)};
const resultFields={id,slug:text(160),status:{type:'string',enum:['draft','published','archived']},version:decimal};
const variantResult={id,productId:id,sku:text(64),title:text(200),barcode:nullable(text(64)),status:resultFields.status,version:decimal,maxOrderQuantity:nullable({type:'integer'}),weightGrams:nullable({type:'integer'})};
const priceResult={id,unitPriceMinor:decimal,validFrom:time,validTo:nullable(time),version:decimal,currency:{type:'string',enum:['BDT']},productVersion:decimal};
const schemas:Record<string,Schema>={
  ProductCreate:obj(productFields,['title','slug']),ProductEdit:{...obj(productFields),minProperties:1},
  VariantCreate:obj(variantFields,['sku','title']),VariantEdit:{...obj(variantFields),minProperties:1},
  Reason:obj(reason,['reasonCode']),
  PriceCreate:obj({unitPriceMinor:decimal,compareAtMinor:nullable(decimal),validFrom:time,validTo:nullable(time),reason:text(200)},['unitPriceMinor','validFrom','reason']),
  PriceClose:obj({validTo:time,reason:text(200)},['validTo','reason']),
  MediaAttach:obj({mediaAssetId:id,variantId:nullable(id),role:{type:'string',enum:['gallery','hero']},altText:nullable(text(200)),sortOrder:{type:'integer',minimum:0,maximum:19},isPrimary:{type:'boolean'}},['mediaAssetId']),
  ProductResult:obj(resultFields,Object.keys(resultFields)),
  ProductCreated:obj({...resultFields,createdAt:time},[...Object.keys(resultFields),'createdAt']),
  VariantResult:obj({...variantResult,productVersion:decimal},[...Object.keys(variantResult),'productVersion']),
  PriceResult:obj(priceResult,Object.keys(priceResult)),MediaResult:obj({id,productId:id,productVersion:decimal},['id','productId','productVersion']),
  ProductList:obj({items:arr(obj({...resultFields,title:text(200)},[...Object.keys(resultFields),'title']),100),nextCursor:nullable(text(512))},['items','nextCursor']),
  ProductDetail:obj({...resultFields,title:text(200),shortDescription:nullable(text(1000)),description:nullable(text(20000)),brandId:nullable(id),publishedAt:nullable(time),createdAt:time,
    categoryIds:arr(id,20),variants:arr(obj(variantResult,Object.keys(variantResult)),50),
    prices:arr(obj({id,variantId:id,unitPriceMinor:decimal,compareAtMinor:nullable(decimal),currency:{type:'string',enum:['BDT']},validFrom:time,validTo:nullable(time),version:decimal},['id','variantId','unitPriceMinor','compareAtMinor','currency','validFrom','validTo','version']),100),
    media:arr(obj({id,mediaAssetId:id,variantId:nullable(id),role:text(20),altText:nullable(text(200)),isPrimary:{type:'boolean'},sortOrder:{type:'integer'},state:{type:'string',enum:['pending','approved','rejected']}},['id','mediaAssetId','variantId','role','altText','isPrimary','sortOrder','state']),20)},
    [...Object.keys(resultFields),'title','shortDescription','description','brandId','publishedAt','createdAt','categoryIds','variants','prices','media']),
  PublishedProduct:obj({id,slug:text(160),title:text(200),description:text(20000),shortDescription:nullable(text(1000)),
    media:arr(obj({path:text(300),altText:nullable(text(200)),width:{type:'integer'},height:{type:'integer'}},['path','altText','width','height']),20),
    variants:arr(obj({id,sku:text(64),title:text(200),unitPriceMinor:decimal,currency:{type:'string',enum:['BDT']},indicativeAvailability:{type:'string',enum:['unknown']},attributes:arr(obj({code:text(64),value:text(100)},['code','value']),20)},['id','sku','title','unitPriceMinor','currency','indicativeAvailability','attributes']),50)},
    ['id','slug','title','description','shortDescription','media','variants']),
  Problem:obj({type:{type:'string'},title:{type:'string'},status:{type:'integer'},code:{type:'string'},detail:{type:'string'},instance:{type:'string'},correlationId:id},['type','title','status','code','detail','instance','correlationId']),
};
const paths:Record<string,unknown>={};
function route(path:string,method:string,operationId:string,response:string,status:number,body?:string,permission?:string,match=false):void {
  const parameters:Schema[]=[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({name:m[1],in:'path',required:true,schema:m[1]==='slug'?productFields.slug:id}));
  if(body)parameters.push({name:'Idempotency-Key',in:'header',required:true,schema:id});
  if(match)parameters.push({name:'If-Match',in:'header',required:true,schema:{type:'string',pattern:'^"[1-9][0-9]{0,18}"$',description:'Current PRODUCT aggregate version, including variant/media/price operations.'}});
  if(operationId==='listCatalogProducts')parameters.push(
    {name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},
    {name:'status',in:'query',schema:resultFields.status},
    {name:'cursor',in:'query',schema:text(512)});
  const responses:Record<string,unknown>={[status]:{description:'Success; no-store, exact decimal versions and prices.',headers:{'Cache-Control':{schema:{type:'string',enum:['no-store']}},'X-Correlation-Id':{schema:id},ETag:{schema:{type:'string'}},'Idempotency-Replayed':{schema:{type:'string',enum:['true']}},Location:{schema:{type:'string'}}},content:{'application/json':{schema:ref(response)}}}};
  for(const code of [400,401,403,404,409,412,413,422,428,503])responses[code]={description:'Safe problem; '+({401:'missing/invalid staff credentials',403:'current permission denied',409:'state/key/interval conflict',412:'stale product version',422:'publication/reference requirements not met',428:'missing If-Match',503:'authority unavailable or commit unknown'}[code]??'request rejected'),content:{'application/problem+json':{schema:ref('Problem')}}};
  const existing=(paths[path]??{}) as Record<string,unknown>;
  existing[method]={operationId,summary:operationId,security:permission?[{StaffBearer:[]}]:[],...(permission?{'x-permission':permission}:{}),parameters,
    ...(body?{requestBody:{required:true,content:{'application/json':{schema:ref(body)}}}}:{}),responses};paths[path]=existing;
}
const root='/staff/catalog/products',product=root+'/{id}',variant=product+'/variants/{variantId}';
route(root,'post','createCatalogProduct','ProductCreated',201,'ProductCreate','catalog.edit');
route(root,'get','listCatalogProducts','ProductList',200,undefined,'catalog.edit');
route(product,'get','getCatalogProduct','ProductDetail',200,undefined,'catalog.edit');
route(product,'patch','editCatalogProduct','ProductResult',200,'ProductEdit','catalog.edit',true);
route(product+'/variants','post','createCatalogVariant','VariantResult',201,'VariantCreate','catalog.edit',true);
route(variant,'patch','editCatalogVariant','VariantResult',200,'VariantEdit','catalog.edit',true);
route(variant+'/archive','post','archiveCatalogVariant','VariantResult',200,'Reason','catalog.edit',true);
route(variant+'/prices','post','createCatalogPrice','PriceResult',201,'PriceCreate','catalog.edit',true);
route(variant+'/prices/{priceId}/closure','post','closeCatalogPrice','PriceResult',200,'PriceClose','catalog.edit',true);
route(product+'/media','post','attachCatalogMedia','MediaResult',201,'MediaAttach','catalog.edit',true);
for(const [suffix,name] of [['publication','publish'],['unpublication','unpublish'],['archive','archive']])route(product+'/'+suffix,'post',name+'CatalogProduct','ProductResult',200,'Reason','catalog.publish',true);
route('/store/products/{slug}','get','getPublishedProduct','PublishedProduct',200);
export const catalogOpenApi={openapi:'3.0.3',info:{title:'Luic synthetic local catalog',version:'1.0.0',description:'U03/B004. No frontend, real provider, upload/inspection, stock or order capability. Public paths are synthetic metadata. All existing aggregate writes use the product ETag. Staff requires signed local MFA and current DB grants.'},servers:[{url:'/api/v1'}],paths,components:{securitySchemes:{StaffBearer:{type:'http',scheme:'bearer',bearerFormat:'JWT'}},schemas}};
