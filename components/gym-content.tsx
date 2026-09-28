"use client";
import {useEffect,useState} from "react";
import {Dumbbell,RefreshCw} from "lucide-react";
import {Tabs,TabsContent,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {formatWeight,heaviestSets,type GymPage,type Workout,type WorkoutSet} from "@/lib/gym";

function dateLabel(value:string) {return value?new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(value)):"Date not logged";}
function setDetails(set:WorkoutSet) {
  const parts=[];
  if(set.weightKg!==null)parts.push(formatWeight(set.weightKg));
  if(set.reps!==null)parts.push(`${set.reps} reps`);
  if(set.distanceMeters!==null)parts.push(`${set.distanceMeters} m`);
  if(set.durationSeconds!==null)parts.push(`${Math.floor(set.durationSeconds/60)}m ${Math.round(set.durationSeconds%60)}s`);
  if(set.rpe!==null)parts.push(`RPE ${set.rpe}`);
  if(set.customMetric!==null)parts.push(`Custom metric: ${set.customMetric}`);
  return parts.join(" · ")||"No measurements logged";
}
export default function GymContent({onLocked}:{onLocked:()=>void}) {
  const [workouts,setWorkouts]=useState<Workout[]>([]);
  const [requestedPage,setRequestedPage]=useState(1);
  const [page,setPage]=useState(0);
  const [pageCount,setPageCount]=useState(0);
  const [connected,setConnected]=useState<boolean|null>(null);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState("");
  const [retry,setRetry]=useState(0);
  const [updated,setUpdated]=useState("");
  useEffect(()=>{
    const controller=new AbortController();setBusy(true);setError("");
    fetch(`/api/secret/gym?page=${requestedPage}`,{credentials:"same-origin",cache:"no-store",signal:controller.signal}).then(async response=>{
      if(controller.signal.aborted)return;
      if(response.status===401){onLocked();return;}
      const data=await response.json() as GymPage&{error?:string};
      if(!response.ok)throw new Error(data.error||"Workouts couldn't be loaded.");
      if(controller.signal.aborted)return;
      setConnected(data.connected);
      if(data.connected){
        setWorkouts(previous=>[...new Map([...previous,...data.workouts].map(workout=>[workout.id,workout])).values()].sort((a,b)=>b.startTime.localeCompare(a.startTime)));
        setPage(data.page);setPageCount(data.pageCount);setUpdated(data.fetchedAt);
      }
    }).catch(error=>{if(!controller.signal.aborted)setError(error instanceof Error?error.message:"Workouts couldn't be loaded.");}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[requestedPage,retry,onLocked]);
  const best=heaviestSets(workouts);
  return <div className="gym-content">
    <section className="gym-hero"><div><span className="collection-label"><Dumbbell size={15}/>THE TRAINING JOURNAL</span><h3>Another rep.</h3><p>Sessions & personal bests.</p></div><img src="/assets/gym-adventurer.png" alt="The purple hooded adventurer lying on a bench and pressing a loaded barbell overhead"/></section>
    {connected===false&&<div className="chamber-empty"><Dumbbell size={32}/><h3>The training journal is getting ready.</h3><p>Workout history and best sets will appear here once Hevy is connected.</p></div>}
    {workouts.length>0&&<>
      <div className="gym-summary"><div><strong>{workouts.length}</strong><span>workouts loaded</span></div><div><strong>{best.length}</strong><span>weighted exercises</span></div></div>
      <Tabs defaultValue="history" className="gym-tabs"><TabsList aria-label="Workout views"><TabsTrigger value="history">Workout history</TabsTrigger><TabsTrigger value="best">Best sets</TabsTrigger></TabsList>
        <TabsContent value="history"><div className="workout-list">{workouts.map(workout=><article className="workout-card" key={workout.id}>
          <div className="workout-heading"><span className="collection-label">{dateLabel(workout.startTime)}</span><h3>{workout.title}</h3>{workout.startTime&&workout.endTime&&Date.parse(workout.endTime)>=Date.parse(workout.startTime)&&<span>{Math.round((Date.parse(workout.endTime)-Date.parse(workout.startTime))/60000)} min · {workout.exercises.length} exercises</span>}</div>
          {workout.description&&<p className="workout-note">{workout.description}</p>}
          <details><summary>View exercises and sets</summary>{workout.exercises.map((exercise,index)=><section className="workout-exercise" key={`${exercise.id}-${index}`}><h4>{exercise.title}</h4>{exercise.notes&&<p className="workout-note">{exercise.notes}</p>}<ol>{exercise.sets.map((set,index)=><li key={index}><span className="set-number">{index+1}</span><span>{setDetails(set)}<small>{set.type}</small></span></li>)}</ol></section>)}</details>
        </article>)}</div></TabsContent>
        <TabsContent value="best"><p className="collection-note">Heaviest working set per exercise, with reps breaking ties. Warm-ups are excluded. Based on {workouts.length} loaded workouts{page<pageCount?"; load more below to include older sessions":""}. This measures recorded load, not estimated strength.</p>{best.length?<div className="best-set-list">{best.map(item=><article key={item.exerciseId}><h3>{item.title}</h3><strong>{formatWeight(item.set.weightKg)} × {item.set.reps}</strong><span>{dateLabel(item.date)}</span></article>)}</div>:<p className="collection-note">No weighted working sets in these sessions.</p>}</TabsContent>
      </Tabs>
    </>}
    {connected&&workouts.length===0&&!busy&&!error&&<div className="chamber-empty"><Dumbbell size={30}/><h3>No workouts yet.</h3><p>Logged Hevy sessions will appear here.</p></div>}
    {busy&&<p role="status" className="gym-loading">Loading workouts...</p>}
    {error&&<div className="gym-error" role="alert"><p>{error}</p><button className="primary-button" onClick={()=>setRetry(value=>value+1)}><RefreshCw size={15}/>Try again</button></div>}
    {!busy&&!error&&page>0&&page<pageCount&&<button className="primary-button gym-more" onClick={()=>setRequestedPage(page+1)}>Load more workouts</button>}
    {updated&&<p className="collection-note">Read from Hevy · {dateLabel(updated)}. Data refreshes when you reopen the journal.</p>}
  </div>;
}
