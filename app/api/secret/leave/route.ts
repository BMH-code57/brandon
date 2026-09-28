import { leave } from "@/lib/server/secret-access";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { return leave(request); }
