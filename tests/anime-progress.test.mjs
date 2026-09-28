import test from 'node:test';
import assert from 'node:assert/strict';
import {animeProgress,animeWatchSummary} from '../lib/anime-progress.ts';
const entry=(note,episodesWatched=null)=>({title:'Example',note,year:'',cover:null,source:null,episodesWatched});

test('watch time excludes resume episodes, unknown starts, and unconfirmed season offsets',()=>{
  assert.deepEqual(animeProgress(entry('Continue: S2 E13')),{status:'Current',position:'S2 · E13',episodes:12,hours:4.8});
  assert.equal(animeProgress(entry('Watch Again: E24')).episodes,24);
  assert.equal(animeProgress(entry('Start Watching: E12')).hours,null);
  assert.equal(animeProgress(entry('Up Next: E1')).hours,null);
  assert.equal(animeProgress(entry('Continue: E1')).hours,0);
  assert.equal(animeProgress(entry('Continue: E5',30)).episodes,30);
  const summary=animeWatchSummary([entry('Continue: E13'),entry('Watch Again: E24'),entry('Start Watching: E12')]);
  assert.equal(summary.episodes,36);assert.equal(summary.hours,14.4);assert.equal(summary.current,1);assert.equal(summary.recordedTitles,2);
});
