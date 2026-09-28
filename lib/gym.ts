export type WorkoutSet = {type:string;weightKg:number|null;reps:number|null;distanceMeters:number|null;durationSeconds:number|null;rpe:number|null;customMetric:number|null};
export type WorkoutExercise = {id:string;title:string;notes:string;sets:WorkoutSet[]};
export type Workout = {id:string;title:string;description:string;startTime:string;endTime:string;exercises:WorkoutExercise[]};
export type GymPage = {connected:true;page:number;pageCount:number;workouts:Workout[];fetchedAt:string}|{connected:false};
export type BestSet = {exerciseId:string;title:string;date:string;set:WorkoutSet};

export function heaviestSets(workouts:Workout[]):BestSet[] {
  const best=new Map<string,BestSet>();
  for(const workout of workouts)for(const exercise of workout.exercises)for(const set of exercise.sets){
    if(set.type==="warmup"||set.weightKg===null||set.weightKg<=0||set.reps===null||set.reps<=0)continue;
    const previous=best.get(exercise.id);
    if(!previous||set.weightKg>previous.set.weightKg!||(set.weightKg===previous.set.weightKg&&set.reps>previous.set.reps!))best.set(exercise.id,{exerciseId:exercise.id,title:exercise.title,date:workout.startTime,set});
  }
  return [...best.values()].sort((a,b)=>a.title.localeCompare(b.title));
}
export function formatWeight(kg:number|null) {
  return kg===null?"Not logged":`${Number(kg.toFixed(1))} kg / ${Number((kg*2.2046226218).toFixed(1))} lb`;
}
