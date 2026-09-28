import {randomBytes} from 'node:crypto';
import {createPasswordVerifier} from '../lib/secret-crypto.ts';
const password='Violet-'+randomBytes(18).toString('base64url');
const key=randomBytes(32).toString('base64url');
console.log(JSON.stringify({
 password,
 SECRET_PASSWORD_VERIFIER:await createPasswordVerifier(password,key),
 SECRET_SESSION_KEY:key,
},null,2));
