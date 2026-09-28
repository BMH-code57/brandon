import {readArticles,saveArticle,deleteArticle} from "@/lib/server/quest-board";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET=readArticles;
export const POST=saveArticle;
export const DELETE=deleteArticle;
