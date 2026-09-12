const fs=require('node:fs'),path=require('node:path');
const {catalogOpenApi}=require('../apps/commerce-api/dist/catalog/openapi');
const file=path.join(__dirname,'../backend/openapi/catalog-v1.json');
const content=JSON.stringify(catalogOpenApi,null,2)+'\n';
if(process.argv.includes('--check')) {
 if(fs.readFileSync(file,'utf8')!==content)throw new Error('OpenAPI artifact differs from executable contract');
 console.log('Catalog OpenAPI artifact matches executable contract.');
} else {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);console.log('Catalog OpenAPI exported.');}
