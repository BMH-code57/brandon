import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {env,redisFetch,records} from './fixtures/secret-env.mjs';
const root=new URL('../',import.meta.url);
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('@/'))return{url:new URL(specifier.slice(2)+'.ts',root).href,shortCircuit:true};return next(specifier,context);}});
const {digest,createSession}=await import('../lib/secret-crypto.ts');
const {GET,POST,DELETE}=await import('../app/api/quest-board/route.ts');
const {GET:session,POST:unlock,DELETE:leave}=await import('../app/api/quest-board/session/route.ts');
const {articleInput}=await import('../lib/quest-board.ts');
const key='fixture-owner-access-key';env.QUEST_EDITOR_KEY_HASH=await digest(key);
const request=(method,body,headers={})=>new Request('https://cavern.example/api/quest-board',{method,headers:{origin:env.SECRET_ALLOWED_ORIGIN,'content-type':'application/json','x-forwarded-for':'203.0.113.30',...headers},body:body===undefined?undefined:JSON.stringify(body)});

test('the article board is public to read but only its owner can publish, edit or remove',async(t)=>{
 const oldFetch=globalThis.fetch;const articles=new Map();let writes=0;
 globalThis.fetch=async(url,init)=>{
  const [command,,id,value]=JSON.parse(init.body);
  if(command==='HVALS')return Response.json({result:[...articles.values()]});
  if(command==='HGET')return Response.json({result:articles.get(id)??null});
  if(command==='HSET'){writes++;const exists=articles.has(id);articles.set(id,value);return Response.json({result:exists?0:1});}
  if(command==='HDEL'){writes++;return Response.json({result:Number(articles.delete(id))});}
  return redisFetch(url,init);
 };t.after(()=>{globalThis.fetch=oldFetch;});
 assert.deepEqual(await(await GET()).json(),{articles:[]});
 assert.equal((await session(request('GET'))).status,200);
 const content={title:'A useful article',url:'https://example.org/article',note:'A thoughtful read.'};
 assert.equal((await POST(request('POST',content))).status,401);
 const chamber=await createSession(env.SECRET_SESSION_KEY,env.SECRET_PASSWORD_VERIFIER,'cavern-web-v1:'+env.SECRET_ALLOWED_ORIGIN);
 assert.equal((await POST(request('POST',content,{cookie:'__Host-cavern-session='+chamber}))).status,401);
 assert.equal((await unlock(request('POST',{key},{origin:'https://attacker.example'}))).status,403);
 assert.equal((await unlock(request('POST',{key:'wrong'}))).status,401);
 const opened=await unlock(request('POST',{key}));assert.equal(opened.status,200);
 const cookie=opened.headers.get('set-cookie').split(';')[0];assert.match(cookie,/^__Host-quest-editor=/);
 assert.match(opened.headers.get('set-cookie'),/HttpOnly.*SameSite=Lax.*Secure/);
 assert.equal((await(await session(request('GET',undefined,{cookie}))).json()).authenticated,true);
 assert.equal((await POST(request('POST',content,{cookie,origin:'https://attacker.example'}))).status,403);
 assert.equal((await POST(request('POST',{...content,url:'javascript:alert(1)'},{cookie}))).status,400);
 assert.equal(writes,0);
 const saved=await POST(request('POST',content,{cookie}));assert.equal(saved.status,201);
 const {article}=await saved.json();assert.equal(articles.size,1);assert.equal(article.title,content.title);
 const publicResponse=await GET();assert.match(publicResponse.headers.get('cache-control'),/no-store/);
 assert.equal((await publicResponse.json()).articles[0].id,article.id);
 assert.equal((await POST(request('POST',{...article,title:'Revised title'},{cookie}))).status,200);
 const edited=(await(await GET()).json()).articles[0];assert.equal(edited.title,'Revised title');assert.equal(edited.postedAt,article.postedAt);
 assert.equal((await DELETE(request('DELETE',{id:article.id},{cookie:cookie+'tampered'}))).status,401);
 assert.equal((await DELETE(request('DELETE',{id:article.id},{cookie}))).status,200);
 assert.equal(articles.size,0);assert.match(leave(request('DELETE',undefined,{cookie})).headers.get('set-cookie'),/Max-Age=0/);
 for(let i=0;i<6;i++)assert.equal((await unlock(request('POST',{key:'wrong'},{'x-forwarded-for':'203.0.113.31'}))).status,i<5?401:429);
 const oldHash=env.QUEST_EDITOR_KEY_HASH;delete env.QUEST_EDITOR_KEY_HASH;
 assert.equal((await unlock(request('POST',{key}))).status,503);env.QUEST_EDITOR_KEY_HASH=oldHash;
 globalThis.fetch=async()=>{throw new Error('Storage offline');};assert.equal((await GET()).status,503);
});

test('article links and notes are bounded and unsafe link schemes are rejected',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,test','https://user:password@example.org'])assert.equal(articleInput({title:'Title',url,note:''}),null);
 assert.equal(articleInput({title:' ',url:'https://example.org',note:''}),null);
 assert.equal(articleInput({title:'Title',url:'https://example.org',note:'x'.repeat(601)}),null);
 assert.deepEqual(articleInput({title:' Title ',url:'https://example.org',note:' Note '}),{title:'Title',url:'https://example.org/',note:'Note'});
});
