import {Buffer} from "node:buffer";
import {env} from "cloudflare:workers";
import {authorized,noStore} from "@/lib/server/secret-access";
export const dynamic="force-dynamic";

export async function GET(request:Request) {
  if(!await authorized(request))return new Response("Unauthorized",{status:401,headers:noStore});
  const source=Array.from({length:14},(_,i)=>env[`LEAGUE_RECEIPT_${i+1}` as keyof Cloudflare.Env]||"").join("");
  if(!source||source.length>80000||!/^[A-Za-z0-9+/]+={0,2}$/.test(source))return new Response("Receipt unavailable",{status:503,headers:noStore});
  const bytes=Buffer.from(source,"base64");
  if(bytes.toString("ascii",0,4)!=="RIFF"||bytes.toString("ascii",8,12)!=="WEBP")return new Response("Receipt unavailable",{status:503,headers:noStore});
  return new Response(new Uint8Array(bytes),{headers:{...noStore,"Content-Type":"image/webp","Content-Disposition":"inline; filename=league-receipt.webp","Cross-Origin-Resource-Policy":"same-origin","X-Content-Type-Options":"nosniff"}});
}
