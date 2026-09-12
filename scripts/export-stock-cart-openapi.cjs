const fs=require('node:fs'),path=require('node:path');
const {stockCartOpenApi}=require('../apps/commerce-api/dist/cart/openapi');
const file=path.join(__dirname,'../backend/openapi/stock-cart-v1.json'),content=JSON.stringify(stockCartOpenApi,null,2)+'\n';
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==content)throw new Error('Stock/cart OpenAPI drift');console.log('Stock/cart OpenAPI matches.');}
else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);console.log('Stock/cart OpenAPI exported.');}
