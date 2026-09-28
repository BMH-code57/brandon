import {isIP} from "node:net";
import {createSession,digest,parseCookie,SESSION_SECONDS,verifyPassword,verifySession} from "@/lib/secret-crypto";
import {consumeAttempt,resetAttempts} from "@/lib/server/private-store";
export const noStore={"Cache-Control":"private, no-store, max-age=0","Vary":"Cookie","X-Content-Type-Options":"nosniff"};

function settings() {
  const verifier=process.env.SECRET_PASSWORD_VERIFIER,key=process.env.SECRET_SESSION_KEY;
  const raw=process.env.SECRET_ALLOWED_ORIGIN;
  if(!verifier||!key||key.length<32||!raw)return null;
  try {
    const origin=new URL(raw);
    if(origin.origin!==raw||origin.username||origin.password||!["https:","http:"].includes(origin.protocol))return null;
    if(origin.protocol!=="https:"&&(process.env.VERCEL==="1"||process.env.NODE_ENV==="production"))return null;
    const origins=new Set([origin.origin]);
    // Vercel injects this hostname. Never derive allowed origins from request headers.
    if(process.env.VERCEL==="1"&&process.env.VERCEL_URL&&/^[a-z0-9-]+\.vercel\.app$/i.test(process.env.VERCEL_URL))origins.add(`https://${process.env.VERCEL_URL}`);
    return {verifier,key,origins,secure:origin.protocol==="https:",subject:`cavern-web-v1:${origin.origin}`};
  } catch {return null;}
}
function cookieName(secure:boolean){return secure?"__Host-cavern-session":"cavern-dev-session";}
function cookie(value:string,secure:boolean,seconds:number){return `${cookieName(secure)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${secure?"; Secure":""}`;}
export function visitorIdentity(request:Request) {
  // Vercel overwrites this header at its edge. Other hosts use a shared bucket.
  // Legacy Sites identity and Cloudflare headers have no authority here.
  const value=process.env.VERCEL==="1"?request.headers.get("x-forwarded-for")?.trim():undefined;
  return value&&isIP(value)?value:"unknown";
}
export async function authorized(request:Request) {
  const config=settings();
  return !!config&&verifySession(parseCookie(request.headers.get("cookie"),cookieName(config.secure)),config.key,config.verifier,config.subject);
}
export async function rememberedSession(request:Request) {
  const config=settings();
  if(!config||!await authorized(request))return Response.json({authenticated:false},{status:401,headers:noStore});
  const token=await createSession(config.key,config.verifier,config.subject);
  return Response.json({authenticated:true,title:"The quiet chamber",description:"Some paths are worth keeping between friends."},{headers:{...noStore,"Set-Cookie":cookie(token,config.secure,SESSION_SECONDS)}});
}
export async function unlock(request:Request) {
  const config=settings();
  if(!config)return Response.json({error:"The passage is resting. Please try again later."},{status:503,headers:noStore});
  if(!config.origins.has(request.headers.get("origin")||""))return Response.json({error:"Request not allowed."},{status:403,headers:noStore});
  if(!request.headers.get("content-type")?.startsWith("application/json"))return Response.json({error:"Invalid request."},{status:415,headers:noStore});
  if(Number(request.headers.get("content-length")??0)>2048)return Response.json({error:"Invalid request."},{status:413,headers:noStore});
  let password:unknown;
  try {const body=await request.text();if(body.length>2048)throw new Error();password=JSON.parse(body).password;}catch{return Response.json({error:"Invalid request."},{status:400,headers:noStore});}
  if(typeof password!=="string"||password.length<1||password.length>256)return Response.json({error:"Enter the passage password."},{status:400,headers:noStore});
  try {
    const identity=await digest(`${config.key}:attempt:${visitorIdentity(request)}`);
    const limit=await consumeAttempt(identity);
    if(!limit.allowed)return Response.json({error:"Too many attempts. Please wait 15 minutes before trying again."},{status:429,headers:{...noStore,"Retry-After":String(limit.retryAfter)}});
    if(!await verifyPassword(password,config.verifier,config.key))return Response.json({error:"That password doesn't open the passage."},{status:401,headers:noStore});
    await resetAttempts(identity);
    const token=await createSession(config.key,config.verifier,config.subject);
    return Response.json({unlocked:true},{headers:{...noStore,"Set-Cookie":cookie(token,config.secure,SESSION_SECONDS)}});
  }catch{
    console.error("Secret passage authentication service unavailable");
    return Response.json({error:"The passage is resting. Please try again later."},{status:503,headers:noStore});
  }
}
export function leave(request:Request) {
  const config=settings();
  if(!config||!config.origins.has(request.headers.get("origin")||""))return Response.json({error:"Request not allowed."},{status:403,headers:noStore});
  return Response.json({locked:true},{headers:{...noStore,"Set-Cookie":cookie("",config.secure,0)}});
}
