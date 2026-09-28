"use client";
import {useEffect,useState} from "react";
import {ArrowUpRight,BookOpen,Construction,RefreshCw,Swords} from "lucide-react";
import type {ChamberContent,ChamberId} from "@/lib/chamber";
import GymContent from "@/components/gym-content";

export default function ChamberContentPanel({corner,onLocked}:{corner:ChamberId;onLocked:()=>void}) {
  const [content,setContent]=useState<ChamberContent|null>(null);
  const [error,setError]=useState(false);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(corner!=="league"&&corner!=="anime")return;
    const controller=new AbortController();setContent(null);setError(false);
    fetch("/api/secret/content",{cache:"no-store",credentials:"same-origin",signal:controller.signal})
      .then(async response=>{
        if(response.status===401){if(!controller.signal.aborted)onLocked();return;}
        if(!response.ok)throw new Error();
        const data=await response.json() as ChamberContent;
        if(!controller.signal.aborted)setContent(data);
      }).catch(()=>{if(!controller.signal.aborted)setError(true);});
    return()=>controller.abort();
  },[corner,retry,onLocked]);
  if(corner==="gym")return <GymContent onLocked={onLocked}/>;
  if(corner==="observatory")return <div className="chamber-empty"><Construction size={30}/><h3>Under construction</h3><p>This alcove is reserved for a future addition. Check back another time.</p></div>;
  if(error)return <div className="chamber-empty" role="alert"><p>This corner couldn't be loaded.</p><button className="primary-button" onClick={()=>setRetry(value=>value+1)}><RefreshCw size={15}/>Try again</button></div>;
  if(!content)return <p className="chamber-loading" role="status">Opening the collection...</p>;
  if(corner==="league")return <div className="chamber-collection">
    {content.league.riotId&&<p className="riot-id"><Swords size={18}/>{content.league.riotId}</p>}
    <div className="league-profiles">{[
      {name:"OP.GG",label:"MATCH HISTORY",description:"Ranks, champions, and recent games.",href:content.league.opgg},
      {name:"YearInLoL",label:"SEASON RECAP",description:"A look back at the year on the Rift.",href:content.league.yearinlol},
    ].map(profile=><article className="league-profile" key={profile.name}><span className="collection-label">{profile.label}</span><h3>{profile.name}</h3><p>{profile.description}</p>{profile.href?<a className="collection-link" href={profile.href} target="_blank" rel="noopener noreferrer">Open my stats <ArrowUpRight size={16}/><span className="sr-only">in a new tab</span></a>:<span className="collection-pending">Profile not linked yet</span>}</article>)}</div>
    {content.league.seasons.length>0&&<section className="season-records"><h3>Season journal</h3>{content.league.seasons.map((season,index)=><article key={index}><span>{season.year}</span><p>{season.summary}</p></article>)}</section>}
    <p className="collection-note">Live profiles open in a new tab. Season notes live here in the tower.</p>
  </div>;
  return <div className="chamber-collection">
    <div className="collection-heading"><span>{content.anime.watched.length} titles on the shelf</span>{content.anime.profile&&<a className="collection-link" href={content.anime.profile} target="_blank" rel="noopener noreferrer">Full profile <ArrowUpRight size={15}/><span className="sr-only">in a new tab</span></a>}</div>
    {content.anime.watched.length>0&&<p className="collection-note anime-source-note">From my Crunchyroll collection. Progress labels reflect the saved list, including shows in progress.</p>}
    {content.anime.watched.length?<ol className="anime-list">{content.anime.watched.map((anime,index)=><li key={index}><span className="anime-number">{String(index+1).padStart(2,"0")}</span><div><h3>{anime.title}</h3>{anime.year&&<span className="collection-label">{anime.year}</span>}{anime.note&&<p>{anime.note}</p>}</div></li>)}</ol>:<div className="chamber-empty"><BookOpen size={30}/><h3>The shelf is waiting.</h3><p>The watched list hasn't been added yet.</p></div>}
  </div>;
}
