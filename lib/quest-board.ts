export type QuestArticle = { id:string; title:string; url:string; note:string; postedAt:string };
export function articleInput(value:unknown):Pick<QuestArticle,"title"|"url"|"note">|null {
  if(!value||typeof value!=="object")return null;
  const input=value as Record<string,unknown>;
  if(typeof input.title!=="string"||typeof input.url!=="string"||typeof input.note!=="string")return null;
  const title=input.title.trim(),note=input.note.trim();
  if(!title||title.length>160||note.length>600||input.url.length>2048)return null;
  try {
    const url=new URL(input.url.trim());
    if(!["http:","https:"].includes(url.protocol)||url.username||url.password)return null;
    return {title,url:url.href,note};
  }catch{return null;}
}
export function isQuestArticle(value:unknown):value is QuestArticle {
  if(!articleInput(value))return false;
  const item=value as QuestArticle;
  return typeof item.id==="string"&&/^[a-f0-9-]{36}$/.test(item.id)&&typeof item.postedAt==="string"&&Number.isFinite(Date.parse(item.postedAt));
}
