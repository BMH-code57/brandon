import type {Workout,WorkoutSet} from "@/lib/gym";

const record=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const text=(value:unknown,max=1000)=>typeof value==="string"?value.slice(0,max):"";
const number=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)&&value>=0?value:null;
const date=(value:unknown)=>typeof value==="string"&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():"";
const list=(value:unknown)=>Array.isArray(value)?value:[];

export function normalizeWorkout(value:unknown):Workout {
  const workout=record(value);
  return {id:text(workout.id,100),title:text(workout.title,160)||"Workout",description:text(workout.description),startTime:date(workout.start_time),endTime:date(workout.end_time),exercises:list(workout.exercises).slice(0,100).map((value,index)=>{
    const exercise=record(value);
    return {id:text(exercise.exercise_template_id,100)||text(exercise.title,160)||`exercise-${index}`,title:text(exercise.title,160)||"Exercise",notes:text(exercise.notes),sets:list(exercise.sets).slice(0,100).map(value=>{
      const set=record(value);
      return {type:text(set.type,30)||"normal",weightKg:number(set.weight_kg),reps:number(set.reps),distanceMeters:number(set.distance_meters),durationSeconds:number(set.duration_seconds),rpe:number(set.rpe),customMetric:number(set.custom_metric)} satisfies WorkoutSet;
    })};
  })};
}
export class HevyError extends Error {
  code:"credentials"|"rate_limit"|"unavailable";
  constructor(code:"credentials"|"rate_limit"|"unavailable") {super(code);this.code=code;}
}
export async function loadHevyPage(apiKey:string,page:number,fetcher:typeof fetch=fetch) {
  const response=await fetcher(`https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=10`,{
    method:"GET",headers:{"api-key":apiKey,Accept:"application/json"},redirect:"error",cache:"no-store",signal:AbortSignal.timeout(12000),
  });
  if(response.status===401||response.status===403)throw new HevyError("credentials");
  if(response.status===429)throw new HevyError("rate_limit");
  if(!response.ok)throw new HevyError("unavailable");
  const data=record(await response.json());
  if(!Array.isArray(data.workouts)||!Number.isSafeInteger(data.page_count)||Number(data.page_count)<0||data.page!==page)throw new HevyError("unavailable");
  return {connected:true as const,page,pageCount:Number(data.page_count),workouts:data.workouts.map(normalizeWorkout).filter(workout=>workout.id),fetchedAt:new Date().toISOString()};
}
