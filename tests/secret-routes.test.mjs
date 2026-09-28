import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';

import {env,password,sqlite} from './fixtures/secret-env.mjs';
const root=new URL('../',import.meta.url);
registerHooks({resolve(specifier,context,next){
 if(specifier==='cloudflare:workers')return{url:new URL('./fixtures/secret-env.mjs',import.meta.url).href,shortCircuit:true};
 if(specifier.startsWith('@/'))return{url:new URL(specifier.slice(2)+'.ts',root).href,shortCircuit:true};
 return next(specifier,context);
}});
const {unlock,leave}=await import('../lib/server/secret-access.ts');
const {GET:session}=await import('../app/api/secret/session/route.ts');
const {GET:art}=await import('../app/api/secret/art/route.ts');
const {GET:content}=await import('../app/api/secret/content/route.ts');
const {GET:receipt}=await import('../app/api/secret/receipt/route.ts');
const {GET:gym}=await import('../app/api/secret/gym/route.ts');
const request=(path,options={})=>new Request('https://cavern.example/api/secret/'+path,{
 ...options,headers:{origin:env.SECRET_ALLOWED_ORIGIN,'content-type':'application/json','oai-authenticated-user-id':'test-visitor',...options.headers},
});
const attempt=(value,headers={})=>unlock(request('unlock',{method:'POST',headers,body:JSON.stringify({password:value})}));

test('secret routes enforce authentication, protect art, expire cookies and rate-limit attempts',async()=>{
 assert.equal((await session(request('session'))).status,401);
 assert.equal((await art(request('art'))).status,401);
 assert.equal((await content(request('content'))).status,401);
 assert.equal((await gym(request('gym'))).status,401);
 assert.equal((await receipt(request('receipt'))).status,401);
 assert.equal((await attempt(password,{origin:'https://untrusted.example'})).status,403);
 assert.equal((await attempt('wrong')).status,401);
 const unlocked=await attempt(password);
 assert.equal(unlocked.status,200);
 const header=unlocked.headers.get('set-cookie');
 assert.match(header,/__Host-cavern-session=/);assert.match(header,/HttpOnly/);assert.match(header,/SameSite=None/);assert.match(header,/Partitioned/);assert.match(header,/Secure/);assert.match(header,/Max-Age=604800/);
 const cookie=header.split(';')[0];
 assert.deepEqual(await (await gym(request('gym',{headers:{cookie}}))).json(),{connected:false});
 assert.equal((await gym(request('gym?page=-1',{headers:{cookie}}))).status,400);
 const originalFetch=globalThis.fetch;
 let hevyCalls=0;
 env.HEVY_API_KEY='fixture-hevy-key';
 globalThis.fetch=async()=>{hevyCalls++;return Response.json({page:1,page_count:1,workouts:[]});};
 try {
  const journal=await gym(request('gym',{headers:{cookie}}));
  assert.equal(journal.status,200);assert.equal((await journal.json()).connected,true);assert.match(journal.headers.get('cache-control'),/no-store/);
  await gym(request('gym',{headers:{cookie}}));assert.equal(hevyCalls,1);
  assert.equal((await gym(request('gym',{headers:{cookie:cookie+'tampered'}}))).status,401);assert.equal(hevyCalls,1);
 } finally {globalThis.fetch=originalFetch;delete env.HEVY_API_KEY;}
 assert.equal((await receipt(request('receipt',{headers:{cookie}}))).status,503);
 const image=Buffer.from('RIFFtestWEBPfixture').toString('base64');
 env.LEAGUE_RECEIPT_1=image.slice(0,8);env.LEAGUE_RECEIPT_2=image.slice(8);
 const receiptResponse=await receipt(request('receipt',{headers:{cookie}}));
 assert.equal(receiptResponse.status,200);assert.equal(receiptResponse.headers.get('content-type'),'image/webp');
 assert.match(receiptResponse.headers.get('cache-control'),/no-store/);
 assert.equal(Buffer.from(await receiptResponse.arrayBuffer()).toString(),'RIFFtestWEBPfixture');
 assert.equal((await receipt(request('receipt',{headers:{cookie:cookie+'tampered'}}))).status,401);
 const privateCollection=JSON.stringify({anime:{watched:[{title:'Private test collection'}]}});
 env.QUIET_CHAMBER_CONTENT=privateCollection.slice(0,17);
 env.QUIET_CHAMBER_CONTENT_2=privateCollection.slice(17,29);
 env.QUIET_CHAMBER_CONTENT_3=privateCollection.slice(29,40);
 env.QUIET_CHAMBER_CONTENT_4=privateCollection.slice(40);
 const collection=await content(request('content',{headers:{cookie}}));
 assert.equal(collection.status,200);assert.match(collection.headers.get('cache-control'),/no-store/);
 assert.equal((await collection.json()).anime.watched[0].title,'Private test collection');
 assert.equal((await content(request('content',{headers:{cookie:cookie+'tampered'}}))).status,401);
 const opened=await session(request('session',{headers:{cookie}}));
 assert.equal(opened.status,200);assert.equal((await opened.json()).authenticated,true);
 assert.match(opened.headers.get('set-cookie'),/Max-Age=604800/);
 const remembered=opened.headers.get('set-cookie').split(';')[0];
 assert.equal((await session(request('session',{headers:{cookie:remembered}}))).status,200);
 assert.equal((await art(request('art',{headers:{cookie:remembered}}))).status,200);
 const picture=await art(request('art',{headers:{cookie}}));
 assert.equal(picture.status,200);assert.equal(picture.headers.get('content-type'),'image/webp');
 assert.match(picture.headers.get('cache-control'),/no-store/);assert.ok((await picture.arrayBuffer()).byteLength>10000);
 assert.equal((await art(request('art',{headers:{cookie:cookie+'tampered'}}))).status,401);
 assert.equal((await session(request('session',{headers:{cookie,'oai-authenticated-user-id':'different-visitor'}}))).status,401);
 const locked=leave(request('leave',{method:'POST',headers:{cookie}}));assert.equal(locked.status,200);assert.match(locked.headers.get('set-cookie'),/Max-Age=0/);
 for(let i=1;i<=6;i++)assert.equal((await attempt('wrong',{'oai-authenticated-user-id':'rate-test'})).status,i<=5?401:429);
 const original=env.SECRET_SESSION_KEY;env.SECRET_SESSION_KEY=undefined;
 assert.equal((await session(request('session',{headers:{cookie}}))).status,401);assert.equal((await attempt(password)).status,503);
 env.SECRET_SESSION_KEY=original;
 sqlite.close();
});
