import {randomUUID,timingSafeEqual} from "node:crypto";
import {createSession,digest,parseCookie,SESSION_SECONDS,verifySession} from "@/lib/secret-crypto";
import {consumeAttempt,privateKey,redisRequest,resetAttempts} from "@/lib/server/private-store";
import {noStore,visitorIdentity} from "@/lib/server/secret-access";
import {articleInput,isQuestArticle,type QuestArticle} from "@/lib/quest-board";

function config(){
  const verifier=process.env.QUEST_EDITOR_KEY_HASH,key=process.env.SECRET_SESSION_KEY,raw=process.env.SECRET_ALLOWED_ORIGIN;
  if(!verifier||!/^[a-f0-9]{64}$/.test(verifier)||!key||key.length<32||!raw)return null;
  try {
    const url=new URL(raw);
    if(url.origin!==raw||url.username||url.password||!["https:","http:"].includes(url.protocol))return null;
    const secure=url.protocol==="https:";
    if(!secure&&(process.env.VERCEL==="1"||process.env.NODE_ENV==="production"))return null;
    const origins=new Set([url.origin]);
    if(process.env.VERCEL==="1"&&process.env.VERCEL_URL&&/^[a-z0-9-]+\.vercel\.app$/i.test(process.env.VERCEL_URL))origins.add(`https://${process.env.VERCEL_URL}`);
    return {key,verifier,secure,origins,subject:`quest-editor-v1:${url.origin}`,cookie:secure?"__Host-quest-editor":"quest-editor-dev"};
  }catch{return null;}
}
const fail=(error:string,status:number)=>Response.json({error},{status,headers:noStore});
export async function editorAuthorized(request:Request){
  const settings=config();
  return !!settings&&await verifySession(parseCookie(request.headers.get("cookie"),settings.cookie),settings.key,settings.verifier,settings.subject);
}
export async function editorSession(request:Request){
  return Response.json({authenticated:await editorAuthorized(request)},{headers:noStore});
}
function sameOrigin(request:Request){return config()?.origins.has(request.headers.get("origin")||"")??false;}
async function jsonBody(request:Request){
  if(!request.headers.get("content-type")?.startsWith("application/json"))throw new Error("Invalid request");
  if(Number(request.headers.get("content-length")||0)>12000)throw new Error("Invalid request");
  const text=await request.text();if(text.length>12000)throw new Error("Invalid request");
  return JSON.parse(text) as Record<string,unknown>;
}
export async function editorUnlock(request:Request){
  const settings=config();if(!settings)return fail("Article editing is not connected yet.",503);
  if(!sameOrigin(request))return fail("Request not allowed.",403);
  let key:unknown;try{key=(await jsonBody(request)).key;}catch{return fail("Invalid request.",400);}
  if(typeof key!=="string"||key.length<1||key.length>256)return fail("Enter your editor access key.",400);
  try {
    const identity=await digest(`${settings.key}:quest-editor:${visitorIdentity(request)}`);
    const limit=await consumeAttempt(identity);
    if(!limit.allowed)return Response.json({error:"Too many attempts. Try again in 15 minutes."},{status:429,headers:{...noStore,"Retry-After":String(limit.retryAfter)}});
    if(!timingSafeEqual(Buffer.from(await digest(key),"hex"),Buffer.from(settings.verifier,"hex")))return fail("That access key does not open the editor.",401);
    await resetAttempts(identity);
    const token=await createSession(settings.key,settings.verifier,settings.subject);
    return Response.json({authenticated:true},{headers:{...noStore,"Set-Cookie":`${settings.cookie}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${settings.secure?"; Secure":""}`}});
  }catch{return fail("The editor could not connect. Please try again.",503);}
}
export function editorLeave(request:Request){
  const settings=config();if(!settings||!sameOrigin(request))return fail("Request not allowed.",403);
  return Response.json({authenticated:false},{headers:{...noStore,"Set-Cookie":`${settings.cookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${settings.secure?"; Secure":""}`}});
}
export async function listArticles(){
  const [rows]=await redisRequest(["HVALS",privateKey("quest-articles")]);
  if(!Array.isArray(rows))throw new Error("Invalid article store");
  return rows.map(row=>{try{return JSON.parse(String(row)) as unknown;}catch{return null;}}).filter(isQuestArticle).sort((a,b)=>b.postedAt.localeCompare(a.postedAt)||a.title.localeCompare(b.title));
}
export async function readArticles(){
  try{return Response.json({articles:await listArticles()},{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}
  catch{return fail("The board couldn't be reached. Please try again.",503);}
}
export async function saveArticle(request:Request){
  if(!sameOrigin(request))return fail("Request not allowed.",403);
  if(!await editorAuthorized(request))return fail("Open the editor with your access key first.",401);
  let body:Record<string,unknown>;try{body=await jsonBody(request);}catch{return fail("Invalid request.",400);}
  const input=articleInput(body);if(!input)return fail("Add a title, a valid article link, and a note up to 600 characters.",400);
  const id=body.id;
  if(id!==undefined&&(typeof id!=="string"||!/^[a-f0-9-]{36}$/.test(id)))return fail("Invalid article.",400);
  try {
    let existing:QuestArticle|undefined;
    if(id){const [row]=await redisRequest(["HGET",privateKey("quest-articles"),id as string]);if(row){const parsed:unknown=JSON.parse(String(row));if(isQuestArticle(parsed))existing=parsed;}if(!existing)return fail("This article no longer exists. Refresh the board.",404);}
    const article:QuestArticle={...input,id:existing?.id??randomUUID(),postedAt:existing?.postedAt??new Date().toISOString()};
    const [result]=await redisRequest(["HSET",privateKey("quest-articles"),article.id,JSON.stringify(article)]);
    if(result!==0&&result!==1)throw new Error("Save failed");
    return Response.json({article},{status:existing?200:201,headers:noStore});
  }catch{return fail("The article couldn't be saved. Please try again.",503);}
}
export async function deleteArticle(request:Request){
  if(!sameOrigin(request))return fail("Request not allowed.",403);
  if(!await editorAuthorized(request))return fail("Open the editor with your access key first.",401);
  let id:unknown;try{id=(await jsonBody(request)).id;}catch{return fail("Invalid request.",400);}
  if(typeof id!=="string"||!/^[a-f0-9-]{36}$/.test(id))return fail("Invalid article.",400);
  try{await redisRequest(["HDEL",privateKey("quest-articles"),id]);return Response.json({deleted:true},{headers:noStore});}
  catch{return fail("The article couldn't be removed. Please try again.",503);}
}
