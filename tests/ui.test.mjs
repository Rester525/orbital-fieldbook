import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const read = p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
test('mission board preserves missing weeks, SELF and safe evidence',async()=>{
 const file=new URL('../public/js/missions-ui.js',import.meta.url);assert.ok(existsSync(file),'mission module exists');
 const {boardHTML,missionHTML,lessonIdsForWeek}=await import(file);
 const data={schedule:read('../public/data/schedule.json'),lessons:[{id:'world-mars',title:'Mars',category:'world'}]};
 const state={missions:{},schedule:[],attempts:[],recall:{}};
 const html=boardHTML(data,state);assert.equal((html.match(/class="mission-row/g)||[]).length,11);assert.match(html,/Not supplied/);
 const self=missionHTML(data,state,4);assert.match(self,/without a meeting/);assert.match(self,/not sent/);assert.ok(!self.includes('required meeting'));
 assert.ok(lessonIdsForWeek(data.lessons,2).includes('world-mars'));
 state.missions['4']={steps:[false,false,false,false],evidence:'<script>bad</script>'};assert.ok(!missionHTML(data,state,4).includes('<script>'));
});
test('notes render exactly four escaped faces, and validate imports',async()=>{
 const file=new URL('../public/js/notes-ui.js',import.meta.url);assert.ok(existsSync(file),'notes module exists');
 const {notesHTML,parseNotes}=await import(file);
 const html=notesHTML({notes:['<script>','','','']});assert.equal((html.match(/class="note-face"/g)||[]).length,4);assert.ok(!html.includes('<script>'));assert.match(html,/8.5/);assert.throws(()=>parseNotes('{"schemaVersion":2,"notes":[]}'));
 assert.deepEqual(parseNotes(JSON.stringify({schemaVersion:1,notes:['a','b','c','d']})),['a','b','c','d']);
});
const base = new URL('../public/js/view.js', import.meta.url);
test('safe rendering and link protocols', async()=>{
 assert.ok(existsSync(base), 'view module must exist');
 const {esc,safeUrl,sourceList}=await import(base);
 assert.equal(esc('<script>"&'), '&lt;script&gt;&quot;&amp;');
 assert.equal(safeUrl('javascript:alert(1)'), '#');
 assert.equal(safeUrl('https://science.nasa.gov/'), 'https://science.nasa.gov/');
 assert.ok(!sourceList([{url:'javascript:alert(1)',title:'<img>',locator:'Facts'}]).includes('<img>'));
});
