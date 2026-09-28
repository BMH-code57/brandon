"use client";
import {useEffect,useState} from "react";
import {Construction,RefreshCw} from "lucide-react";
import type {ChamberContent,ChamberId} from "@/lib/chamber";
import GymContent from "@/components/gym-content";
import AnimeCollection from "@/components/anime-collection";
import LeagueCollection from "@/components/league-collection";

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
  if(corner==="league")return <LeagueCollection league={content.league}/>;
  return <AnimeCollection anime={content.anime}/>;
}
