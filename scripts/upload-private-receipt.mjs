import {readFile} from 'node:fs/promises';
// Run with Node 24 and --env-file=.env.local. This script never prints credentials.
const [path]=process.argv.slice(2);
if(!path)throw new Error('Usage: node --env-file=.env.local scripts/upload-private-receipt.mjs /path/to/receipt.webp');
const direct=!!(process.env.UPSTASH_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_TOKEN);
const url=new URL((direct?process.env.UPSTASH_REDIS_REST_URL:process.env.KV_REST_API_URL)||'');
const token=direct?process.env.UPSTASH_REDIS_REST_TOKEN:process.env.KV_REST_API_TOKEN;
if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||!token)throw new Error('Configure the private Redis connection first.');
const bytes=await readFile(path);
if(bytes.length>60000||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw new Error('Use a WebP receipt no larger than 60 KB.');
const key=`${process.env.CAVERN_REDIS_PREFIX||'brandon-cavern'}:league-receipt`;
const response=await fetch(url.origin,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['SET',key,bytes.toString('base64')]),redirect:'error',signal:AbortSignal.timeout(10000)});
if(!response.ok)throw new Error('Private receipt upload failed.');
const result=await response.json();
if(result.result!=='OK')throw new Error('Private receipt upload was not confirmed.');
console.log('Private receipt saved.');
