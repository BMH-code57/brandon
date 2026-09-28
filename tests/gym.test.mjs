import test from 'node:test';
import assert from 'node:assert/strict';
import {heaviestSets,formatWeight} from '../lib/gym.ts';
import {normalizeWorkout,loadHevyPage} from '../lib/server/hevy.ts';

const rawWorkout={id:'workout-1',title:'Test session',start_time:'2026-09-25T16:00:00Z',end_time:'2026-09-25T17:00:00Z',exercises:[{title:'Bench Press',exercise_template_id:'bench',sets:[
 {type:'warmup',weight_kg:150,reps:1},
 {type:'normal',weight_kg:80,reps:8},
 {type:'normal',weight_kg:80,reps:10},
 {type:'normal',weight_kg:null,reps:30},
]}]};
test('best sets exclude warm-ups, break load ties with reps, and keep null measurements',()=>{
 const workout=normalizeWorkout(rawWorkout),best=heaviestSets([workout]);
 assert.equal(best.length,1);assert.equal(best[0].set.weightKg,80);assert.equal(best[0].set.reps,10);
 assert.equal(workout.exercises[0].sets[3].weightKg,null);
 assert.equal(formatWeight(100),'100 kg / 220.5 lb');
});
test('Hevy connector uses documented read-only pagination and does not return the key',async()=>{
 let observed;
 const page=await loadHevyPage('fixture-api-key',2,async(url,init)=>{observed={url,init};return Response.json({page:2,page_count:3,workouts:[rawWorkout]});});
 assert.equal(observed.url,'https://api.hevyapp.com/v1/workouts?page=2&pageSize=10');
 assert.equal(observed.init.method,'GET');assert.equal(observed.init.headers['api-key'],'fixture-api-key');
 assert.equal(observed.init.redirect,'error');assert.equal(page.pageCount,3);assert.equal(page.workouts[0].id,'workout-1');
 assert.equal(JSON.stringify(page).includes('fixture-api-key'),false);
 await assert.rejects(()=>loadHevyPage('fixture-api-key',1,async()=>new Response('private upstream details',{status:401})),error=>error.code==='credentials'&&!error.message.includes('private'));
 await assert.rejects(()=>loadHevyPage('fixture-api-key',1,async()=>new Response('',{status:429})),error=>error.code==='rate_limit');
});
