import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createPasswordVerifier} from '../../lib/secret-crypto.ts';
export const password='test-passphrase';
const key=randomBytes(32).toString('base64url');
export const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../../drizzle/0000_abnormal_blue_marvel.sql',import.meta.url),'utf8'));
export const env={
 SECRET_PASSWORD_VERIFIER:await createPasswordVerifier(password,key),
 SECRET_SESSION_KEY:key,
 SECRET_ALLOWED_ORIGIN:'https://cavern.example',
 DB: {
  prepare(sql) {
   const statement=sqlite.prepare(sql);
   return {
    bind(...args) {
     return {
      async run() { return statement.run(...args); },
      async first() { return statement.get(...args) ?? null; },
     };
    },
   };
  },
 },
};
