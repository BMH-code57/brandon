import {env} from "cloudflare:workers";
import {authorized,noStore} from "@/lib/server/secret-access";
import {digest} from "@/lib/secret-crypto";
import {HevyError,loadHevyPage} from "@/lib/server/hevy";
export const dynamic="force-dynamic";
const cache=new Map<string,{until:number;value:Awaited<ReturnType<typeof loadHevyPage>>}>();

export async function GET(request:Request) {
  if(!await authorized(request))return Response.json({error:"The passage has closed."},{status:401,headers:noStore});
  const raw=new URL(request.url).searchParams.get("page")??"1";
  const page=Number(raw);
  if(!/^\d+$/.test(raw)||!Number.isSafeInteger(page)||page<1||page>100000)return Response.json({error:"Invalid workout page."},{status:400,headers:noStore});
  const key=env.HEVY_API_KEY?.trim();
  if(!key)return Response.json({connected:false},{headers:noStore});
  try {
    const cacheKey=`${await digest(key)}:${page}`;
    const entry=cache.get(cacheKey);
    if(entry&&entry.until>Date.now())return Response.json(entry.value,{headers:noStore});
    const value=await loadHevyPage(key,page);
    for(const [id,old] of cache)if(old.until<=Date.now())cache.delete(id);
    if(cache.size>=30)cache.delete(cache.keys().next().value!);
    cache.set(cacheKey,{until:Date.now()+60000,value});
    return Response.json(value,{headers:noStore});
  } catch(error) {
    const code=error instanceof HevyError?error.code:"unavailable";
    const message=code==="credentials"?"The Hevy connection needs to be renewed.":code==="rate_limit"?"Hevy is receiving too many requests. Try again in a minute.":"Workouts couldn't be reached. Please try again.";
    return Response.json({error:message},{status:code==="rate_limit"?429:503,headers:{...noStore,...(code==="rate_limit"?{"Retry-After":"60"}:{})}});
  }
}
