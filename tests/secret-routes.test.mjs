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
const request=(path,options={})=>new Request('https://cavern.example/api/secret/'+path,{
 ...options,headers:{origin:env.SECRET_ALLOWED_ORIGIN,'content-type':'application/json','oai-authenticated-user-id':'test-visitor',...options.headers},
});
const attempt=(value,headers={})=>unlock(request('unlock',{method:'POST',headers,body:JSON.stringify({password:value})}));

test('secret routes enforce authentication, protect art, expire cookies and rate-limit attempts',async()=>{
 assert.equal((await session(request('session'))).status,401);
 assert.equal((await art(request('art'))).status,401);
 assert.equal((await content(request('content'))).status,401);
 assert.equal((await attempt(password,{origin:'https://untrusted.example'})).status,403);
 assert.equal((await attempt('wrong')).status,401);
 const unlocked=await attempt(password);
 assert.equal(unlocked.status,200);
 const header=unlocked.headers.get('set-cookie');
 assert.match(header,/__Host-cavern-session=/);assert.match(header,/HttpOnly/);assert.match(header,/SameSite=None/);assert.match(header,/Partitioned/);assert.match(header,/Secure/);assert.match(header,/Max-Age=604800/);
 const cookie=header.split(';')[0];
 env.QUIET_CHAMBER_CONTENT=JSON.stringify({anime:{watched:[{title:'Private test collection'}]}});
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
