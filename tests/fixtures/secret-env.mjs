import {randomBytes} from 'node:crypto';
import {createPasswordVerifier} from '../../lib/secret-crypto.ts';
export const password='test-passphrase';
const key=randomBytes(32).toString('base64url');
export const env=process.env;
Object.assign(env,{
 SECRET_PASSWORD_VERIFIER:await createPasswordVerifier(password,key),
 SECRET_SESSION_KEY:key,
 SECRET_ALLOWED_ORIGIN:'https://cavern.example',
 UPSTASH_REDIS_REST_URL:'https://redis.example',
 UPSTASH_REDIS_REST_TOKEN:'fixture-redis-token',
 VERCEL:'1',VERCEL_URL:'cavern-test.vercel.app',CAVERN_REDIS_PREFIX:'test-cavern',
});
export const records=new Map();
export const requests=[];
export let clock=Date.now();
export function advanceClock(ms){clock+=ms;}
export async function redisFetch(url,init) {
 if(!String(url).startsWith('https://redis.example'))throw new Error('Unexpected test destination');
 if(init.headers.Authorization!=='Bearer fixture-redis-token')throw new Error('Missing storage credential');
 requests.push({url,init});
 const command=JSON.parse(init.body);
 const run=([name,key,value,option])=>{
  let item=records.get(key);
  if(item?.expires!==undefined&&item.expires<=clock){records.delete(key);item=undefined;}
  if(name==='INCR'){const count=(Number(item?.value)||0)+1;records.set(key,{...item,value:count});return {result:count};}
  if(name==='EXPIRE'){if(!item)return {result:0};if(option==='NX'&&item.expires)return {result:0};item.expires=clock+value*1000;return {result:1};}
  if(name==='TTL')return {result:item?.expires===undefined?-1:Math.ceil((item.expires-clock)/1000)};
  if(name==='DEL')return {result:Number(records.delete(key))};
  if(name==='GET')return {result:item?.value??null};
  throw new Error('Unexpected Redis command');
 };
 return Response.json(String(url).endsWith('/multi-exec')?command.map(run):run(command));
}
