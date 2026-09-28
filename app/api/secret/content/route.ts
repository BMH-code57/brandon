import { authorized, noStore } from "@/lib/server/secret-access";
import { parseChamberContent } from "@/lib/server/chamber-content";
export const runtime="nodejs";
export const dynamic = "force-dynamic";
export async function GET(request:Request) {
  if(!await authorized(request))return Response.json({error:"The passage has closed."},{status:401,headers:noStore});
  const raw=[process.env.QUIET_CHAMBER_CONTENT,process.env.QUIET_CHAMBER_CONTENT_2,process.env.QUIET_CHAMBER_CONTENT_3,process.env.QUIET_CHAMBER_CONTENT_4].join("");
  return Response.json(parseChamberContent(raw),{headers:noStore});
}
