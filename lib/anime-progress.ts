import type {AnimeTitle} from "./chamber";

// A resume episode is not counted as finished. Season offsets and rewatches
// are unknown unless the owner supplies an explicit completed-episode count.
export function animeProgress(item:AnimeTitle) {
  const current=/^(Continue|Current)\b/i.test(item.note);
  const watched=/^Watch Again\b/i.test(item.note);
  const episode=item.note.match(/\bE(\d+)\b/i);
  const season=item.note.match(/\bS(\d+)\b/i);
  const position=episode?`${season?`S${season[1]} · `:""}E${episode[1]}`:"";
  const explicit=item.episodesWatched!==null&&Number.isSafeInteger(item.episodesWatched)&&item.episodesWatched>=0?item.episodesWatched:null;
  const count=explicit??(episode&&(current||watched)?Math.max(0,Number(episode[1])-(current?1:0)):null);
  return {status:current?"Current":watched?"Watched":"On the shelf",position:current||watched?position:"",episodes:count,hours:count===null?null:count*24/60};
}
export function animeWatchSummary(items:AnimeTitle[]) {
  const progress=items.map(animeProgress);
  const recorded=progress.filter(item=>item.episodes!==null);
  const episodes=recorded.reduce((sum,item)=>sum+(item.episodes??0),0);
  return {episodes,hours:episodes*24/60,recordedTitles:recorded.length,current:progress.filter(item=>item.status==="Current").length};
}
export function sortedAnime(items:AnimeTitle[]) {
  return [...items].sort((a,b)=>(animeProgress(b).hours??-1)-(animeProgress(a).hours??-1)||a.title.localeCompare(b.title,"en",{sensitivity:"base"}));
}
