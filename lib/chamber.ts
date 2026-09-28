export type ChamberId = "league" | "anime" | "gym" | "observatory";
export const chamberCorners = [
  {id:"league",title:"League tower",eyebrow:"01 / THE RIFT",intro:"A record of games, seasons, and time on the Rift.",x:410,y:410,artX:365,artY:365,width:175,height:205,asset:"league-tower",labelY:390},
  {id:"anime",title:"Anime shelf",eyebrow:"02 / AFTER HOURS",intro:"My anime collection, from current watches to old favorites.",x:1120,y:410,artX:1170,artY:365,width:190,height:165,asset:"anime-shelf",labelY:390},
  {id:"gym",title:"The gym",eyebrow:"03 / THE TRAINING GROUND",intro:"Daily workouts, working sets, and a little progress at a time.",x:450,y:610,artX:395,artY:650,width:190,height:140,asset:"bench-press",labelY:670},
  {id:"observatory",title:"Under construction",eyebrow:"04 / THE EAST ALCOVE",intro:"A little room for whatever comes next.",x:1090,y:610,artX:1140,artY:650,width:180,height:135,asset:"construction",labelY:670},
] as const;
export function isChamberWalkable(x:number,y:number) {
  return ((x-768)/565)**2+((y-480)/285)**2<1 && !(y>700&&x>645&&x<885);
}
export function nearbyChamberCorner(x:number,y:number):ChamberId|null {
  const closest=chamberCorners.map(corner=>({id:corner.id,distance:Math.hypot(corner.x-x,corner.y-y)})).sort((a,b)=>a.distance-b.distance)[0];
  return closest.distance<155?closest.id:null;
}
export type AnimeTitle = {title:string;year:string;note:string;cover:string|null;source:string|null;episodesWatched:number|null};
export type ChampionMastery = {name:string;level:number;points:number;portrait:string|null};
export type ChamberContent = {
  league:{riotId:string;opgg:string|null;yearinlol:string|null;seasons:{year:string;summary:string}[];snapshot:{hoursPlayed:number|null;rank:string;recordedAt:string;source:string}|null;mastery:ChampionMastery[]};
  anime:{profile:string|null;watched:AnimeTitle[]};
};
