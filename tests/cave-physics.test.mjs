import test from 'node:test';
import assert from 'node:assert/strict';
import {landmarks} from '../lib/portfolio.ts';
import { isWalkable, movePlayer } from '../lib/cave-physics.ts';

test('starting point and all interaction zones are on the floor', () => {
  for (const [x, y] of [[768,690], ...landmarks.map(l=>[l.x,l.y])]) assert.equal(isWalkable(x,y), true);
});
test('sustained movement in every direction cannot cross a cave wall', () => {
  for (const [dx,dy] of [[5,0],[-5,0],[0,5],[0,-5],[4,4],[-4,4],[4,-4],[-4,-4]]) {
    let position = {x:768,y:690};
    for(let i=0;i<600;i++) { position=movePlayer(position.x,position.y,dx,dy); assert.equal(isWalkable(position.x,position.y),true); }
  }
});
test('movement slides along a wall without trapping the character', () => {
  const result=movePlayer(1300,545,100,5);
  assert.equal(result.x,1300); assert.equal(result.y,550);
  const escape=movePlayer(result.x,result.y,0,5);
  assert.equal(escape.y,555);
});
