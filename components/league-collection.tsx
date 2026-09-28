import {ArrowUpRight,Diamond,Swords} from "lucide-react";
import type {ChamberContent} from "@/lib/chamber";

const number=(value:number)=>value.toLocaleString("en-US");
export default function LeagueCollection({league}:{league:ChamberContent["league"]}) {
  const snapshot=league.snapshot;
  const totalPoints=league.mastery.reduce((sum,champion)=>sum+champion.points,0);
  return <div className="league-collection">
    <section className="rift-record">
      <div className="rift-identity"><span className="collection-label"><Swords size={15}/>LEAGUE OF LEGENDS</span><h3>{league.riotId||"My time on the Rift"}</h3><p>One more game.</p></div>
      <img className="rift-tower" src="/assets/league-tower.png" alt=""/>
      <div className="rift-stats"><div className="rift-hours"><strong>{snapshot?.hoursPlayed!==null&&snapshot?.hoursPlayed!==undefined?number(snapshot.hoursPlayed):"Not logged"}</strong><span>hours on the Rift</span></div>{snapshot?.rank&&<div className="rift-rank"><Diamond size={22}/><div><strong>{snapshot.rank}</strong><span>recorded rank</span></div></div>}</div>
      {snapshot&&<p className="rift-source">{snapshot.source}{snapshot.recordedAt?` · ${snapshot.recordedAt}`:""} · Saved snapshot</p>}
    </section>
    <div className="rift-profile-links">{[{name:"OP.GG",label:"Rank & match history",href:league.opgg},{name:"YearInLoL",label:"The year on the Rift",href:league.yearinlol}].filter(profile=>profile.href).map(profile=><a href={profile.href!} className="rift-profile-link" key={profile.name} target="_blank" rel="noopener noreferrer"><div><span>{profile.label}</span><strong>{profile.name}</strong></div><ArrowUpRight size={21}/><span className="sr-only">in a new tab</span></a>)}</div>
    {league.mastery.length>0&&<section className="mastery-section"><div className="mastery-heading"><div><span className="collection-label">THE REGULARS</span><h3>Champion mastery</h3></div><p><strong>{number(totalPoints)}</strong><span>points across these {league.mastery.length} champions</span></p></div>
      <ol className="mastery-grid">{league.mastery.map((champion,index)=><li className="mastery-card" key={champion.name}><div className="mastery-portrait">{champion.portrait&&<img src={champion.portrait} alt="" loading="lazy" referrerPolicy="no-referrer"/>}<span>Lv. {champion.level}</span></div><div className="mastery-copy"><span className="mastery-index">{String(index+1).padStart(2,"0")}</span><h4>{champion.name}</h4><p>{number(champion.points)} <span>pts</span></p></div><div className="mastery-track" aria-hidden="true"><span style={{width:`${totalPoints?champion.points/Math.max(...league.mastery.map(c=>c.points))*100:0}%`}}/></div></li>)}</ol>
      <p className="collection-note">Mastery from my saved screenshot{snapshot?.recordedAt?` · ${snapshot.recordedAt}`:""}. Visit OP.GG for current stats. Champion artwork © Riot Games.</p>
    </section>}
    <figure className="league-receipt"><div><span className="collection-label">THE RECEIPT</span><h3>Time well spent?</h3><p>Noob Hours{snapshot?.recordedAt?` · ${snapshot.recordedAt}`:""}</p><a className="collection-link" href="/api/secret/receipt" target="_blank" rel="noopener noreferrer">Open full image <ArrowUpRight size={15}/><span className="sr-only">in a new tab</span></a></div><a className="receipt-image" href="/api/secret/receipt" target="_blank" rel="noopener noreferrer" aria-label="Open the Noob Hours receipt in a new tab"><img src="/api/secret/receipt" alt="My Noob Hours League of Legends receipt with total hours played and recorded rank" loading="lazy" width={768} height={1270}/></a></figure>
    {league.seasons.length>0&&<section className="season-records"><h3>Season journal</h3>{league.seasons.map((season,index)=><article key={index}><span>{season.year}</span><p>{season.summary}</p></article>)}</section>}
    <p className="collection-note">This fan project uses Riot Games artwork under the <a className="collection-link" href="https://www.riotgames.com/en/legal" target="_blank" rel="noopener noreferrer">Legal Jibber Jabber policy</a>. Riot Games does not endorse or sponsor this project.</p>
  </div>;
}
