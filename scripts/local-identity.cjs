// Local operator fixture only: never imported by either runtime. Keys/tokens stay ignored.
const fs = require('node:fs');
const path = require('node:path');
const { generateKeyPairSync } = require('node:crypto');
const { parseEnv } = require('node:util');
const jwt = require('jsonwebtoken');
const { readConfiguration } = require('../packages/platform/dist');
const { LocalIdentityVerifier, LOCAL_ISSUER, audience } = require('../apps/commerce-api/dist/identity/authentication');
const dir = path.join(__dirname, '../.local');
function main() {
  const [command, kind, subject] = process.argv.slice(2);
  const envFile = path.join(dir, 'api.env');
  const env = parseEnv(fs.readFileSync(envFile, 'utf8'));
  const config = readConfiguration(env, 'api');
  if (config.environment !== 'local') throw new Error();
  const keyFile = path.join(dir, 'identity.json');
  if (command === 'setup' && kind === undefined) {
    if (!fs.existsSync(keyFile)) {
      const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
      fs.writeFileSync(keyFile, JSON.stringify({ publicKey: Buffer.from(pair.publicKey.export({ type:'spki', format:'pem' })).toString('base64'),
        privateKey: pair.privateKey.export({ type:'pkcs8', format:'pem' }) }), { mode:0o600, flag:'wx' });
    }
    const keys = JSON.parse(fs.readFileSync(keyFile));
    new LocalIdentityVerifier(config, keys.publicKey);
    const text = fs.readFileSync(envFile, 'utf8').replace(/^IDENTITY_PUBLIC_KEY=.*\r?\n?/gm, '');
    fs.writeFileSync(envFile, text.trimEnd() + '\nIDENTITY_PUBLIC_KEY=' + keys.publicKey + '\n', { mode:0o600 });
    console.log('Local verification key configured; restart the API to load it. Existing key preserved.');
  } else if (command === 'token' && ['customer','staff'].includes(kind) && /^synthetic:[A-Za-z0-9._-]{1,100}$/.test(subject ?? '') && process.argv.length === 5) {
    const keys = JSON.parse(fs.readFileSync(keyFile));
    const now = Math.floor(Date.now()/1000);
    const token = jwt.sign({ iss:LOCAL_ISSUER, sub:subject, aud:audience(kind), kind, synthetic:true,
      scope:kind+':access', amr:kind==='staff'?['mfa']:['pwd'], iat:now, nbf:now, exp:now+300 }, keys.privateKey,
    { algorithm:'RS256', header:{kid:'local-rsa-1',typ:'JWT'} });
    new LocalIdentityVerifier(config, env.IDENTITY_PUBLIC_KEY).verify('Bearer '+token,kind);
    fs.writeFileSync(path.join(dir,kind+'-token.txt'),token,{mode:0o600});
    console.log('Five-minute synthetic token saved under .local/'+kind+'-token.txt; no token printed.');
  } else throw new Error();
}
try { main(); } catch { console.error('Local identity command failed. Use setup, or token customer|staff synthetic:subject after db:local and build.'); process.exitCode=1; }
