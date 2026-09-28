import { env } from "cloudflare:workers";
import { createSession, digest, parseCookie, SESSION_SECONDS, verifyPassword, verifySession } from "@/lib/secret-crypto";
export const noStore = {"Cache-Control":"private, no-store, max-age=0", "Vary":"Cookie", "X-Content-Type-Options":"nosniff"};
function settings() {
  const verifier = env.SECRET_PASSWORD_VERIFIER;
  const key = env.SECRET_SESSION_KEY;
  const origin = env.SECRET_ALLOWED_ORIGIN;
  if (!verifier || !key || key.length < 32 || !origin) return null;
  return {verifier,key,origin,secure:origin.startsWith("https://")};
}
function subject(request: Request) { return request.headers.get("oai-authenticated-user-id") ?? "visitor"; }
function cookieName(secure: boolean) { return secure ? "__Host-cavern-session" : "cavern-dev-session"; }
function cookie(value: string, secure: boolean, seconds: number) {
  // Partitioned cookies work inside the ChatGPT iframe and in a standalone tab.
  // Mutation endpoints still require the exact configured Origin.
  return `${cookieName(secure)}=${value}; Path=/; HttpOnly; Max-Age=${seconds}; ${secure ? "SameSite=None; Secure; Partitioned" : "SameSite=Lax"}`;
}
export async function authorized(request: Request) {
  const config = settings();
  if (!config) return false;
  return verifySession(parseCookie(request.headers.get("cookie"),cookieName(config.secure)),config.key,config.verifier,subject(request));
}
export async function rememberedSession(request: Request) {
  const config = settings();
  if (!config || !await authorized(request)) return Response.json({authenticated:false},{status:401,headers:noStore});
  // Each verified visit starts a new seven-day window, including older valid sessions.
  const token = await createSession(config.key,config.verifier,subject(request));
  return Response.json({authenticated:true,title:"The quiet chamber",description:"Some paths are worth keeping between friends."},{headers:{...noStore,"Set-Cookie":cookie(token,config.secure,SESSION_SECONDS)}});
}
export async function unlock(request: Request) {
  const config = settings();
  if (!config || !env.DB) return Response.json({error:"The passage is resting. Please try again later."},{status:503,headers:noStore});
  if (request.headers.get("origin") !== config.origin) return Response.json({error:"Request not allowed."},{status:403,headers:noStore});
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({error:"Invalid request."},{status:415,headers:noStore});
  if (Number(request.headers.get("content-length") ?? 0) > 2048) return Response.json({error:"Invalid request."},{status:413,headers:noStore});
  let password: unknown;
  try { const body = await request.text(); if (body.length > 2048) throw new Error(); password = JSON.parse(body).password; } catch { return Response.json({error:"Invalid request."},{status:400,headers:noStore}); }
  if (typeof password !== "string" || password.length < 1 || password.length > 256) return Response.json({error:"Enter the passage password."},{status:400,headers:noStore});
  try {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    // The authenticated Site user is preferred. Public visitors use the trusted edge IP.
    const identity = request.headers.get("oai-authenticated-user-id") ?? request.headers.get("cf-connecting-ip") ?? "unknown";
    const rateKey = await digest(`${config.key}:attempt:${identity}`);
    await env.DB.prepare("DELETE FROM secret_attempts WHERE window_start < ?").bind(now - 86400000).run();
    const limit = await env.DB.prepare("INSERT INTO secret_attempts (key, attempts, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = CASE WHEN window_start < ? THEN 1 ELSE attempts + 1 END, window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END RETURNING attempts, window_start").bind(rateKey,now,now-windowMs,now-windowMs).first<{attempts:number;window_start:number}>();
    if (!limit || limit.attempts > 5) return Response.json({error:"Too many attempts. Please wait 15 minutes before trying again."},{status:429,headers:{...noStore,"Retry-After":String(Math.max(1,Math.ceil(((limit?.window_start ?? now)+windowMs-now)/1000)))}});
    if (!await verifyPassword(password,config.verifier,config.key)) return Response.json({error:"That password doesn't open the passage."},{status:401,headers:noStore});
    await env.DB.prepare("DELETE FROM secret_attempts WHERE key = ?").bind(rateKey).run();
    const token = await createSession(config.key,config.verifier,subject(request));
    return Response.json({unlocked:true},{headers:{...noStore,"Set-Cookie":cookie(token,config.secure,SESSION_SECONDS)}});
  } catch {
    console.error("Secret passage authentication service unavailable");
    return Response.json({error:"The passage is resting. Please try again later."},{status:503,headers:noStore});
  }
}
export function leave(request: Request) {
  const config = settings();
  if (!config || request.headers.get("origin") !== config.origin) return Response.json({error:"Request not allowed."},{status:403,headers:noStore});
  return Response.json({locked:true},{headers:{...noStore,"Set-Cookie":cookie("",config.secure,0)}});
}
