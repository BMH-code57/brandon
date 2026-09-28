import { unlock } from "@/lib/server/secret-access";
export const runtime="nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { return unlock(request); }
