"use client";
import {useState} from "react";
import {ArrowUpRight,BookOpen,Clock3} from "lucide-react";
import type {AnimeTitle,ChamberContent} from "@/lib/chamber";
import {animeProgress,animeWatchSummary,sortedAnime} from "@/lib/anime-progress";

function Cover({item}:{item:AnimeTitle}) {
  const [failed,setFailed]=useState(false);
  return <div className="anime-cover">{item.cover&&!failed?<img src={item.cover} alt={`${item.title} cover`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<div className="cover-unavailable"><BookOpen size={30}/><span>{item.title}</span></div>}</div>;
}
export default function AnimeCollection({anime}:{anime:ChamberContent["anime"]}) {
  const summary=animeWatchSummary(anime.watched);
  if(!anime.watched.length)return <div className="chamber-empty"><BookOpen size={30}/><h3>The shelf is waiting.</h3><p>The collection hasn't been added yet.</p></div>;
  return <div className="anime-collection">
    <section className="watch-ledger" aria-label="Watch time">
      <div className="watch-time"><span className="collection-label"><Clock3 size={15}/>TIME IN OTHER WORLDS</span><p><strong>{summary.recordedTitles?`~${Math.round(summary.hours).toLocaleString("en-US")}`:"Not logged"}</strong>{summary.recordedTitles>0&&<span>hours watched</span>}</p></div>
      <dl className="watch-counts"><div><dt>Titles</dt><dd>{anime.watched.length}</dd></div><div><dt>Current</dt><dd>{summary.current}</dd></div></dl>
    </section>
    <p className="watch-estimate">Estimate: {summary.episodes.toLocaleString("en-US")} recorded episodes × 24 minutes. Earlier seasons and rewatches may be missing; an episode in progress is excluded.</p>
    <div className="collection-heading"><span>THE COLLECTION</span>{anime.profile&&<a className="collection-link" href={anime.profile} target="_blank" rel="noopener noreferrer">Full profile <ArrowUpRight size={15}/><span className="sr-only">in a new tab</span></a>}</div>
    <ol className="anime-gallery">{sortedAnime(anime.watched).map((item,index)=>{
      const progress=animeProgress(item);
      return <li className="anime-card" key={`${item.title}-${index}`}>
        <div className="anime-poster"><Cover item={item}/><span className={`anime-status ${progress.status==="Current"?"is-current":""}`}>{progress.status}</span><span className="anime-index">{String(index+1).padStart(2,"0")}</span></div>
        <div className="anime-caption"><h3>{item.title}</h3><div className="anime-progress"><span>{progress.position||"Progress not recorded"}</span>{progress.hours!==null&&<span>~{Number(progress.hours.toFixed(1))} h</span>}</div>{item.source&&<a className="anime-catalog" href={item.source} target="_blank" rel="noopener noreferrer">Title details <ArrowUpRight size={12}/><span className="sr-only">for {item.title}, in a new tab</span></a>}</div>
      </li>;
    })}</ol>
    <p className="collection-note">Collection from Crunchyroll. Cover art belongs to its respective rights holders; each title links to its catalog source.</p>
  </div>;
}
