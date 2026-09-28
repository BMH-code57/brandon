import test from 'node:test';
import assert from 'node:assert/strict';
import {chamberCorners,isChamberWalkable,nearbyChamberCorner} from '../lib/chamber.ts';
import {parseChamberContent} from '../lib/server/chamber-content.ts';

test('all four corners can be reached from the chamber spawn',()=>{
  for(const corner of chamberCorners){
    for(let i=0;i<=100;i++)assert.equal(isChamberWalkable(768+(corner.x-768)*i/100,655+(corner.y-655)*i/100),true);
    assert.equal(nearbyChamberCorner(corner.x,corner.y),corner.id);
  }
  assert.equal(nearbyChamberCorner(768,680),null);
});
test('private collections tolerate missing input and reject unsafe profile URLs',()=>{
  for(const raw of [undefined,'broken','null','[]'])assert.deepEqual(parseChamberContent(raw),{league:{riotId:'',opgg:null,yearinlol:null,seasons:[]},anime:{profile:null,watched:[]}});
  const data=parseChamberContent(JSON.stringify({league:{opgg:'javascript:alert(1)',yearinlol:'https://yearin.lol.evil.test/user'},anime:{profile:'https://user:pass@anilist.co/user/example',watched:[null,{title:'Test title',year:'2025'}]}}));
  assert.equal(data.league.opgg,null);assert.equal(data.league.yearinlol,null);assert.equal(data.anime.profile,null);
  assert.equal(data.anime.watched.length,1);assert.equal(data.anime.watched[0].title,'Test title');
  assert.equal(parseChamberContent(JSON.stringify({league:{opgg:'https://www.op.gg/summoners/na/test'},anime:{profile:'https://anilist.co/user/example'}})).league.opgg,'https://www.op.gg/summoners/na/test');
});
