import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
const encoder = new TextEncoder();
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export async function digest(value: string) {
  return Buffer.from(await crypto.subtle.digest("SHA-256", encoder.encode(value))).toString("hex");
}
const PASSWORD_ITERATIONS = 100000;
async function passwordHash(password: string, pepper: string, salt: string) {
  const prehash = await crypto.subtle.sign("HMAC", await hmacKey(pepper), encoder.encode(`cavern-password:${password}`));
  const material = await crypto.subtle.importKey("raw", prehash, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:Buffer.from(salt,"hex"),iterations:PASSWORD_ITERATIONS},material,256);
  return Buffer.from(bits).toString("hex");
}
export async function createPasswordVerifier(password: string, pepper: string) {
  const salt = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("hex");
  return `pbkdf2-sha256:${PASSWORD_ITERATIONS}:${salt}:${await passwordHash(password,pepper,salt)}`;
}
export async function verifyPassword(password: string, verifier: string, pepper: string) {
  const [algorithm,iterations,salt,expected,...extra] = verifier.split(":");
  if (extra.length || algorithm !== "pbkdf2-sha256" || iterations !== String(PASSWORD_ITERATIONS) || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{64}$/.test(expected ?? "") || pepper.length < 32) return false;
  const received = await passwordHash(password,pepper,salt);
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}
async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign","verify"]);
}
export async function createSession(secret: string, verifier: string, subject: string, now = Date.now()) {
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  const payload = Buffer.from(JSON.stringify({expires:now + SESSION_SECONDS * 1000,version:(await digest(verifier)).slice(0,24),subject,nonce:Buffer.from(nonce).toString("base64url")})).toString("base64url");
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${Buffer.from(signature).toString("base64url")}`;
}
export async function verifySession(token: string | undefined, secret: string, verifier: string, subject: string, now = Date.now()) {
  if (!token || token.length > 1200) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payload, signature] = parts;
    if (!await crypto.subtle.verify("HMAC", await hmacKey(secret), Buffer.from(signature,"base64url"), encoder.encode(payload))) return false;
    const data = JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
    return typeof data.expires === "number" && data.expires > now && data.expires <= now + SESSION_SECONDS * 1000 && data.version === (await digest(verifier)).slice(0,24) && data.subject === subject;
  } catch { return false; }
}
export function parseCookie(header: string | null, name: string) {
  return header?.split(";").map(part=>part.trim()).find(part=>part.startsWith(`${name}=`))?.slice(name.length + 1);
}
