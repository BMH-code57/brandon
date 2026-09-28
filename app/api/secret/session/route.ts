import { rememberedSession } from "@/lib/server/secret-access";
export const runtime="nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return rememberedSession(request);
}
