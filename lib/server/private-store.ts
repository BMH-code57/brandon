// Keep this module in server routes. Never expose Redis credentials to the browser.
type Command = (string | number)[];
function connection() {
  const raw=process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!raw||!token)throw new Error("Private storage is not configured");
  const url=new URL(raw);
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||url.pathname!=="/")throw new Error("Invalid private storage endpoint");
  return {url:url.origin,token};
}
export function privateKey(name:string) {
  const prefix=process.env.CAVERN_REDIS_PREFIX||"brandon-cavern";
  return `${prefix}:${name}`;
}
export async function redisRequest(commands:Command|Command[],transaction=false) {
  const {url,token}=connection();
  const response=await fetch(`${url}${transaction?"/multi-exec":""}`,{
    method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
    body:JSON.stringify(commands),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(6000),
  });
  if(!response.ok)throw new Error("Private storage unavailable");
  const body:unknown=await response.json();
  const entries=transaction?body:[body];
  if(!Array.isArray(entries)||entries.some(entry=>!entry||typeof entry!=="object"||"error" in entry||!("result" in entry)))throw new Error("Invalid private storage response");
  return entries.map(entry=>(entry as {result:unknown}).result);
}
export async function consumeAttempt(identity:string) {
  const key=privateKey(`attempt:${identity}`);
  // A transaction makes increment, first-use expiry, and TTL inspection atomic.
  const [attempts,,remaining]=await redisRequest([["INCR",key],["EXPIRE",key,900,"NX"],["TTL",key]],true);
  if(typeof attempts!=="number"||!Number.isSafeInteger(attempts)||attempts<1||typeof remaining!=="number"||!Number.isInteger(remaining)||remaining<0||remaining>900)throw new Error("Invalid attempt counter");
  return {allowed:attempts<=5,retryAfter:Math.max(1,remaining)};
}
export async function resetAttempts(identity:string) {
  await redisRequest(["DEL",privateKey(`attempt:${identity}`)]);
}
export async function privateReceipt() {
  const [value]=await redisRequest(["GET",privateKey("league-receipt")]);
  return typeof value==="string"?value:"";
}
