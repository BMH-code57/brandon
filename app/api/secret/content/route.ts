import { env } from "cloudflare:workers";
import { authorized, noStore } from "@/lib/server/secret-access";
import { parseChamberContent } from "@/lib/server/chamber-content";
export const dynamic = "force-dynamic";
export async function GET(request:Request) {
  if(!await authorized(request))return Response.json({error:"The passage has closed."},{status:401,headers:noStore});
  const raw=[env.QUIET_CHAMBER_CONTENT,env.QUIET_CHAMBER_CONTENT_2,env.QUIET_CHAMBER_CONTENT_3,env.QUIET_CHAMBER_CONTENT_4].join("");
  return Response.json(parseChamberContent(raw),{headers:noStore});
}
