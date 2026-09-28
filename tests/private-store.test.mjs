import test from 'node:test';
import assert from 'node:assert/strict';
import {redisRequest} from '../lib/server/private-store.ts';

test('Marketplace storage works without direct Upstash variables and never mixes credentials',async(t)=>{
 const names=['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN'];
 const original=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 const realFetch=globalThis.fetch;
 t.after(()=>{globalThis.fetch=realFetch;for(const name of names){if(original[name]===undefined)delete process.env[name];else process.env[name]=original[name];}});
 for(const name of names)delete process.env[name];
 process.env.KV_REST_API_URL='https://marketplace.example';
 process.env.KV_REST_API_TOKEN='marketplace-fixture-token';
 let requests=0;
 globalThis.fetch=async(url,init)=>{
  requests++;
  assert.equal(url,'https://marketplace.example');
  assert.equal(init.headers.Authorization,'Bearer marketplace-fixture-token');
  return Response.json({result:'PONG'});
 };
 assert.deepEqual(await redisRequest(['PING']),['PONG']);
 process.env.UPSTASH_REDIS_REST_URL='https://direct.example';
 await assert.rejects(redisRequest(['PING']),/not configured/);
 assert.equal(requests,1);
 delete process.env.UPSTASH_REDIS_REST_URL;
 delete process.env.KV_REST_API_TOKEN;
 await assert.rejects(redisRequest(['PING']),/not configured/);
 assert.equal(requests,1);
});
