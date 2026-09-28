import { Buffer } from "node:buffer";
import { authorized, noStore } from "@/lib/server/secret-access";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await authorized(request)) return new Response("Unauthorized",{status:401,headers:noStore});
  const {secretRoomArt} = await import("@/lib/server/secret-room-art");
  const bytes = new Uint8Array(Buffer.from(secretRoomArt,"base64"));
  return new Response(bytes,{headers:{...noStore,"Content-Type":"image/webp","Cross-Origin-Resource-Policy":"same-origin"}});
}
