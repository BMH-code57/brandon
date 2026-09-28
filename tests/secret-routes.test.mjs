import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';

import {env,password,records,requests,redisFetch,advanceClock} from './fixtures/secret-env.mjs';
const root=new URL('../',import.meta.url);
registerHooks({resolve(specifier,context,next){
 if(specifier.startsWith('@/'))return{url:new URL(specifier.slice(2)+'.ts',root).href,shortCircuit:true};
 return next(specifier,context);
}});
const {createSession}=await import('../lib/secret-crypto.ts');
const {unlock,leave,visitorIdentity}=await import('../lib/server/secret-access.ts');
const {GET:session}=await import('../app/api/secret/session/route.ts');
const {GET:art}=await import('../app/api/secret/art/route.ts');
const {GET:content}=await import('../app/api/secret/content/route.ts');
const {GET:receipt}=await import('../app/api/secret/receipt/route.ts');
const {GET:gym}=await import('../app/api/secret/gym/route.ts');
const request=(path,options={})=>new Request('https://cavern.example/api/secret/'+path,{
 ...options,headers:{origin:env.SECRET_ALLOWED_ORIGIN,'content-type':'application/json','x-forwarded-for':'203.0.113.10',...options.headers},
});
const attempt=(value,headers={})=>unlock(request('unlock',{method:'POST',headers,body:JSON.stringify({password:value})}));

test('Vercel routes protect data, use durable limits, reject spoofed identities and renew sessions',async(t)=>{
 const realFetch=globalThis.fetch;globalThis.fetch=redisFetch;t.after(()=>{globalThis.fetch=realFetch;});
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
 assert.match(header,/__Host-cavern-session=/);assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Lax/);assert.doesNotMatch(header,/Partitioned/);assert.match(header,/Secure/);assert.match(header,/Max-Age=604800/);
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
 records.set('test-cavern:league-receipt',{value:image});
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
 assert.equal((await session(request('session',{headers:{cookie,'oai-authenticated-user-id':'spoofed'}}))).status,200);
 const legacy=await createSession(env.SECRET_SESSION_KEY,env.SECRET_PASSWORD_VERIFIER,'visitor');
 assert.equal((await session(request('session',{headers:{cookie:'__Host-cavern-session='+legacy}}))).status,401);
 assert.equal(visitorIdentity(request('unlock',{headers:{'x-forwarded-for':'invalid','cf-connecting-ip':'1.2.3.4'}})),'unknown');
 assert.equal((await attempt(password,{origin:'https://cavern-test.vercel.app'})).status,200);
 assert.equal((await attempt(password,{origin:'https://untrusted.vercel.app'})).status,403);
 const locked=leave(request('leave',{method:'POST',headers:{cookie}}));assert.equal(locked.status,200);assert.match(locked.headers.get('set-cookie'),/Max-Age=0/);
 for(let i=1;i<=6;i++)assert.equal((await attempt('wrong',{'x-forwarded-for':'203.0.113.99','oai-authenticated-user-id':'spoof-'+i,'cf-connecting-ip':'192.0.2.'+i})).status,i<=5?401:429);
 assert.equal((await attempt(password,{'x-forwarded-for':'203.0.113.99'})).status,429);
 advanceClock(901000);
 assert.equal((await attempt(password,{'x-forwarded-for':'203.0.113.99'})).status,200);
 assert.ok(requests.some(r=>r.url.endsWith('/multi-exec')));
 const token=env.UPSTASH_REDIS_REST_TOKEN;delete env.UPSTASH_REDIS_REST_TOKEN;
 assert.equal((await attempt(password)).status,503);env.UPSTASH_REDIS_REST_TOKEN=token;
 globalThis.fetch=async()=>Response.json([{result:1},{error:'storage failed'},{result:900}]);
 assert.equal((await attempt(password)).status,503);globalThis.fetch=redisFetch;
 const original=env.SECRET_SESSION_KEY;delete env.SECRET_SESSION_KEY;
 assert.equal((await session(request('session',{headers:{cookie}}))).status,401);assert.equal((await attempt(password)).status,503);
 env.SECRET_SESSION_KEY=original;

});
