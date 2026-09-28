import type { ChamberContent } from "@/lib/chamber";

// Personal lists belong in runtime configuration, outside the public repository.
export function parseChamberContent(raw:unknown):ChamberContent {
  let data:Record<string,unknown>={};
  try { if(typeof raw==="string"&&raw.length<=100000)data=JSON.parse(raw); } catch {}
  const record=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const text=(value:unknown,max=500)=>typeof value==="string"?value.slice(0,max):"";
  const count=(value:unknown,max=100000000)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0&&value<=max?value:null;
  const link=(value:unknown,hosts:string[])=>{
    try {
      const url=new URL(text(value,2048));
      return url.protocol==="https:"&&!url.username&&!url.password&&hosts.some(host=>url.hostname===host||url.hostname.endsWith("."+host))?url.href:null;
    } catch {return null;}
  };
  data=record(data);
  const league=record(data.league),anime=record(data.anime),snapshot=record(league.snapshot);
  return {
    league:{riotId:text(league.riotId,100),opgg:link(league.opgg,["op.gg"]),yearinlol:link(league.yearinlol,["yearin.lol"]),seasons:(Array.isArray(league.seasons)?league.seasons:[]).slice(0,30).map(record).map(item=>({year:text(item.year,20),summary:text(item.summary)})).filter(item=>item.year&&item.summary),snapshot:Object.keys(snapshot).length?{hoursPlayed:count(snapshot.hoursPlayed,1000000),rank:text(snapshot.rank,50),recordedAt:text(snapshot.recordedAt,40),source:text(snapshot.source,80)}:null,mastery:(Array.isArray(league.mastery)?league.mastery:[]).slice(0,200).map(record).map(item=>({name:text(item.name,80),level:count(item.level,100000)??0,points:count(item.points)??0,portrait:link(item.portrait,["ddragon.leagueoflegends.com"])})).filter(item=>item.name)},
    anime:{profile:link(anime.profile,["anilist.co","myanimelist.net","anime-planet.com","kitsu.app","kitsu.io"]),watched:(Array.isArray(anime.watched)?anime.watched:[]).slice(0,1000).map(record).map(item=>({title:text(item.title,160),year:text(item.year,20),note:text(item.note),cover:link(item.cover,["media.kitsu.app","media.kitsu.io","s4.anilist.co","cdn.myanimelist.net"]),source:link(item.source,["kitsu.app","kitsu.io","anilist.co","myanimelist.net"]),episodesWatched:count(item.episodesWatched,100000)})).filter(item=>item.title)},
  };
}
