import {editorSession,editorUnlock,editorLeave} from "@/lib/server/quest-board";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET=editorSession;
export const POST=editorUnlock;
export const DELETE=editorLeave;
