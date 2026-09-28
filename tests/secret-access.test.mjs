import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createSession,createPasswordVerifier,verifyPassword,verifySession,SESSION_SECONDS,parseCookie} from '../lib/secret-crypto.ts';
import {nextBookCount} from '../lib/secret-sequence.ts';
const password=randomBytes(18).toString('base64url');
const key=randomBytes(32).toString('base64url');
const verifier=await createPasswordVerifier(password,key);

test('the book unlocks exactly on the fourth consecutive interaction',()=>{
 let count=0;for(let i=1;i<=4;i++){count=nextBookCount(count,'book');assert.equal(count,i);}assert.equal(nextBookCount(4,'book'),4);
});
test('movement or another destination resets the book sequence',()=>{
 assert.equal(nextBookCount(3,'move'),0);assert.equal(nextBookCount(3,'other'),0);
});
test('only the correct password and server pepper match the slow salted verifier',async()=>{
 assert.equal(await verifyPassword(password,verifier,key),true);
 assert.equal(await verifyPassword('wrong-password',verifier,key),false);
 assert.equal(await verifyPassword(password,'invalid',key),false);
 assert.equal(await verifyPassword(password,verifier,randomBytes(32).toString('base64url')),false);
});
test('sessions reject tampering, expired tokens, other visitors, and rotated keys',async()=>{
 const now=Date.now(), token=await createSession(key,verifier,'visitor-A',now);
 assert.equal(await verifySession(token,key,verifier,'visitor-A',now+1),true);
 assert.equal(await verifySession(token,key,verifier,'visitor-B',now+1),false);
 assert.equal(await verifySession(token+'x',key,verifier,'visitor-A',now+1),false);
 assert.equal(await verifySession(token,'different-key',verifier,'visitor-A',now+1),false);
 assert.equal(await verifySession(token,key,verifier+'a','visitor-A',now+1),false);
 assert.equal(await verifySession(token,key,verifier,'visitor-A',now+(SESSION_SECONDS+1)*1000),false);
 assert.equal(await verifySession(undefined,key,verifier,'visitor-A'),false);
});
test('remembered access survives six days and expires after seven days',async()=>{
 const now=Date.now(),token=await createSession(key,verifier,'returning-visitor',now);
 assert.equal(SESSION_SECONDS,604800);
 assert.equal(await verifySession(token,key,verifier,'returning-visitor',now+6*86400000),true);
 assert.equal(await verifySession(token,key,verifier,'returning-visitor',now+7*86400000),false);
});
test('cookie parsing uses exact names',()=>{
 assert.equal(parseCookie('not-cavern=bad; cavern-dev-session=valid; x=2','cavern-dev-session'),'valid');
 assert.equal(parseCookie('not-cavern=bad','cavern-dev-session'),undefined);
});
