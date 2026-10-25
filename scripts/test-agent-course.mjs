import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { readPosition, nextPosition, safeChecks, filterReplay, seconds } from '../agentcourse/model.mjs';
const data = JSON.parse(readFileSync(new URL('../agentcourse/course-data.json', import.meta.url)));
const root = new URL('../public', import.meta.url);

test('30 steps are bounded and invalid deep links recover', () => {
  assert.deepEqual(readPosition('?lesson=-4&step=wrong'), {lesson:0,step:0,present:false});
  assert.deepEqual(readPosition('?lesson=44&step=88&present=1'), {lesson:4,step:5,present:true});
  assert.deepEqual(readPosition('?lesson=4&step=3'), {lesson:3,step:2,present:false});
  assert.deepEqual(nextPosition(0,0,-1),{lesson:0,step:0});
  assert.deepEqual(nextPosition(0,5,1),{lesson:1,step:0});
  assert.deepEqual(nextPosition(4,5,1),{lesson:4,step:5});
});
test('corrupt or stale saved checks cannot become completion',()=>{
  for (const value of [null,[],true,'ok']) assert.deepEqual(safeChecks(value,['1-1']),{});
  assert.deepEqual(safeChecks({'1-1':true,'1-2':'true','bad':true},['1-1','1-2']),{'1-1':true});
});
test('recorded E04 fixture returns 4 then 2, excludes completed cancelled and future',()=>{
  const rows=data.lessons[3].rows;
  assert.equal(rows.length,8);
  assert.deepEqual(filterReplay(rows,'due').map(r=>r.DemoRequestId),['REQ-001','REQ-002','REQ-003','REQ-004']);
  assert.deepEqual(filterReplay(rows,'today').map(r=>r.DemoRequestId),['REQ-002','REQ-004']);
  assert.equal(filterReplay([{...rows[0],NeededBy:''}],'due').length,0);
});
test('each lesson has 3 tests, its download and all linked files exist',()=>{
  assert.equal(data.lessons.length,5);
  for (const lesson of data.lessons) {
    assert.equal(lesson.tests.length,3);
    assert.ok(existsSync(new URL('.'+lesson.download,root+'/')));
    for(const f of lesson.files) assert.ok(existsSync(new URL('.'+f.href,root+'/')),f.href);
    assert.match(lesson.video.id,/^[\w-]{11}$/);
    for(const ch of lesson.video.chapters) assert.ok(Number.isFinite(seconds(ch.time)));
  }
});
test('all distributed text excludes internal tenant and organization identities',()=>{
  function scan(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=new URL(e.name+(e.isDirectory()?'/':''),dir);if(e.isDirectory())scan(p);else if(/\.(txt|md|csv|json|html|tsx)$/.test(e.name)){
    const txt=readFileSync(p,'utf8');
    assert.doesNotMatch(txt,/Hewlett|hp\.sharepoint|ca7981a2|Default-[a-f\d]{8}-|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,p.pathname);
  }}}
  scan(new URL('../public/copilot-agent-course/',import.meta.url));
  scan(new URL('../agentcourse/',import.meta.url));
});
