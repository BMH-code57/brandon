import { env } from "cloudflare:workers";
import { authorized, noStore } from "@/lib/server/secret-access";
import { parseChamberContent } from "@/lib/server/chamber-content";
export const dynamic = "force-dynamic";
export async function GET(request:Request) {
  if(!await authorized(request))return Response.json({error:"The passage has closed."},{status:401,headers:noStore});
  return Response.json(parseChamberContent(env.QUIET_CHAMBER_CONTENT),{headers:noStore});
}
